namespace TutorMatching.Application.Hiring;

public interface IHireRequestQueries
{
    Task<HirePage> ListAsync(string? status, string? cursor, int pageSize, CancellationToken ct);
    Task<HireDetail> DetailAsync(Guid id, CancellationToken ct);
}
