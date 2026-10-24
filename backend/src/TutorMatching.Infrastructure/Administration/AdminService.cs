using Microsoft.EntityFrameworkCore;
using TutorMatching.Application.Administration;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Infrastructure.Administration;

public sealed class AdminService(ApplicationDbContext db, Application.Tutors.ITutorReviewService reviews) : IAdminService
{
    public async Task<AdminUsersPage> GetUsersAsync(int page, int pageSize, CancellationToken cancellationToken)
    {
        var query = from user in db.Users.AsNoTracking()
                    join profile in db.TutorProfiles.AsNoTracking() on user.Id equals profile.UserId into profiles
                    from profile in profiles.DefaultIfEmpty()
                    select new { user, profile };
        var total = await query.CountAsync(cancellationToken);
        var rows = await query.OrderBy(x => x.user.CreatedAt).ThenBy(x => x.user.Id)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(x => new AdminUser(x.user.Id, x.user.FullName, x.user.Email!, x.user.Role.ToString(),
                x.user.Status.ToString(), x.profile == null ? null : x.profile.Id,
                x.profile == null ? null : x.profile.Status.ToString())).ToListAsync(cancellationToken);
        return new(rows, total, page, pageSize);
    }

    // Sprint 1 routes share the versioned decision transaction.
    public async Task<ReviewOutcome> ReviewAsync(Guid profileId, Guid actorId, bool approve, Guid expectedVersion, string? note, CancellationToken cancellationToken)
    {
        var result = await reviews.DecideAsync(profileId, actorId, expectedVersion, approve ? "APPROVE" : "REJECT", note, cancellationToken);
        return result.Failure switch { Application.Tutors.ReviewFailure.NotFound => ReviewOutcome.NotFound,
            null => ReviewOutcome.Succeeded, _ => ReviewOutcome.Conflict };
    }
}
