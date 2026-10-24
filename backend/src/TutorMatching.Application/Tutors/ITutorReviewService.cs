namespace TutorMatching.Application.Tutors;

public sealed record ReviewQueueItem(Guid Id, string DisplayName, string AccountStatus, DateTimeOffset? SubmittedAt, Guid Version);
public sealed record ReviewQueuePage(IReadOnlyList<ReviewQueueItem> Items, int TotalCount, int Page, int PageSize);
public sealed record ReviewHistory(Guid Id, Guid ReviewerId, string Action, Guid? ReviewedVersion,
    string FromStatus, string ToStatus, string? Note, DateTimeOffset ReviewedAt);
public sealed record ReviewSubject(Guid SubjectId, string Name, IReadOnlyList<string> Levels);
public sealed record TutorReviewDetail(Guid Id, string AccountStatus, TutorOnboardingData Profile,
    IReadOnlyList<ReviewHistory> History, IReadOnlyList<ReviewSubject> Subjects, string? ProvinceName, string? DistrictName);
public enum ReviewFailure { NotFound, Conflict, Invalid }
public sealed record ReviewDecisionResult(string? Status, Guid? Version, ReviewFailure? Failure = null);
public interface ITutorReviewService
{
    Task<ReviewQueuePage> QueueAsync(int page, int pageSize, CancellationToken ct);
    Task<TutorReviewDetail?> DetailAsync(Guid profileId, CancellationToken ct);
    Task<IReadOnlyList<ReviewHistory>> HistoryAsync(Guid ownerId, CancellationToken ct);
    Task<ReviewDecisionResult> DecideAsync(Guid profileId, Guid actorId, Guid expectedVersion, string action, string? note, CancellationToken ct);
}
