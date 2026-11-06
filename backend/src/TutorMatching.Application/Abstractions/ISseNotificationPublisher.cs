namespace TutorMatching.Application.Abstractions;

public sealed record SsePostMatchedEvent(
    string EventId,
    Guid TutorProfileId,
    MatchedPostNotificationItemDto Payload);

public interface ISseNotificationPublisher
{
    Task<string> PublishAsync(
        Guid tutorProfileId,
        MatchedPostNotificationItemDto payload,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<SsePostMatchedEvent>> GetReplayEventsAfterAsync(
        Guid tutorProfileId,
        string? lastEventId,
        CancellationToken cancellationToken = default);

    IAsyncEnumerable<SsePostMatchedEvent> SubscribeAsync(
        Guid tutorProfileId,
        CancellationToken cancellationToken = default);
}
