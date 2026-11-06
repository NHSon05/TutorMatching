using System.Collections.Concurrent;
using System.Globalization;
using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;
using TutorMatching.Application.Abstractions;
using TutorMatching.Application.Tutors;
using TutorMatching.Domain.Content;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Infrastructure.Storage;

public sealed class RedisDeduplicationService(IConnectionMultiplexer? multiplexer) : IRedisDeduplicationService
{
    public RedisDeduplicationService()
        : this(null)
    {
    }
    private static readonly TimeSpan ExactHashTtl = TimeSpan.FromHours(24);
    private static readonly TimeSpan SimHashTtl = TimeSpan.FromHours(48);
    private static readonly TimeSpan DefaultCachedResponseTtl = TimeSpan.FromHours(24);
    private static readonly TimeSpan RateLimitWindow = TimeSpan.FromMinutes(1);

    private readonly ConcurrentDictionary<string, (string Value, DateTimeOffset ExpiresAt)> memoryKv = new(StringComparer.Ordinal);
    private readonly ConcurrentDictionary<string, List<(ulong SimHash, Guid DemandPostId, DateTimeOffset ExpiresAt)>> memorySimHashes = new(StringComparer.Ordinal);
    private readonly ConcurrentDictionary<string, (int Count, DateTimeOffset ExpiresAt)> memoryRateLimits = new(StringComparer.Ordinal);

    private bool UseRedis => multiplexer is { IsConnected: true };

    public async Task<DeduplicationCheckResult> CheckAndRegisterAsync(
        string actorFingerprint,
        string rawContent,
        Guid candidateDemandPostId,
        CancellationToken cancellationToken = default)
    {
        var normalizedActor = NormalizeActorKey(actorFingerprint);
        var contentHash = ContentHashNormalizer.ComputeSha256(rawContent);
        var simHash = ContentHashNormalizer.ComputeSimHash(rawContent);

        var exactKey = $"demand:seen:{normalizedActor}:{contentHash}";
        var simHashKey = $"demand:simhash:{normalizedActor}";

        if (UseRedis)
        {
            var db = multiplexer!.GetDatabase();

            // 1. Atomic O(1) SetNX check for exact content hash
            var wasSet = await db.StringSetAsync(
                exactKey,
                candidateDemandPostId.ToString("D"),
                ExactHashTtl,
                When.NotExists);

            if (!wasSet)
            {
                var existingValue = await db.StringGetAsync(exactKey);
                if (existingValue.HasValue && Guid.TryParse(existingValue.ToString(), out var existingPostId))
                {
                    return new DeduplicationCheckResult(
                        IsDuplicate: true,
                        IsNearDuplicate: false,
                        DemandPostId: existingPostId,
                        ContentHash: contentHash,
                        SimHash: simHash);
                }
            }

            // 2. Check near-duplicate via SimHash entries for this actor within 48h
            var entries = await db.HashGetAllAsync(simHashKey);
            foreach (var entry in entries)
            {
                if (ulong.TryParse(entry.Name.ToString(), NumberStyles.HexNumber, CultureInfo.InvariantCulture, out var existingSimHash) &&
                    Guid.TryParse(entry.Value.ToString(), out var existingPostId) &&
                    existingPostId != candidateDemandPostId &&
                    ContentHashNormalizer.IsNearDuplicate(simHash, existingSimHash))
                {
                    // Point the exact key to the original near-duplicate post ID as well
                    await db.StringSetAsync(exactKey, existingPostId.ToString("D"), ExactHashTtl);
                    return new DeduplicationCheckResult(
                        IsDuplicate: true,
                        IsNearDuplicate: true,
                        DemandPostId: existingPostId,
                        ContentHash: contentHash,
                        SimHash: simHash);
                }
            }

            await db.HashSetAsync(
                simHashKey,
                simHash.ToString("X16", CultureInfo.InvariantCulture),
                candidateDemandPostId.ToString("D"),
                When.NotExists);
            await db.KeyExpireAsync(simHashKey, SimHashTtl);

            return new DeduplicationCheckResult(
                IsDuplicate: false,
                IsNearDuplicate: false,
                DemandPostId: candidateDemandPostId,
                ContentHash: contentHash,
                SimHash: simHash);
        }

        return CheckAndRegisterInMemory(exactKey, simHashKey, contentHash, simHash, candidateDemandPostId);
    }

    public async Task<RateLimitCheckResult> CheckRateLimitAsync(
        string actorFingerprint,
        int maxRequestsPerMinute = 10,
        CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow;
        var minuteBucket = now.ToUnixTimeSeconds() / 60;
        var key = $"demand:ratelimit:{NormalizeActorKey(actorFingerprint)}:{minuteBucket}";
        var retryAfter = TimeSpan.FromSeconds(Math.Max(1, 60 - (now.ToUnixTimeSeconds() % 60)));

        if (UseRedis)
        {
            var db = multiplexer!.GetDatabase();
            var currentCount = (int)await db.StringIncrementAsync(key);
            if (currentCount == 1)
            {
                await db.KeyExpireAsync(key, RateLimitWindow);
            }

            return new RateLimitCheckResult(
                IsAllowed: currentCount <= maxRequestsPerMinute,
                CurrentCount: currentCount,
                Limit: maxRequestsPerMinute,
                RetryAfter: currentCount <= maxRequestsPerMinute ? TimeSpan.Zero : retryAfter);
        }

        var entry = memoryRateLimits.AddOrUpdate(
            key,
            _ => (1, now.Add(RateLimitWindow)),
            (_, existing) => existing.ExpiresAt <= now
                ? (1, now.Add(RateLimitWindow))
                : (existing.Count + 1, existing.ExpiresAt));

        return new RateLimitCheckResult(
            IsAllowed: entry.Count <= maxRequestsPerMinute,
            CurrentCount: entry.Count,
            Limit: maxRequestsPerMinute,
            RetryAfter: entry.Count <= maxRequestsPerMinute ? TimeSpan.Zero : retryAfter);
    }

    public async Task CacheResponseJsonAsync(
        Guid demandPostId,
        string responseJson,
        TimeSpan? ttl = null,
        CancellationToken cancellationToken = default)
    {
        var key = $"demand:response:{demandPostId:D}";
        var effectiveTtl = ttl ?? DefaultCachedResponseTtl;

        if (UseRedis)
        {
            var db = multiplexer!.GetDatabase();
            await db.StringSetAsync(key, responseJson, effectiveTtl);
            return;
        }

        memoryKv[key] = (responseJson, DateTimeOffset.UtcNow.Add(effectiveTtl));
    }

    public async Task<string?> GetCachedResponseJsonAsync(
        Guid demandPostId,
        CancellationToken cancellationToken = default)
    {
        var key = $"demand:response:{demandPostId:D}";

        if (UseRedis)
        {
            var db = multiplexer!.GetDatabase();
            var value = await db.StringGetAsync(key);
            return value.HasValue ? value.ToString() : null;
        }

        if (memoryKv.TryGetValue(key, out var cached) && cached.ExpiresAt > DateTimeOffset.UtcNow)
        {
            return cached.Value;
        }

        return null;
    }

    private DeduplicationCheckResult CheckAndRegisterInMemory(
        string exactKey,
        string simHashKey,
        string contentHash,
        ulong simHash,
        Guid candidateDemandPostId)
    {
        var now = DateTimeOffset.UtcNow;

        if (memoryKv.TryGetValue(exactKey, out var existingExact) &&
            existingExact.ExpiresAt > now &&
            Guid.TryParse(existingExact.Value, out var exactPostId))
        {
            return new DeduplicationCheckResult(
                IsDuplicate: true,
                IsNearDuplicate: false,
                DemandPostId: exactPostId,
                ContentHash: contentHash,
                SimHash: simHash);
        }

        var list = memorySimHashes.GetOrAdd(simHashKey, _ => []);
        lock (list)
        {
            list.RemoveAll(item => item.ExpiresAt <= now);

            foreach (var item in list)
            {
                if (ContentHashNormalizer.IsNearDuplicate(simHash, item.SimHash))
                {
                    memoryKv[exactKey] = (item.DemandPostId.ToString("D"), now.Add(ExactHashTtl));
                    return new DeduplicationCheckResult(
                        IsDuplicate: true,
                        IsNearDuplicate: true,
                        DemandPostId: item.DemandPostId,
                        ContentHash: contentHash,
                        SimHash: simHash);
                }
            }

            memoryKv[exactKey] = (candidateDemandPostId.ToString("D"), now.Add(ExactHashTtl));
            list.Add((simHash, candidateDemandPostId, now.Add(SimHashTtl)));
        }

        return new DeduplicationCheckResult(
            IsDuplicate: false,
            IsNearDuplicate: false,
            DemandPostId: candidateDemandPostId,
            ContentHash: contentHash,
            SimHash: simHash);
    }

    private static string NormalizeActorKey(string actorFingerprint) =>
        string.IsNullOrWhiteSpace(actorFingerprint) ? "anonymous" : actorFingerprint.Trim().ToLowerInvariant();
}

public sealed class PublicDemandIngestionService(
    ApplicationDbContext dbContext,
    IRedisDeduplicationService deduplicationService) : IPublicDemandIngestionService
{
    public async Task<PublicDemandIngestionResult> IngestAsync(
        string actorFingerprint,
        string rawContent,
        Guid? requesterUserId = null,
        CancellationToken cancellationToken = default)
    {
        var candidateId = Guid.NewGuid();
        var dedup = await deduplicationService.CheckAndRegisterAsync(
            actorFingerprint,
            rawContent,
            candidateId,
            cancellationToken);

        if (dedup.IsDuplicate)
        {
            return new PublicDemandIngestionResult(
                DemandPostId: dedup.DemandPostId,
                IsDeduplicatedHit: true,
                IsNearDuplicate: dedup.IsNearDuplicate,
                ContentHash: dedup.ContentHash,
                SimHash: dedup.SimHash);
        }

        // Secondary fallback check against PostgreSQL in case Redis was cold/evicted
        var existingPostId = await dbContext.DemandPosts
            .AsNoTracking()
            .Where(x => x.ActorFingerprint == actorFingerprint.Trim() &&
                        x.ContentHash == dedup.ContentHash &&
                        x.Status == PostStatus.EXTRACTED)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => (Guid?)x.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (existingPostId.HasValue)
        {
            return new PublicDemandIngestionResult(
                DemandPostId: existingPostId.Value,
                IsDeduplicatedHit: true,
                IsNearDuplicate: false,
                ContentHash: dedup.ContentHash,
                SimHash: dedup.SimHash);
        }

        var post = DemandPost.Create(
            actorFingerprint: actorFingerprint,
            contentHash: dedup.ContentHash,
            rawContent: rawContent,
            requesterUserId: requesterUserId);

        post.Id = dedup.DemandPostId;
        post.MarkExtracted();

        dbContext.DemandPosts.Add(post);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new PublicDemandIngestionResult(
            DemandPostId: post.Id,
            IsDeduplicatedHit: false,
            IsNearDuplicate: false,
            ContentHash: dedup.ContentHash,
            SimHash: dedup.SimHash);
    }
}
