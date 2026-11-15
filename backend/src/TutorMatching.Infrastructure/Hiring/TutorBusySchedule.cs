using Microsoft.EntityFrameworkCore;
using TutorMatching.Domain.Tutors;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Infrastructure.Hiring;

/// <summary>
/// Weekly windows a tutor has already committed to: the agreed schedule of every ACCEPTED request.
/// Pending/negotiating requests do not reserve time; completed, cancelled and rejected ones release it.
/// </summary>
internal static class TutorBusySchedule
{
    public const string AcceptedStatus = "ACCEPTED";

    public static async Task<IReadOnlyList<WeeklyWindow>> LoadAsync(ApplicationDbContext db, Guid tutorProfileId,
        Guid? excludeRequestId, CancellationToken ct)
    {
        var accepted = await db.HireRequests.AsNoTracking()
            .Where(r => r.TutorProfileId == tutorProfileId && r.StatusCode == AcceptedStatus &&
                        (excludeRequestId == null || r.Id != excludeRequestId))
            .Select(r => new
            {
                r.FinalAgreement,
                // Legacy accepted rows predate the agreement snapshot; their schedule rows are the agreement.
                Legacy = r.Schedules.Select(s => new { s.DayOfWeek, s.StartTime, s.EndTime }).ToList()
            })
            .ToListAsync(ct);

        return WeeklyAvailability.Merge(accepted.SelectMany(r => r.FinalAgreement is { } agreement
            ? agreement.Terms.Schedules.AsEnumerable()
            : r.Legacy.Select(s => new WeeklyWindow(s.DayOfWeek, s.StartTime, s.EndTime))));
    }
}
