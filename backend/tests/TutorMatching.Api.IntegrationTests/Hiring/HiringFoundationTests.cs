using System.Collections.Immutable;
using System.Net;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Microsoft.Extensions.DependencyInjection;
using TutorMatching.Application.Hiring;
using TutorMatching.Api.IntegrationTests.Fixtures;
using TutorMatching.Domain.Hiring;
using TutorMatching.Domain.Tutors;
using TutorMatching.Infrastructure.Hiring;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Api.IntegrationTests.Hiring;

[Collection("PostgreSQL API")]
public sealed class HiringFoundationTests(PostgreSqlFixture postgres)
{
    [Fact]
    public async Task CommitsAggregateAndImmutableIdempotencyOutcomeTogether()
    {
        await using var f = await HiringFixture.CreateAsync(postgres);
        var request = await Create(f);
        await f.WithDbAsync(async db =>
        {
            var persisted = await db.HireRequests.SingleAsync();
            Assert.Equal(request.Version, persisted.Version);
            Assert.Equal(150000, persisted.InitialTerms.PriceVnd);
            Assert.Single(persisted.InitialTerms.Schedules);
            Assert.Equal(2, persisted.NextEventSequence);
            Assert.Equal(1, (await db.RequestStatusHistories.SingleAsync()).Sequence);
            Assert.Equal(f.Learner.Id, (await db.RequestStatusHistories.SingleAsync()).ActorUserId);
            Assert.Equal(f.Tutor.Id, (await db.Notifications.SingleAsync()).UserId);
            Assert.Equal((await db.Conversations.SingleAsync()).Id, (await db.HireCreateOperations.SingleAsync()).Outcome.ConversationId);
            return true;
        });
        // No-op transaction/replay does not rotate the version or append business records.
        await f.WithDbAsync(async db =>
        {
            await new HireRequestStore(db).ExecuteAsync(Target(f, request), async (session, ct) =>
        {
            var operation = await session.FindCreateOperationAsync(request.Id, ct);
            Assert.Equal(request.Version, operation!.Outcome.Version);
            });
            return true;
        });
        Assert.Equal(request.Version, await f.WithDbAsync(db => db.HireRequests.Select(r => r.Version).SingleAsync()));
    }

    [Fact]
    public async Task NotificationFailureRollsBackEntireAggregateAndRetrySucceeds()
    {
        await using var f = await HiringFixture.CreateAsync(postgres);
        await using (await f.FailNotificationWritesAsync())
            await Assert.ThrowsAsync<DbUpdateException>(() => Create(f));
        await f.WithDbAsync(async db =>
        {
            Assert.Empty(await db.HireRequests.ToListAsync());
            Assert.Empty(await db.HireCreateOperations.ToListAsync());
            Assert.Empty(await db.RequestStatusHistories.ToListAsync());
            Assert.Empty(await db.Conversations.ToListAsync());
            Assert.Empty(await db.Notifications.ToListAsync());
            return true;
        });
        var request = await Create(f);
        Assert.Equal(1, await f.WithDbAsync(db => db.HireRequests.CountAsync()));
        await using (await f.FailNotificationWritesAsync())
            await Assert.ThrowsAsync<DbUpdateException>(() => f.WithDbAsync(async db =>
            {
                await new HireRequestStore(db).ExecuteAsync(Target(f, request), (session, _) =>
                {
                    session.Request!.Note = "Must roll back";
                    session.NotifyOtherParticipant("HIRING_TEST", "Synthetic update", DateTimeOffset.UtcNow);
                    return Task.CompletedTask;
                });
                return true;
            }));
        await f.WithDbAsync(async db =>
        {
            var persisted = await db.HireRequests.SingleAsync();
            Assert.Equal(request.Version, persisted.Version);
            Assert.Null(persisted.Note);
            Assert.Equal(1, await db.Notifications.CountAsync());
            return true;
        });
    }

    [Fact]
    public async Task ConcurrentExpectedVersionAllowsExactlyOneCommit()
    {
        await using var f = await HiringFixture.CreateAsync(postgres);
        var request = await Create(f);
        async Task<string> Write(ApplicationDbContext db, CancellationToken ct)
        {
            try
            {
                await new HireRequestStore(db).ExecuteAsync(Target(f, request), (session, _) =>
                {
                    session.Request!.Note = "Concurrent update";
                    session.AddStatusEvent(new RequestStatusHistory { Id = Guid.NewGuid(), HireRequestId = request.Id,
                        ActorUserId = f.Learner.Id, FromStatusCode = "PENDING", ToStatusCode = "PENDING", CreatedAt = DateTimeOffset.UtcNow });
                    session.NotifyOtherParticipant("HIRING_TEST", "Synthetic update", DateTimeOffset.UtcNow);
                    return Task.CompletedTask;
                }, ct);
                return "ok";
            }
            catch (HireStoreException e) { return e.Code; }
        }
        var results = await f.RaceAsync(Write, Write);
        Assert.Equal(new[] { "ok", "version_conflict" }, results.Order().ToArray());
        Assert.Equal(2, await f.WithDbAsync(db => db.RequestStatusHistories.CountAsync()));
        Assert.Equal(2, await f.WithDbAsync(db => db.Notifications.CountAsync()));
        Assert.NotEqual(request.Version, await f.WithDbAsync(db => db.HireRequests.Select(r => r.Version).SingleAsync()));
    }

    [Fact]
    public async Task RejectsOwnershipAndChangedOfferingBeforeCallback()
    {
        await using var f = await HiringFixture.CreateAsync(postgres);
        var request = await Create(f);
        var foreign = await Assert.ThrowsAsync<HireStoreException>(() => f.WithDbAsync(async db =>
        {
            await new HireRequestStore(db).ExecuteAsync(Target(f, request) with { ActorId = f.OtherLearner.Id }, (_, _) => throw new Exception("Must not run"));
            return true;
        }));
        Assert.Equal("not_found", foreign.Code);
        await f.WithDbAsync(async db => { (await db.Subjects.SingleAsync(s => s.Id == f.SubjectId)).IsActive = false; return await db.SaveChangesAsync(); });
        var inactive = await Assert.ThrowsAsync<HireStoreException>(() => f.WithDbAsync(async db =>
        {
            await new HireRequestStore(db).ExecuteAsync(Target(f, request), (_, _) => throw new Exception("Must not run"));
            return true;
        }));
        Assert.Equal("offering_changed", inactive.Code);
        await f.WithDbAsync(async db =>
        {
            await new HireRequestStore(db).ExecuteAsync(Target(f, request) with { RequireOffering = false }, (_, _) => Task.CompletedTask);
            return true;
        });
    }

    [Fact]
    public async Task SnapshotAndHistoryCannotBeRewrittenAndDuplicateIdentityCannotPersist()
    {
        await using var f = await HiringFixture.CreateAsync(postgres);
        var request = await Create(f);
        await Assert.ThrowsAsync<InvalidOperationException>(() => f.WithDbAsync(async db =>
        {
            var r = await db.HireRequests.SingleAsync();
            r.InitialTerms = r.InitialTerms with { PriceVnd = 1 };
            return await db.SaveChangesAsync();
        }));
        await Assert.ThrowsAsync<InvalidOperationException>(() => f.WithDbAsync(async db =>
        {
            (await db.RequestStatusHistories.SingleAsync()).Reason = "overwrite";
            return await db.SaveChangesAsync();
        }));
        await Assert.ThrowsAsync<DbUpdateException>(() => f.WithDbAsync(async db =>
        {
            var old = await db.HireCreateOperations.AsNoTracking().SingleAsync();
            db.HireCreateOperations.Add(new HireCreateOperation { LearnerId = old.LearnerId,
                IdempotencyKey = Guid.NewGuid(), RequestId = old.RequestId, PayloadFingerprint = old.PayloadFingerprint,
                Outcome = old.Outcome, CreatedAt = DateTimeOffset.UtcNow });
            return await db.SaveChangesAsync();
        }));
        await Assert.ThrowsAnyAsync<Exception>(() => f.WithDbAsync(async db =>
        {
            await DatabaseMigrationRunner.MigrateAsync(db, HiringMigrationTests.Previous);
            return true;
        }));
        Assert.Equal(request.Id, await f.WithDbAsync(db => db.HireRequests.Select(r => r.Id).SingleAsync()));
    }

    [Fact]
    public async Task RegistersStoreAndAllowsIdempotencyHeaderOnlyForAllowedOrigin()
    {
        await using var f = await HiringFixture.CreateAsync(postgres);
        await using var scope = f.Factory.Services.CreateAsyncScope();
        Assert.IsType<HireRequestStore>(scope.ServiceProvider.GetRequiredService<IHireRequestStore>());
        using var client = f.Factory.CreateApiClient();
        foreach (var origin in new[] { "https://frontend.example", "https://untrusted.example" })
        {
            using var message = new HttpRequestMessage(HttpMethod.Options, "/api/v1/users/me");
            message.Headers.Add("Origin", origin);
            message.Headers.Add("Access-Control-Request-Method", "POST");
            message.Headers.Add("Access-Control-Request-Headers", "content-type,x-csrf-token,idempotency-key");
            using var response = await client.SendAsync(message);
            if (origin == "https://frontend.example")
            {
                Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
                Assert.Contains("idempotency-key", string.Join(",", response.Headers.GetValues("Access-Control-Allow-Headers")).ToLowerInvariant());
            }
            else Assert.False(response.Headers.Contains("Access-Control-Allow-Origin"));
        }
    }

    [Theory]
    [InlineData("profile")]
    [InlineData("account")]
    [InlineData("catalog")]
    public async Task WriteScopeHoldsEligibilityLocksUntilCommit(string resource)
    {
        await using var f = await HiringFixture.CreateAsync(postgres);
        var held = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var release = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var owner = f.WithDbAsync(async db =>
        {
            await new HireRequestStore(db).ExecuteAsync(Target(f), async (_, _) =>
            {
                held.SetResult();
                await release.Task.WaitAsync(TimeSpan.FromSeconds(10));
            });
            return true;
        });
        try
        {
            await held.Task.WaitAsync(TimeSpan.FromSeconds(10));
            await f.WithDbAsync(async db =>
            {
                await using var tx = await db.Database.BeginTransactionAsync();
                await db.Database.ExecuteSqlRawAsync("SET LOCAL lock_timeout = '150ms'");
                var error = await Assert.ThrowsAsync<PostgresException>(async () =>
                {
                    if (resource == "profile")
                        await db.Database.ExecuteSqlInterpolatedAsync($"SELECT id FROM tutor_profiles WHERE id={f.TutorProfileId} FOR UPDATE");
                    else if (resource == "account")
                        await db.Database.ExecuteSqlInterpolatedAsync($"UPDATE user_accounts SET status='LOCKED' WHERE id={f.Learner.Id}");
                    else
                        await db.Database.ExecuteSqlInterpolatedAsync($"UPDATE subjects SET is_active=false WHERE id={f.SubjectId}");
                });
                Assert.Equal(PostgresErrorCodes.LockNotAvailable, error.SqlState);
                return true;
            });
        }
        finally { release.TrySetResult(); await owner; }
        // A subsequent offering write is visible on the next transaction, not cached from the first.
        await f.WithDbAsync(async db =>
        {
            await using var tx = await db.Database.BeginTransactionAsync();
            await db.Database.ExecuteSqlInterpolatedAsync($"SELECT id FROM tutor_profiles WHERE id={f.TutorProfileId} FOR UPDATE");
            await db.AvailabilitySlots.Where(s => s.TutorProfileId == f.TutorProfileId).ExecuteUpdateAsync(s => s.SetProperty(x => x.IsActive, false));
            await tx.CommitAsync();
            return true;
        });
        await f.WithDbAsync(async db =>
        {
            await new HireRequestStore(db).ExecuteAsync(Target(f), (session, _) =>
            {
                Assert.Empty(session.Offering.Availability);
                return Task.CompletedTask;
            });
            return true;
        });
    }

    [Fact]
    public async Task AcceptedSnapshotRemainsFrozenAndLateScheduleAppendIsRejected()
    {
        await using var f = await HiringFixture.CreateAsync(postgres);
        var request = await Create(f);
        await f.WithDbAsync(async db =>
        {
            await new HireRequestStore(db).ExecuteAsync(Target(f, request), (session, _) =>
            {
                session.Request!.FinalAgreement = new(session.Request.InitialTerms, f.Tutor.Id,
                    new DateTimeOffset(2026, 10, 28, 12, 0, 0, TimeSpan.FromHours(7)), null, "Historical province", "Historical district");
                session.Request.StatusCode = "ACCEPTED";
                return Task.CompletedTask;
            });
            return true;
        });
        await f.WithDbAsync(async db =>
        {
            var agreement = (await db.HireRequests.AsNoTracking().SingleAsync()).FinalAgreement!;
            Assert.Equal(TimeSpan.Zero, agreement.AcceptedAt.Offset);
            Assert.Equal("Historical province", agreement.ProvinceName);
            return true;
        });
        await Assert.ThrowsAsync<InvalidOperationException>(() => f.WithDbAsync(async db =>
        {
            var row = await db.HireRequests.SingleAsync();
            row.FinalAgreement = row.FinalAgreement! with { ProvinceName = "Changed" };
            return await db.SaveChangesAsync();
        }));
        await Assert.ThrowsAsync<InvalidOperationException>(() => f.WithDbAsync(async db =>
        {
            db.RequestSchedules.Add(new RequestSchedule { Id = Guid.NewGuid(), HireRequestId = request.Id,
                DayOfWeek = 2, StartTime = new(18, 0), EndTime = new(19, 0), CreatedAt = DateTimeOffset.UtcNow });
            return await db.SaveChangesAsync();
        }));
    }

    [Fact]
    public async Task AvatarWriterWaitsForProfileBeforeAccountAndUpdatesBothRows()
    {
        await using var f = await HiringFixture.CreateAsync(postgres);
        var held = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var release = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var owner = f.WithDbAsync(async db =>
        {
            await new HireRequestStore(db).ExecuteAsync(Target(f), async (_, _) =>
            {
                held.SetResult();
                await release.Task.WaitAsync(TimeSpan.FromSeconds(10));
            });
            return true;
        });
        try
        {
            await held.Task.WaitAsync(TimeSpan.FromSeconds(10));
            await using var scope = f.Factory.Services.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            await db.Database.OpenConnectionAsync();
            await db.Database.ExecuteSqlRawAsync("SET lock_timeout = '150ms'");
            var service = scope.ServiceProvider.GetRequiredService<TutorMatching.Application.Tutors.ITutorOnboardingService>();
            var error = await Assert.ThrowsAsync<InvalidOperationException>(() => service.UpdateAvatarAsync(f.Tutor.Id, "/synthetic.png"));
            Assert.Equal(PostgresErrorCodes.LockNotAvailable, Assert.IsType<PostgresException>(error.InnerException).SqlState);
        }
        finally { release.TrySetResult(); await owner; }
        await using (var scope = f.Factory.Services.CreateAsyncScope())
            await scope.ServiceProvider.GetRequiredService<TutorMatching.Application.Tutors.ITutorOnboardingService>()
                .UpdateAvatarAsync(f.Tutor.Id, "/synthetic.png");
        await f.WithDbAsync(async db =>
        {
            Assert.Equal("/synthetic.png", (await db.Users.SingleAsync(x => x.Id == f.Tutor.Id)).AvatarUrl);
            Assert.Equal("/synthetic.png", (await db.TutorProfiles.SingleAsync(x => x.Id == f.TutorProfileId)).AvatarUrl);
            return true;
        });
    }

    private static HireWriteTarget Target(HiringFixture f, HireRequest? r = null) =>
        new(f.Learner.Id, f.TutorProfileId, f.SubjectId, RequestId: r?.Id, ExpectedVersion: r?.Version);

    private static async Task<HireRequest> Create(HiringFixture f)
    {
        var now = DateTimeOffset.UtcNow;
        var request = new HireRequest { Id = Guid.NewGuid(), RequesterUserId = f.Learner.Id,
            TutorProfileId = f.TutorProfileId, SubjectId = f.SubjectId, StartDate = f.FutureStartDate,
            SessionsPerWeek = 1, DurationMinutes = 60, ProposedPriceVnd = 150000, ListedPriceVnd = 150000,
            InitialTerms = new(f.FutureStartDate, 1, 60, "ONLINE", null, null, null, 150000,
                ImmutableArray.Create(new WeeklyWindow(1, new(18, 0), new(20, 0)))), CreatedAt = now, UpdatedAt = now };
        await f.WithDbAsync(async db =>
        {
            await new HireRequestStore(db).ExecuteAsync(Target(f), (session, _) =>
            {
                session.AddRequest(request);
                session.AddStatusEvent(new RequestStatusHistory { Id = Guid.NewGuid(), HireRequestId = request.Id,
                    ActorUserId = f.Learner.Id, ToStatusCode = "PENDING", CreatedAt = now });
                var conversation = session.AddConversation(now);
                session.NotifyOtherParticipant("HIRING_TEST", "Synthetic creation", now);
                session.AddCreateOperation(new HireCreateOperation { LearnerId = f.Learner.Id, IdempotencyKey = request.Id,
                    RequestId = request.Id, PayloadFingerprint = new('a', 64),
                    Outcome = new(request.Id, request.Version, request.StatusCode, conversation), CreatedAt = now });
                return Task.CompletedTask;
            });
            return true;
        });
        return request;
    }
}
