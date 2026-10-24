namespace TutorMatching.Application.Administration;

public sealed record AdminUser(Guid Id, string FullName, string Email, string Role, string Status, Guid? TutorProfileId, string? TutorProfileStatus);
public sealed record AdminUsersPage(IReadOnlyList<AdminUser> Items, int TotalCount, int Page, int PageSize);
public enum ReviewOutcome { Succeeded, NotFound, Conflict }
public interface IAdminService
{
    Task<AdminUsersPage> GetUsersAsync(int page, int pageSize, CancellationToken cancellationToken);
    Task<ReviewOutcome> ReviewAsync(Guid profileId, Guid actorId, bool approve, Guid expectedVersion, string? note, CancellationToken cancellationToken);
}
