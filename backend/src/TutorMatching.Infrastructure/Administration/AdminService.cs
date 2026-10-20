using Microsoft.EntityFrameworkCore;
using TutorMatching.Application.Administration;
using TutorMatching.Application.Abstractions;
using TutorMatching.Domain.Tutors;
using TutorMatching.Domain.Users;
using TutorMatching.Domain.Notifications;
using TutorMatching.Infrastructure.Auditing;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Infrastructure.Administration;

public sealed class AdminService(ApplicationDbContext db, IClock clock) : IAdminService
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

    public async Task<ReviewOutcome> ReviewAsync(Guid profileId, Guid actorId, bool approve, string? note, CancellationToken cancellationToken)
    {
        var strategy = db.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
            // Row lock makes concurrent decisions serialize; only the first pending decision succeeds.
            var profile = await db.TutorProfiles.FromSqlInterpolated($"SELECT * FROM tutor_profiles WHERE id = {profileId} FOR UPDATE")
                .SingleOrDefaultAsync(cancellationToken);
            if (profile is null) return ReviewOutcome.NotFound;
            if (profile.Status != TutorProfileStatus.PENDING_REVIEW) return ReviewOutcome.Conflict;
            var user = await db.Users.SingleAsync(u => u.Id == profile.UserId, cancellationToken);
            if (user.Role != AccountRole.TUTOR || user.Status != AccountStatus.ACTIVE) return ReviewOutcome.Conflict;
            var now = clock.UtcNow;
            var target = approve ? TutorProfileStatus.APPROVED : TutorProfileStatus.REJECTED;
            db.TutorProfileReviews.Add(new TutorProfileReview
            {
                Id = Guid.NewGuid(), TutorProfileId = profileId, ReviewerUserId = actorId,
                FromStatusCode = profile.Status.ToString(), ToStatusCode = target.ToString(), Note = note, ReviewedAt = now
            });
            profile.Status = target;
            profile.ApprovedAt = approve ? now : null;
            profile.UpdatedAt = now;
            db.AuditEvents.Add(new AuditEvent { Id = Guid.NewGuid(), ActorUserId = actorId,
                Action = approve ? "TutorApproved" : "TutorRejected", EntityType = "TutorProfile", EntityId = profileId.ToString(), CreatedAt = now });
            db.Notifications.Add(new Notification { Id = Guid.NewGuid(), UserId = profile.UserId,
                TypeCode = "TUTOR_PROFILE_REVIEWED", Title = approve ? "Hồ sơ đã được duyệt" : "Hồ sơ bị từ chối",
                Body = note, TutorProfileId = profileId, CreatedAt = now });
            await db.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);
            return ReviewOutcome.Succeeded;
        });
    }
}
