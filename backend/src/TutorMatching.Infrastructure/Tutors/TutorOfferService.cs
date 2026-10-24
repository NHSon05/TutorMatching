using Microsoft.EntityFrameworkCore;
using TutorMatching.Application.Abstractions;
using TutorMatching.Application.Tutors;
using TutorMatching.Domain.Courses;
using TutorMatching.Domain.Tutors;
using TutorMatching.Infrastructure.Persistence;
namespace TutorMatching.Infrastructure.Tutors;

public sealed class TutorOfferService(ApplicationDbContext db, IClock clock) : ITutorOfferService
{
    private Task<Guid?> Profile(Guid user, CancellationToken token) => db.TutorProfiles.Where(p => p.UserId == user).Select(p => (Guid?)p.Id).SingleOrDefaultAsync(token);
    private Task<T> Locked<T>(Guid user, Func<Task<T>> action, CancellationToken token) => db.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
    {
        await using var tx = await db.Database.BeginTransactionAsync(token);
        await db.Database.ExecuteSqlInterpolatedAsync($"SELECT id FROM tutor_profiles WHERE user_id={user} FOR UPDATE", token);
        var result = await action(); await tx.CommitAsync(token); return result;
    });
    public async Task<IReadOnlyList<AvailabilityData>> AvailabilityAsync(Guid userId, CancellationToken token)
    {
        var profile = await Profile(userId, token);
        return await db.AvailabilitySlots.AsNoTracking().Where(s => s.TutorProfileId == profile && s.IsActive && s.AvailabilityType == "WEEKLY" && s.DayOfWeek >= 1 && s.DayOfWeek <= 7 && s.StartTime < s.EndTime)
            .OrderBy(s => s.DayOfWeek).ThenBy(s => s.StartTime).Select(s => new AvailabilityData(s.Id, s.DayOfWeek!.Value, s.StartTime, s.EndTime, "Asia/Ho_Chi_Minh")).ToListAsync(token);
    }
    public Task<OfferResult<AvailabilityData>> SaveAvailabilityAsync(Guid userId, Guid? id, AvailabilityWrite data, CancellationToken token) => Locked<OfferResult<AvailabilityData>>(userId, async () =>
    {
        var profile = await Profile(userId, token); if (profile is null) return new(null, OfferFailure.NotFound);
        if (!WeeklyAvailability.Valid(new(data.DayOfWeek, data.StartTime, data.EndTime))) return new(null, OfferFailure.Invalid);
        var row = id.HasValue ? await db.AvailabilitySlots.SingleOrDefaultAsync(s => s.Id == id && s.TutorProfileId == profile && s.IsActive && s.AvailabilityType == "WEEKLY", token) : new AvailabilitySlot { Id = Guid.NewGuid(), TutorProfileId = profile.Value, CreatedAt = clock.UtcNow };
        if (row is null) return new(null, OfferFailure.NotFound);
        if (await db.AvailabilitySlots.AnyAsync(s => s.TutorProfileId == profile && s.Id != row.Id && s.IsActive && s.AvailabilityType == "WEEKLY" && s.DayOfWeek == data.DayOfWeek && s.StartTime < data.EndTime && data.StartTime < s.EndTime, token)) return new(null, OfferFailure.Conflict);
        row.DayOfWeek = data.DayOfWeek; row.StartTime = data.StartTime; row.EndTime = data.EndTime; row.UpdatedAt = clock.UtcNow;
        if (!id.HasValue) db.Add(row); await db.SaveChangesAsync(token);
        return new(new AvailabilityData(row.Id, data.DayOfWeek, row.StartTime, row.EndTime));
    }, token);
    public Task<OfferFailure?> DeleteAvailabilityAsync(Guid userId, Guid id, CancellationToken token) => Locked<OfferFailure?>(userId, async () =>
    {
        var profile = await Profile(userId, token); var row = await db.AvailabilitySlots.SingleOrDefaultAsync(s => s.Id == id && s.TutorProfileId == profile && s.IsActive && s.AvailabilityType == "WEEKLY", token);
        if (row is null) return OfferFailure.NotFound; row.IsActive = false; row.UpdatedAt = clock.UtcNow; await db.SaveChangesAsync(token); return null;
    }, token);
    public async Task<IReadOnlyList<CourseData>> CoursesAsync(Guid userId, CancellationToken token)
    {
        var profile = await Profile(userId, token);
        return await db.Courses.AsNoTracking().Where(c => c.TutorProfileId == profile && c.DeletedAt == null).OrderBy(c => c.Name).ThenBy(c => c.Id)
            .Select(c => new CourseData(c.Id, c.SubjectId, c.Name, c.Description ?? "", c.SessionCount, c.PricePerSessionVnd, c.StatusCode)).ToListAsync(token);
    }
    public Task<OfferResult<CourseData>> SaveCourseAsync(Guid userId, Guid? id, CourseWrite data, CancellationToken token) => Locked<OfferResult<CourseData>>(userId, async () =>
    {
        var profile = await Profile(userId, token); if (profile is null) return new(null, OfferFailure.NotFound);
        if (!Course.ValidOffer(data.Name, data.Content, data.SessionCount, data.PricePerSessionVnd, data.Status)) return new(null, OfferFailure.Invalid);
        var row = id.HasValue ? await db.Courses.SingleOrDefaultAsync(c => c.Id == id && c.TutorProfileId == profile && c.DeletedAt == null, token) : new Course { Id = Guid.NewGuid(), TutorProfileId = profile.Value, CreatedAt = clock.UtcNow };
        if (row is null) return new(null, OfferFailure.NotFound);
        var retainingHiddenSubject = id.HasValue && data.Status == "HIDDEN" && row.SubjectId == data.SubjectId;
        if (!retainingHiddenSubject && (!await db.Subjects.AnyAsync(s => s.Id == data.SubjectId && (data.Status != "ACTIVE" || s.IsActive), token) || !await db.TutorSubjects.AnyAsync(s => s.TutorProfileId == profile && s.SubjectId == data.SubjectId, token))) return new(null, OfferFailure.Invalid);
        row.SubjectId = data.SubjectId; row.Name = data.Name.Trim(); row.Description = data.Content.Trim(); row.SessionCount = data.SessionCount; row.PricePerSessionVnd = data.PricePerSessionVnd; row.StatusCode = data.Status; row.UpdatedAt = clock.UtcNow;
        if (!id.HasValue) db.Add(row); await db.SaveChangesAsync(token); return new(new CourseData(row.Id, row.SubjectId, row.Name, row.Description, row.SessionCount, row.PricePerSessionVnd, row.StatusCode));
    }, token);
    public Task<OfferFailure?> DeleteCourseAsync(Guid userId, Guid id, CancellationToken token) => Locked<OfferFailure?>(userId, async () =>
    {
        var profile = await Profile(userId, token); var row = await db.Courses.SingleOrDefaultAsync(c => c.Id == id && c.TutorProfileId == profile && c.DeletedAt == null, token);
        if (row is null) return OfferFailure.NotFound; row.StatusCode = "HIDDEN"; row.DeletedAt = clock.UtcNow; row.UpdatedAt = clock.UtcNow; await db.SaveChangesAsync(token); return null;
    }, token);
}
