using System.Net;
using Microsoft.EntityFrameworkCore;
using TutorMatching.Api.IntegrationTests.Fixtures;

namespace TutorMatching.Api.IntegrationTests.Hiring;

[Collection("PostgreSQL API")]
public sealed class HireCreationReliabilityTests(PostgreSqlFixture postgres)
{
    [Fact]
    public async Task ParallelReplayIsImmutableAndChangedPayloadConflicts()
    {
        await using var f = await HiringFixture.CreateAsync(postgres);
        using var a = await f.CreateClientAsync(f.Learner);
        using var b = await f.CreateClientAsync(f.Learner);
        var body = CreateHireRequestTests.Payload(f); var key = Guid.NewGuid();
        var responses = await Task.WhenAll(CreateHireRequestTests.Send(a, body, key), CreateHireRequestTests.Send(b, body, key));
        Assert.All(responses, r => Assert.Equal(HttpStatusCode.Created, r.StatusCode));
        var original = await responses[0].Content.ReadAsStringAsync();
        Assert.Equal(original, await responses[1].Content.ReadAsStringAsync());
        await f.WithDbAsync(async db => {
            var request = await db.HireRequests.SingleAsync(); request.StatusCode = "CANCELLED";
            var profile = await db.TutorProfiles.SingleAsync(p => p.Id == f.TutorProfileId); profile.SessionRateVnd = 999999;
            await db.SaveChangesAsync(); return true;
        });
        Assert.Equal(original, await (await CreateHireRequestTests.Send(a, body, key)).Content.ReadAsStringAsync());
        body["priceVnd"] = 123000;
        Assert.Equal(HttpStatusCode.Conflict, (await CreateHireRequestTests.Send(a, body, key)).StatusCode);
        await f.WithDbAsync(async db => {
            Assert.Equal(1, await db.HireRequests.CountAsync()); Assert.Equal(1, await db.RequestSchedules.CountAsync());
            Assert.Equal(1, await db.RequestStatusHistories.CountAsync()); Assert.Equal(1, await db.Conversations.CountAsync());
            Assert.Equal(1, await db.Notifications.CountAsync()); Assert.Equal(1, await db.HireCreateOperations.CountAsync()); return true;
        });
    }
    [Fact]
    public async Task FailedNotificationRollsBackAndSameIdentityCanRetry()
    {
        await using var f = await HiringFixture.CreateAsync(postgres);
        using var client = await f.CreateClientAsync(f.Learner);
        var body = CreateHireRequestTests.Payload(f); var key = Guid.NewGuid();
        await using (await f.FailNotificationWritesAsync())
            Assert.Equal(HttpStatusCode.InternalServerError, (await CreateHireRequestTests.Send(client, body, key)).StatusCode);
        Assert.Equal(0, await f.WithDbAsync(db => db.HireRequests.CountAsync()));
        Assert.Equal(0, await f.WithDbAsync(db => db.HireCreateOperations.CountAsync()));
        Assert.Equal(0, await f.WithDbAsync(db => db.RequestSchedules.CountAsync()));
        Assert.Equal(0, await f.WithDbAsync(db => db.RequestStatusHistories.CountAsync()));
        Assert.Equal(0, await f.WithDbAsync(db => db.Conversations.CountAsync()));
        Assert.Equal(0, await f.WithDbAsync(db => db.Notifications.CountAsync()));
        Assert.Equal(HttpStatusCode.Created, (await CreateHireRequestTests.Send(client, body, key)).StatusCode);
    }
    [Theory]
    [InlineData("availability")] [InlineData("catalog")] [InlineData("account")]
    public async Task ConcurrentEligibilityChangeIsObservedBeforeCreation(string resource)
    {
        await using var f = await HiringFixture.CreateAsync(postgres);
        using var client = await f.CreateClientAsync(f.Learner);
        await f.WithDbAsync(async db => {
            await using var tx = await db.Database.BeginTransactionAsync();
            await db.Database.ExecuteSqlInterpolatedAsync($"SELECT id FROM tutor_profiles WHERE id={f.TutorProfileId} FOR UPDATE");
            if (resource == "availability") await db.AvailabilitySlots.Where(x => x.TutorProfileId == f.TutorProfileId).ExecuteUpdateAsync(x => x.SetProperty(s => s.IsActive, false));
            if (resource == "catalog") await db.Subjects.Where(x => x.Id == f.SubjectId).ExecuteUpdateAsync(x => x.SetProperty(s => s.IsActive, false));
            if (resource == "account") await db.Users.Where(x => x.Id == f.Tutor.Id).ExecuteUpdateAsync(x => x.SetProperty(s => s.Status, TutorMatching.Domain.Users.AccountStatus.LOCKED));
            var pending = CreateHireRequestTests.Send(client, CreateHireRequestTests.Payload(f), Guid.NewGuid());
            try
            {
                await f.WithDbAsync(async observer => {
                    using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(10));
                    while (true)
                    {
                        var waiting = await observer.Database.SqlQueryRaw<int>("SELECT count(*)::int AS \"Value\" FROM pg_stat_activity WHERE datname=current_database() AND cardinality(pg_blocking_pids(pid)) > 0").SingleAsync(timeout.Token);
                        if (waiting > 0) break;
                        await Task.Delay(20, timeout.Token);
                    }
                    return true;
                });
            }
            finally { await tx.CommitAsync(); }
            Assert.Equal(HttpStatusCode.Conflict, (await pending).StatusCode);
            return true;
        });
        Assert.Equal(0, await f.WithDbAsync(db => db.HireRequests.CountAsync()));
        Assert.Equal(0, await f.WithDbAsync(db => db.Notifications.CountAsync()));
    }

    [Fact]
    public async Task SameLearnerKeyAcrossDifferentTutorsHasOnlyOneWinner()
    {
        await using var f = await HiringFixture.CreateAsync(postgres);
        using var a = await f.CreateClientAsync(f.Learner); using var b = await f.CreateClientAsync(f.Learner);
        var first = CreateHireRequestTests.Payload(f); var second = CreateHireRequestTests.Payload(f);
        second["tutorProfileId"] = f.OtherTutorProfileId.ToString(); var key = Guid.NewGuid();
        var responses = await Task.WhenAll(CreateHireRequestTests.Send(a, first, key), CreateHireRequestTests.Send(b, second, key));
        Assert.Equal(new[] { HttpStatusCode.Created, HttpStatusCode.Conflict }, responses.Select(r => r.StatusCode).Order().ToArray());
        Assert.Equal(1, await f.WithDbAsync(db => db.HireRequests.CountAsync()));
        Assert.Equal(1, await f.WithDbAsync(db => db.HireCreateOperations.CountAsync()));
    }

}
