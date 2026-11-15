using System.Data;
using Microsoft.EntityFrameworkCore;
using TutorMatching.Application.Abstractions;
using TutorMatching.Application.Administration.Dashboard;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Infrastructure.Administration;

public sealed class AdminDashboardQuery(ApplicationDbContext db, IClock clock) : IAdminDashboardQuery
{
    public async Task<DashboardSnapshot> GetAsync(CancellationToken cancellationToken)
    {
        return await db.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
        {
            // Repeatable read: all groups come from the same database snapshot.
            await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.RepeatableRead, cancellationToken);
            var asOf = clock.UtcNow;
            var roles = await db.Users.AsNoTracking().Where(u => u.DeletedAt == null)
                .GroupBy(u => u.Role).Select(g => new { Key = g.Key.ToString(), Count = g.Count() })
                .ToDictionaryAsync(x => x.Key, x => x.Count, cancellationToken);
            var profiles = await db.TutorProfiles.AsNoTracking()
                .GroupBy(p => p.Status).Select(g => new { Key = g.Key.ToString(), Count = g.Count() })
                .ToDictionaryAsync(x => x.Key, x => x.Count, cancellationToken);
            var requests = await db.HireRequests.AsNoTracking()
                .GroupBy(r => r.StatusCode).Select(g => new { g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Key, x => x.Count, cancellationToken);
            var subjects = await (from r in db.HireRequests.AsNoTracking()
                                  join s in db.Subjects.AsNoTracking() on r.SubjectId equals s.Id
                                  group r by new { s.Id, s.Name } into g
                                  orderby g.Count() descending, g.Key.Name, g.Key.Id
                                  select new SubjectDemand(g.Key.Id, g.Key.Name, g.Count()))
                .Take(IAdminDashboardQuery.TopSubjectLimit).ToListAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);
            return new DashboardSnapshot(asOf, Canonical(IAdminDashboardQuery.Roles, roles),
                Canonical(IAdminDashboardQuery.ProfileStatuses, profiles),
                Canonical(IAdminDashboardQuery.HireStatuses, requests), subjects);
        });
    }

    private static Dictionary<string, int> Canonical(string[] keys, Dictionary<string, int> counts) =>
        keys.ToDictionary(k => k, k => counts.GetValueOrDefault(k));
}
