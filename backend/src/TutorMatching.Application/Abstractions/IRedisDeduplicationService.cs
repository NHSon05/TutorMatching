namespace TutorMatching.Application.Abstractions;

public sealed record DeduplicationCheckResult(
    bool IsDuplicate,
    bool IsNearDuplicate,
    Guid DemandPostId,
    string ContentHash,
    ulong SimHash);

public sealed record RateLimitCheckResult(
    bool IsAllowed,
    int CurrentCount,
    int Limit,
    TimeSpan RetryAfter);

public sealed record PublicDemandIngestionResult(
    Guid DemandPostId,
    bool IsDeduplicatedHit,
    bool IsNearDuplicate,
    string ContentHash,
    ulong SimHash);

public interface IRedisDeduplicationService
{
    Task<DeduplicationCheckResult> CheckAndRegisterAsync(
        string actorFingerprint,
        string rawContent,
        Guid candidateDemandPostId,
        CancellationToken cancellationToken = default);

    Task<RateLimitCheckResult> CheckRateLimitAsync(
        string actorFingerprint,
        int maxRequestsPerMinute = 10,
        CancellationToken cancellationToken = default);

    Task CacheResponseJsonAsync(
        Guid demandPostId,
        string responseJson,
        TimeSpan? ttl = null,
        CancellationToken cancellationToken = default);

    Task<string?> GetCachedResponseJsonAsync(
        Guid demandPostId,
        CancellationToken cancellationToken = default);
}

public interface IPublicDemandIngestionService
{
    Task<PublicDemandIngestionResult> IngestAsync(
        string actorFingerprint,
        string rawContent,
        Guid? requesterUserId = null,
        CancellationToken cancellationToken = default);
}
