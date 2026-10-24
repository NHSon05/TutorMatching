using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TutorMatching.Application.Tutors;
using TutorMatching.Domain.Catalog;
using TutorMatching.Domain.Tutors;
using TutorMatching.Infrastructure.Persistence;
namespace TutorMatching.Infrastructure.Tutors;

public sealed class PublicTutorService(ApplicationDbContext db) : IPublicTutorService
{
    public Task<PublicTutorPage> SearchAsync(TutorSearchCriteria c, CancellationToken ct) => db.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
    {
        await using var tx = await db.Database.BeginTransactionAsync(System.Data.IsolationLevel.RepeatableRead, ct);
        var result = await SearchCore(c, ct);
        await tx.CommitAsync(ct);
        return result;
    });

    private async Task<PublicTutorPage> SearchCore(TutorSearchCriteria c, CancellationToken ct)
    {
        if (!c.IsValid) throw new ArgumentException("Invalid search criteria.");
        var profiles = db.PublicTutorProfiles();
        if (c.Windows.Count > 0)
        {
            var count = c.Windows.Count;
            var windows = JsonSerializer.Serialize(c.Windows.Select(w => new { day = w.DayOfWeek, start = w.StartTime.ToString("HH:mm"), finish = w.EndTime.ToString("HH:mm") }));
            // PostgreSQL range_agg unions intersections (including adjacent windows) per weekday.
            // Only matching rows enter LINQ filters/count/page; no full inventory materialization.
            var matchingIds = await db.Database.SqlQuery<Guid>($"""
                SELECT intersections.tutor_profile_id AS "Value"
                FROM (
                  SELECT s.tutor_profile_id, s.day_of_week, range_agg(numrange(
                    GREATEST(EXTRACT(EPOCH FROM s.start_time),EXTRACT(EPOCH FROM w.start)),
                    LEAST(EXTRACT(EPOCH FROM s.end_time),EXTRACT(EPOCH FROM w.finish)), '[)')) AS merged
                  FROM (SELECT * FROM jsonb_to_recordset(CAST({windows} AS jsonb)) AS _(day int, start time, finish time) LIMIT {count}) AS w
                  JOIN availability_slots s
                    ON s.day_of_week = w.day AND s.start_time < w.finish AND w.start < s.end_time
                  WHERE s.is_active AND s.availability_type = 'WEEKLY'
                    AND s.day_of_week BETWEEN 1 AND 7 AND s.start_time < s.end_time
                  GROUP BY s.day_of_week, s.tutor_profile_id
                ) intersections
                CROSS JOIN LATERAL unnest(intersections.merged) AS segment
                GROUP BY intersections.tutor_profile_id
                HAVING SUM(FLOOR((upper(segment) - lower(segment)) / ({c.DurationMinutes!.Value} * 60))) >= {c.SessionsPerWeek!.Value}
                """).ToListAsync(ct);
            profiles = profiles.Where(p => matchingIds.Contains(p.Id));
        }
        if (!string.IsNullOrWhiteSpace(c.Name))
        { var name = ApplicationDbContext.NormalizeSearchName(c.Name.Trim()); profiles = profiles.Where(p => p.NormalizedDisplayName.Contains(name)); }
        if (!string.IsNullOrWhiteSpace(c.Qualification))
        { var term = c.Qualification.Trim().ToLowerInvariant(); profiles = profiles.Where(p => p.Degree != null && p.Degree.ToLower().Contains(term)); }
        if (c.MinPrice.HasValue) profiles = profiles.Where(p => p.SessionRateVnd >= c.MinPrice);
        if (c.MaxPrice.HasValue) profiles = profiles.Where(p => p.SessionRateVnd <= c.MaxPrice);
        if (c.Modes.Length > 0)
        {
            // TeachingModes uses a legacy JSON value converter, so use the native JSONB operator.
            var modeProfiles = db.TutorProfiles.FromSqlInterpolated($"SELECT * FROM tutor_profiles WHERE teaching_modes ?| {c.Modes}").AsNoTracking();
            profiles = profiles.Where(p => modeProfiles.Any(m => m.Id == p.Id));
        }
        if (c.ProvinceCode is not null) profiles = profiles.Where(p => p.ProvinceCode == c.ProvinceCode && db.Provinces.Any(l => l.ProvinceCode == p.ProvinceCode && l.IsActive));
        if (c.DistrictCode is not null) profiles = profiles.Where(p => p.DistrictCode == c.DistrictCode && db.Districts.Any(l => l.DistrictCode == p.DistrictCode && l.ProvinceCode == c.ProvinceCode && l.IsActive));
        if (c.SubjectIds.Length > 0 || c.LevelCodes.Length > 0)
            profiles = profiles.Where(p => db.TutorSubjects.Any(s => s.TutorProfileId == p.Id &&
                db.Subjects.Any(subject => subject.Id == s.SubjectId && subject.IsActive) &&
                (c.SubjectIds.Length == 0 || c.SubjectIds.Contains(s.SubjectId)) &&
                (c.LevelCodes.Length == 0 || db.Set<TutorSubjectLevel>().Any(l => l.TutorProfileId == p.Id && l.SubjectId == s.SubjectId && c.LevelCodes.Contains(l.LevelCode) &&
                    db.Set<TeachingLevel>().Any(level => level.Code == l.LevelCode && level.IsActive)))));
        // SQL count/page first; associations are loaded only for the bounded page.
        var total = await profiles.CountAsync(ct);
        var sorted = c.Sort switch
        {
            "priceAsc" => profiles.OrderBy(p => p.SessionRateVnd).ThenBy(p => p.Id),
            "priceDesc" => profiles.OrderByDescending(p => p.SessionRateVnd).ThenBy(p => p.Id),
            _ => profiles.OrderByDescending(p => p.ApprovedAt).ThenByDescending(p => p.CreatedAt).ThenBy(p => p.Id)
        };
        var ids = await sorted.Skip((c.Page - 1) * c.PageSize).Take(c.PageSize).Select(p => p.Id).ToListAsync(ct);
        var items = await Summaries(ids, ct);
        return new(ids.Where(items.ContainsKey).Select(id => items[id]).ToList(), total, c.Page, c.PageSize);
    }

    public Task<PublicTutorDetail?> FindAsync(Guid profileId, CancellationToken ct) => db.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
    {
        await using var tx = await db.Database.BeginTransactionAsync(System.Data.IsolationLevel.RepeatableRead, ct);
        var p = (await Summaries([profileId], ct)).GetValueOrDefault(profileId);
        if (p is null) return null;
        var slots = await db.AvailabilitySlots.AsNoTracking().Where(s => s.TutorProfileId == profileId && s.IsActive && s.AvailabilityType == "WEEKLY" &&
            s.DayOfWeek >= 1 && s.DayOfWeek <= 7 && s.StartTime < s.EndTime).OrderBy(s => s.DayOfWeek).ThenBy(s => s.StartTime).ThenBy(s => s.Id)
            .Select(s => new { s.Id, s.DayOfWeek, s.StartTime, s.EndTime }).ToListAsync(ct);
        var courses = await (from c in db.Courses.AsNoTracking()
                             join subject in db.Subjects.AsNoTracking() on c.SubjectId equals subject.Id
                             where c.TutorProfileId == profileId && c.DeletedAt == null && c.StatusCode == "ACTIVE" && subject.IsActive &&
                               c.SessionCount > 0 && c.PricePerSessionVnd > 0 && c.Name != "" &&
                               db.TutorSubjects.Any(s => s.TutorProfileId == profileId && s.SubjectId == c.SubjectId)
                             orderby c.CreatedAt, c.Id
                             select new PublicCourse(c.Id, c.SubjectId, subject.Name, c.Name, c.Description, c.SessionCount!.Value, c.PricePerSessionVnd!.Value)).ToListAsync(ct);
        await tx.CommitAsync(ct);
        return new PublicTutorDetail(
            p.Id, p.DisplayName, p.AvatarUrl, p.Bio, p.Qualification, p.SchoolName, p.Specialization, p.ExperienceYears, p.TeachingMethodology,
            p.Achievements, p.SessionRateVnd, p.TeachingModes, p.ProvinceCode, p.ProvinceName, p.DistrictCode, p.DistrictName, p.Subjects, p.ApprovedAt,
            slots.Select(s => new PublicAvailability(s.Id, s.DayOfWeek!.Value, s.StartTime.ToString("HH:mm"), s.EndTime.ToString("HH:mm"), "Asia/Ho_Chi_Minh")).ToList(), courses);
    });

    private async Task<Dictionary<Guid, PublicTutorSummary>> Summaries(List<Guid> ids, CancellationToken ct)
    {
        var rows = await (from p in db.PublicTutorProfiles()
                          join u in db.Users.AsNoTracking() on p.UserId equals u.Id
                          where ids.Contains(p.Id)
                          select new
                          {
                              p.Id,
                              u.FullName,
                              Avatar = p.AvatarUrl ?? u.AvatarUrl,
                              p.Bio,
                              p.Degree,
                              p.SchoolName,
                              p.Specialization,
                              p.ExperienceYears,
                              p.TeachingMethodology,
                              p.AchievementsAndResults,
                              p.SessionRateVnd,
                              p.TeachingModes,
                              p.ProvinceCode,
                              p.DistrictCode,
                              p.ApprovedAt
                          }).ToListAsync(ct);
        var subjects = await (from s in db.TutorSubjects.AsNoTracking()
                              join sub in db.Subjects.AsNoTracking() on s.SubjectId equals sub.Id
                              where ids.Contains(s.TutorProfileId) && sub.IsActive
                              select new { s.TutorProfileId, s.SubjectId, sub.Name }).ToListAsync(ct);
        var levels = await (from l in db.Set<TutorSubjectLevel>().AsNoTracking()
                            join level in db.Set<TeachingLevel>().AsNoTracking() on l.LevelCode equals level.Code
                            where ids.Contains(l.TutorProfileId) && level.IsActive
                            select new { l.TutorProfileId, l.SubjectId, l.LevelCode, level.Name }).ToListAsync(ct);
        var provinces = await db.Provinces.AsNoTracking().Where(l => rows.Select(r => r.ProvinceCode).Contains(l.ProvinceCode)).ToDictionaryAsync(l => l.ProvinceCode, l => l.ProvinceName, ct);
        var districts = await db.Districts.AsNoTracking().Where(l => rows.Select(r => r.DistrictCode).Contains(l.DistrictCode)).ToDictionaryAsync(l => l.DistrictCode, l => l.DistrictName, ct);
        return rows.ToDictionary(p => p.Id, p => new PublicTutorSummary(p.Id, p.FullName, p.Avatar, p.Bio, p.Degree, p.SchoolName, p.Specialization, p.ExperienceYears,
            p.TeachingMethodology, p.AchievementsAndResults, p.SessionRateVnd!.Value, p.TeachingModes, p.ProvinceCode,
            p.ProvinceCode is not null ? provinces.GetValueOrDefault(p.ProvinceCode) : null, p.DistrictCode, p.DistrictCode is not null ? districts.GetValueOrDefault(p.DistrictCode) : null,
            subjects.Where(s => s.TutorProfileId == p.Id).OrderBy(s => s.Name).ThenBy(s => s.SubjectId).Select(s => new PublicSubject(s.SubjectId, s.Name,
                levels.Where(l => l.TutorProfileId == p.Id && l.SubjectId == s.SubjectId).OrderBy(l => l.LevelCode).Select(l => l.LevelCode).ToList(),
                levels.Where(l => l.TutorProfileId == p.Id && l.SubjectId == s.SubjectId).OrderBy(l => l.LevelCode).Select(l => l.Name).ToList())).ToList(), p.ApprovedAt));
    }
}
