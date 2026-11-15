namespace TutorMatching.Application.Administration.Dashboard;

public sealed record SubjectDemand(Guid SubjectId, string Name, int RequestCount);

/// <summary>
/// One consistent read of operational counts. Every canonical key is present (zeros included);
/// nothing here is projected, trended or estimated.
/// </summary>
public sealed record DashboardSnapshot(
    DateTimeOffset AsOf,
    IReadOnlyDictionary<string, int> UsersByRole,
    IReadOnlyDictionary<string, int> TutorProfilesByStatus,
    IReadOnlyDictionary<string, int> HireRequestsByStatus,
    IReadOnlyList<SubjectDemand> TopSubjects);

public interface IAdminDashboardQuery
{
    public const int TopSubjectLimit = 5;
    public static readonly string[] Roles = ["LEARNER", "TUTOR", "ADMIN"];
    public static readonly string[] ProfileStatuses = ["DRAFT", "PENDING_REVIEW", "APPROVED", "REJECTED"];
    public static readonly string[] HireStatuses = ["PENDING", "NEGOTIATING", "ACCEPTED", "REJECTED", "CANCELLED", "COMPLETED"];

    Task<DashboardSnapshot> GetAsync(CancellationToken cancellationToken);
}
