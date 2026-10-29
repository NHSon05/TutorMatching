using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorMatching.Domain.Tutors;
using TutorMatching.Infrastructure.Persistence;

internal static class HiringBrowserSeed
{
    public static async Task Seed(IServiceProvider services, CancellationToken ct)
    {
        await using var scope = services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var user = await db.Users.SingleAsync(u => u.Email == "tutor@example.test", ct);
        var subject = await db.Subjects.FirstAsync(s => s.IsActive, ct);
        var now = DateTimeOffset.UtcNow;
        var profile = new TutorProfile { Id = Guid.NewGuid(), UserId = user.Id, Status = TutorProfileStatus.APPROVED,
            SessionRateVnd = 150000, Subjects = [subject.Name], TeachingModes = ["ONLINE"],
            ApprovedAt = now, SubmittedAt = now, CreatedAt = now, UpdatedAt = now };
        db.TutorProfiles.Add(profile);
        db.TutorSubjects.Add(new TutorSubject { TutorProfileId = profile.Id, SubjectId = subject.Id, CreatedAt = now });
        db.AvailabilitySlots.Add(new AvailabilitySlot { Id = Guid.NewGuid(), TutorProfileId = profile.Id, DayOfWeek = 1,
            StartTime = new TimeOnly(18, 0), EndTime = new TimeOnly(20, 0), IsActive = true, CreatedAt = now, UpdatedAt = now });
        db.AvailabilitySlots.Add(new AvailabilitySlot { Id = Guid.NewGuid(), TutorProfileId = profile.Id, DayOfWeek = 3,
            StartTime = new TimeOnly(18, 0), EndTime = new TimeOnly(20, 0), IsActive = true, CreatedAt = now, UpdatedAt = now });
        await db.SaveChangesAsync(ct);
    }
}
