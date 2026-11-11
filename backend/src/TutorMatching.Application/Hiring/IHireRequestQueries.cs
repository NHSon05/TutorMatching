namespace TutorMatching.Application.Hiring;

public interface IHireRequestQueries
{
    Task<HirePage> ListAsync(string? status, string? cursor, int pageSize, CancellationToken ct);
    Task<HireDetail> DetailAsync(Guid id, CancellationToken ct);
    Task<HirePaymentsResponse> PaymentsAsync(Guid id, CancellationToken ct);
    Task<PublicTutorReviewsResponse> PublicReviewsAsync(Guid tutorProfileId, int pageSize, CancellationToken ct);
}
