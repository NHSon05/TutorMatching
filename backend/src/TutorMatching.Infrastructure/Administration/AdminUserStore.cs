using Microsoft.EntityFrameworkCore;
using TutorMatching.Application.Abstractions;
using TutorMatching.Application.Administration;
using TutorMatching.Application.Administration.Users;
using TutorMatching.Domain.Users;
using TutorMatching.Infrastructure.Auditing;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Infrastructure.Administration;

public sealed class AdminUserStore(ApplicationDbContext db, IClock clock) : IAdminUserStore
{
    public const string LockedAction = "AccountLocked";
    public const string UnlockedAction = "AccountUnlocked";

    public async Task<AdminUsersPage> SearchAsync(SearchAdminUsersQuery query, CancellationToken cancellationToken)
    {
        var users = db.Users.AsNoTracking().Where(u => u.DeletedAt == null);
        if (query.Role is { } role) users = users.Where(u => u.Role == role);
        if (query.Status is { } status) users = users.Where(u => u.Status == status);
        if (query.Q is { Length: > 0 } q)
        {
            var pattern = $"%{q.Replace(@"\", @"\\").Replace("%", @"\%").Replace("_", @"\_")}%";
            users = users.Where(u => EF.Functions.ILike(u.FullName, pattern, @"\") ||
                                     EF.Functions.ILike(u.Email!, pattern, @"\"));
        }
        var total = await users.CountAsync(cancellationToken);
        var rows = await Project(users.OrderBy(u => u.CreatedAt).ThenBy(u => u.Id)
            .Skip((query.Page - 1) * query.PageSize).Take(query.PageSize)).ToListAsync(cancellationToken);
        return new(rows, total, query.Page, query.PageSize);
    }

    public Task<AdminUser?> GetAsync(Guid userId, CancellationToken cancellationToken) =>
        Project(db.Users.AsNoTracking().Where(u => u.Id == userId && u.DeletedAt == null))
            .SingleOrDefaultAsync(cancellationToken);

    public async Task<UpdateUserStatusResult> ChangeStatusAsync(Guid actorUserId, Guid targetUserId, Guid expectedVersion,
        AccountStatus status, CancellationToken cancellationToken)
    {
        var outcome = await db.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
        {
            db.ChangeTracker.Clear();
            await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
            // Row lock serializes concurrent lock/unlock and tutor-review decisions on the same account.
            var user = await db.Users.FromSqlInterpolated(
                    $"SELECT * FROM user_accounts WHERE id={targetUserId} FOR UPDATE")
                .SingleOrDefaultAsync(cancellationToken);
            if (user is null || user.DeletedAt is not null) return UserStatusFailure.NotFound;
            var source = status == AccountStatus.LOCKED ? AccountStatus.ACTIVE : AccountStatus.LOCKED;
            if (user.ConcurrencyVersion != expectedVersion || user.Status != source) return UserStatusFailure.Conflict;

            var now = clock.UtcNow;
            user.Status = status;
            user.ConcurrencyVersion = Guid.NewGuid();
            // A new stamp invalidates every outstanding access/refresh token; unlock therefore
            // never revives sessions issued before the lock.
            user.SecurityStamp = Guid.NewGuid().ToString("N").ToUpperInvariant();
            user.ConcurrencyStamp = Guid.NewGuid().ToString();
            user.UpdatedAt = now;
            await db.TokenSessions.Where(s => s.UserId == targetUserId && s.RevokedAt == null)
                .ExecuteUpdateAsync(s => s.SetProperty(x => x.RevokedAt, now), cancellationToken);
            db.AuditEvents.Add(new AuditEvent
            {
                Id = Guid.NewGuid(),
                ActorUserId = actorUserId,
                Action = status == AccountStatus.LOCKED ? LockedAction : UnlockedAction,
                EntityType = "UserAccount",
                EntityId = targetUserId.ToString(),
                CreatedAt = now
            });
            await db.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);
            return (UserStatusFailure?)null;
        });
        if (outcome is { } failure) return UpdateUserStatusResult.Fail(failure);
        db.ChangeTracker.Clear();
        return new(await GetAsync(targetUserId, cancellationToken));
    }

    private IQueryable<AdminUser> Project(IQueryable<ApplicationUser> users) =>
        from user in users
        join profile in db.TutorProfiles.AsNoTracking() on user.Id equals profile.UserId into profiles
        from profile in profiles.DefaultIfEmpty()
        select new AdminUser(user.Id, user.FullName, user.Email!, user.Role.ToString(), user.Status.ToString(),
            profile == null ? null : profile.Id, profile == null ? null : profile.Status.ToString(),
            user.ConcurrencyVersion);
}
