using System.Net;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using TutorMatching.Api.IntegrationTests.Fixtures;
using TutorMatching.Domain.Catalog;
using TutorMatching.Domain.Notifications;

namespace TutorMatching.Api.IntegrationTests.Hiring;

[Collection("PostgreSQL API")]
public sealed class HiringFixtureTests(PostgreSqlFixture postgres)
{
    [Fact]
    public async Task SeedsPublicOfferingAndIndependentAuthenticatedActors()
    {
        await using var fixture = await HiringFixture.CreateAsync(postgres);
        foreach (var actor in new[] { fixture.Learner, fixture.OtherLearner, fixture.Tutor, fixture.OtherTutor, fixture.Admin })
        {
            using var client = await fixture.CreateClientAsync(actor);
            using var response = await client.GetAsync($"/api/v1/users/me/access/{actor.Role}");
            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        }
        using var anonymous = fixture.Factory.CreateApiClient();
        using var detail = await anonymous.GetAsync($"/api/v1/tutors/{fixture.TutorProfileId}");
        Assert.Equal(HttpStatusCode.OK, detail.StatusCode);
        await fixture.WithDbAsync(async db =>
        {
            Assert.Equal(5, await db.Users.CountAsync());
            Assert.Equal(2, await db.TutorProfiles.CountAsync());
            Assert.Equal(6, await db.AvailabilitySlots.CountAsync());
            var course = await db.Courses.SingleAsync(c => c.Id == fixture.CourseId);
            Assert.Equal(fixture.SubjectId, course.SubjectId);
            Assert.Equal(fixture.TutorProfileId, course.TutorProfileId);
            Assert.Equal(HiringFixture.CoursePriceVnd, course.PricePerSessionVnd);
            Assert.True(await db.Subjects.AnyAsync(s => s.Id == fixture.SubjectId && s.IsActive));
            Assert.Empty(await db.HireRequests.ToListAsync());
            return true;
        });
    }

    [Fact]
    public async Task RaceUsesTwoConnectionsAndIndependentTransactions()
    {
        await using var fixture = await HiringFixture.CreateAsync(postgres);
        async Task<int> Write(TutorMatching.Infrastructure.Persistence.ApplicationDbContext db, CancellationToken ct)
        {
            await using var tx = await db.Database.BeginTransactionAsync(ct);
            var pid = await db.Database.SqlQueryRaw<int>("SELECT pg_backend_pid() AS \"Value\"").SingleAsync(ct);
            db.Notifications.Add(Notification(fixture.Learner.Id));
            await db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
            return pid;
        }
        var pids = await fixture.RaceAsync(Write, Write);
        Assert.NotEqual(pids[0], pids[1]);
        Assert.Equal(2, await fixture.WithDbAsync(db => db.Notifications.CountAsync()));
    }

    [Fact]
    public async Task NotificationFailureRollsBackEarlierWriteAndLeaseRestoresWrites()
    {
        await using var fixture = await HiringFixture.CreateAsync(postgres);
        var sentinel = Guid.NewGuid();
        await using (await fixture.FailNotificationWritesAsync())
        {
            var error = await Assert.ThrowsAsync<DbUpdateException>(() => fixture.WithDbAsync(async db =>
            {
                await using var tx = await db.Database.BeginTransactionAsync();
                db.Subjects.Add(new Subject { Id = sentinel, Name = "Rollback sentinel" });
                await db.SaveChangesAsync();
                db.Notifications.Add(Notification(fixture.Tutor.Id));
                await db.SaveChangesAsync();
                await tx.CommitAsync();
                return true;
            }));
            Assert.Equal(PostgresErrorCodes.CheckViolation, Assert.IsType<PostgresException>(error.InnerException).SqlState);
        }
        await fixture.WithDbAsync(async db =>
        {
            Assert.False(await db.Subjects.AnyAsync(s => s.Id == sentinel));
            Assert.Empty(await db.Notifications.ToListAsync());
            db.Notifications.Add(Notification(fixture.Tutor.Id));
            await db.SaveChangesAsync();
            return true;
        });
        Assert.Equal(1, await fixture.WithDbAsync(db => db.Notifications.CountAsync()));
    }

    [Fact]
    public async Task FactoryIsolationKeepsFaultInjectionAndRowsLocal()
    {
        await using var first = await HiringFixture.CreateAsync(postgres);
        await using var second = await HiringFixture.CreateAsync(postgres);
        await using var failure = await first.FailNotificationWritesAsync();
        await second.WithDbAsync(async db =>
        {
            Assert.False(await db.Users.AnyAsync(u => u.Id == first.Learner.Id));
            db.Notifications.Add(Notification(second.Learner.Id));
            return await db.SaveChangesAsync();
        });
        Assert.Equal(0, await first.WithDbAsync(db => db.Notifications.CountAsync()));
        Assert.Equal(1, await second.WithDbAsync(db => db.Notifications.CountAsync()));
    }

    private static Notification Notification(Guid userId) => new()
    {
        Id = Guid.NewGuid(), UserId = userId, TypeCode = "HIRING_TEST",
        Title = "Synthetic notification", CreatedAt = DateTimeOffset.UtcNow
    };
}
