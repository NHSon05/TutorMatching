using System.Collections.Concurrent;
using System.Globalization;
using System.Runtime.CompilerServices;
using System.Text.Json;
using System.Threading.Channels;
using StackExchange.Redis;
using TutorMatching.Application.Abstractions;

namespace TutorMatching.Infrastructure.Storage;

public sealed class RedisSseNotificationPublisher(IConnectionMultiplexer? multiplexer = null) : ISseNotificationPublisher
{
    private const int MaxReplayBufferSizePerTutor = 100;
    private static readonly TimeSpan ReplayTtl = TimeSpan.FromHours(24);
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly ConcurrentDictionary<Guid, List<SsePostMatchedEvent>> memoryReplayBuffer = new();
    private readonly ConcurrentDictionary<Guid, ConcurrentDictionary<Guid, Channel<SsePostMatchedEvent>>> localSubscribers = new();
    private long sequenceCounter = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

    public RedisSseNotificationPublisher()
        : this(null)
    {
    }

    private bool UseRedis => multiplexer is { IsConnected: true };

    public async Task<string> PublishAsync(
        Guid tutorProfileId,
        MatchedPostNotificationItemDto payload,
        CancellationToken cancellationToken = default)
    {
        var eventId = Interlocked.Increment(ref sequenceCounter).ToString(CultureInfo.InvariantCulture);
        var sseEvent = new SsePostMatchedEvent(eventId, tutorProfileId, payload);

        // 1. Store in local replay buffer
        var list = memoryReplayBuffer.GetOrAdd(tutorProfileId, _ => []);
        lock (list)
        {
            list.Add(sseEvent);
            if (list.Count > MaxReplayBufferSizePerTutor)
            {
                list.RemoveAt(0);
            }
        }

        // 2. Store in Redis sorted set (capped) and publish to Redis Pub/Sub if connected
        if (UseRedis)
        {
            var db = multiplexer!.GetDatabase();
            var replayKey = $"sse:replay:{tutorProfileId:D}";
            var serialized = JsonSerializer.Serialize(sseEvent, JsonOptions);

            if (double.TryParse(eventId, NumberStyles.Any, CultureInfo.InvariantCulture, out var score))
            {
                await db.SortedSetAddAsync(replayKey, serialized, score);
                await db.SortedSetRemoveRangeByRankAsync(replayKey, 0, -MaxReplayBufferSizePerTutor - 1);
                await db.KeyExpireAsync(replayKey, ReplayTtl);
            }

            var subscriber = multiplexer.GetSubscriber();
            await subscriber.PublishAsync(
                RedisChannel.Literal($"sse:tutor:{tutorProfileId:D}"),
                serialized);
        }

        // 3. Push immediately to all active local subscribers for this tutor
        if (localSubscribers.TryGetValue(tutorProfileId, out var channels))
        {
            foreach (var (_, channel) in channels)
            {
                channel.Writer.TryWrite(sseEvent);
            }
        }

        return eventId;
    }

    public async Task<IReadOnlyList<SsePostMatchedEvent>> GetReplayEventsAfterAsync(
        Guid tutorProfileId,
        string? lastEventId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(lastEventId) ||
            !long.TryParse(lastEventId.Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out var afterId))
        {
            return [];
        }

        if (UseRedis)
        {
            var db = multiplexer!.GetDatabase();
            var replayKey = $"sse:replay:{tutorProfileId:D}";
            var values = await db.SortedSetRangeByScoreAsync(
                replayKey,
                start: afterId + 1,
                stop: double.PositiveInfinity);

            var events = new List<SsePostMatchedEvent>();
            foreach (var val in values)
            {
                if (!val.HasValue)
                {
                    continue;
                }

                var parsed = JsonSerializer.Deserialize<SsePostMatchedEvent>(val.ToString(), JsonOptions);
                if (parsed is not null)
                {
                    events.Add(parsed);
                }
            }

            if (events.Count > 0)
            {
                return events;
            }
        }

        if (memoryReplayBuffer.TryGetValue(tutorProfileId, out var list))
        {
            lock (list)
            {
                return list
                    .Where(e => long.TryParse(e.EventId, NumberStyles.Integer, CultureInfo.InvariantCulture, out var id) && id > afterId)
                    .ToList();
            }
        }

        return [];
    }

    public async IAsyncEnumerable<SsePostMatchedEvent> SubscribeAsync(
        Guid tutorProfileId,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var subscriptionId = Guid.NewGuid();
        var channel = Channel.CreateUnbounded<SsePostMatchedEvent>(new UnboundedChannelOptions
        {
            SingleReader = true,
            SingleWriter = false,
        });

        var tutorSubs = localSubscribers.GetOrAdd(tutorProfileId, _ => new ConcurrentDictionary<Guid, Channel<SsePostMatchedEvent>>());
        tutorSubs[subscriptionId] = channel;

        ChannelMessageQueue? redisQueue = null;
        if (UseRedis)
        {
            var subscriber = multiplexer!.GetSubscriber();
            redisQueue = await subscriber.SubscribeAsync(RedisChannel.Literal($"sse:tutor:{tutorProfileId:D}"));
            redisQueue.OnMessage(message =>
            {
                if (!message.Message.HasValue)
                {
                    return;
                }

                try
                {
                    var parsed = JsonSerializer.Deserialize<SsePostMatchedEvent>(message.Message.ToString(), JsonOptions);
                    if (parsed is not null)
                    {
                        channel.Writer.TryWrite(parsed);
                    }
                }
                catch (JsonException)
                {
                    // Ignore malformed pub/sub frames
                }
            });
        }

        var deliveredEventIds = new HashSet<string>(StringComparer.Ordinal);

        try
        {
            await foreach (var item in channel.Reader.ReadAllAsync(cancellationToken))
            {
                if (deliveredEventIds.Add(item.EventId))
                {
                    yield return item;
                }
            }
        }
        finally
        {
            if (redisQueue is not null)
            {
                await redisQueue.UnsubscribeAsync();
            }

            tutorSubs.TryRemove(subscriptionId, out _);
            if (tutorSubs.IsEmpty)
            {
                localSubscribers.TryRemove(KeyValuePair.Create(tutorProfileId, tutorSubs));
            }

            channel.Writer.TryComplete();
        }
    }
}
