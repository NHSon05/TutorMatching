using TutorMatching.Application.Administration;

namespace TutorMatching.Infrastructure.Administration;

public sealed class AdminService(Application.Tutors.ITutorReviewService reviews) : IAdminService
{
    // Sprint 1 routes share the versioned decision transaction.
    public async Task<ReviewOutcome> ReviewAsync(Guid profileId, Guid actorId, bool approve, Guid expectedVersion, string? note, CancellationToken cancellationToken)
    {
        var result = await reviews.DecideAsync(profileId, actorId, expectedVersion, approve ? "APPROVE" : "REJECT", note, cancellationToken);
        return result.Failure switch { Application.Tutors.ReviewFailure.NotFound => ReviewOutcome.NotFound,
            null => ReviewOutcome.Succeeded, _ => ReviewOutcome.Conflict };
    }
}
