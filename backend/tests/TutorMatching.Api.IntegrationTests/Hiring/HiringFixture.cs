using System.Net;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorMatching.Api.IntegrationTests.Authentication;
using TutorMatching.Api.IntegrationTests.Fixtures;
using TutorMatching.Domain.Catalog;
using TutorMatching.Domain.Courses;
using TutorMatching.Domain.Locations;
using TutorMatching.Domain.Tutors;
using TutorMatching.Domain.Users;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Api.IntegrationTests.Hiring;

/// <summary>One isolated, migrated Testcontainers database per hiring scenario; never uses .env.</summary>
internal sealed class HiringFixture : IAsyncDisposable
{
    private const string Password = "Synthetic-hiring-123!";
    private int notificationFailureActive;
    public ApiWebApplicationFactory Factory { get; }
    public HiringActor Learner { get; private set; } = null!;
    public HiringActor OtherLearner { get; private set; } = null!;
    public HiringActor Tutor { get; private set; } = null!;
    public HiringActor OtherTutor { get; private set; } = null!;
    public HiringActor Admin { get; private set; } = null!;
    public Guid TutorProfileId { get; } = Guid.NewGuid();
    public Guid OtherTutorProfileId { get; } = Guid.NewGuid();
    public Guid SubjectId { get; } = Guid.NewGuid();
    public Guid CourseId { get; } = Guid.NewGuid();
    public const string ProvinceCode = "HIRING-P";
    public const string DistrictCode = "HIRING-D";
    public const int ListedPriceVnd = 150000;
    public const int CoursePriceVnd = 180000;
    public DateOnly FutureStartDate => DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(
        Factory.Clock.GetUtcNow(), TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh")).DateTime).AddDays(7);

    private HiringFixture(ApiWebApplicationFactory factory) => Factory = factory;

    public static async Task<HiringFixture> CreateAsync(PostgreSqlFixture postgres)
    {
        var fixture = new HiringFixture(await postgres.CreateFactoryAsync());
        try { await fixture.SeedAsync(); return fixture; }
        catch { await fixture.DisposeAsync(); throw; }
    }

    public async Task<T> WithDbAsync<T>(Func<ApplicationDbContext, Task<T>> action)
    {
        await using var scope = Factory.Services.CreateAsyncScope();
        return await action(scope.ServiceProvider.GetRequiredService<ApplicationDbContext>());
    }

    public async Task<HttpClient> CreateClientAsync(HiringActor actor)
    {
        var client = Factory.CreateApiClient();
        try
        {
            using var response = await SessionEndpointTests.Post(client, "login", new { email = actor.Email, password = Password });
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            return client;
        }
        catch { client.Dispose(); throw; }
    }

    /// <summary>Both independent connections are open before either action starts. Actions own transactions.</summary>
    public async Task<T[]> RaceAsync<T>(Func<ApplicationDbContext, CancellationToken, Task<T>> first,
        Func<ApplicationDbContext, CancellationToken, Task<T>> second, CancellationToken cancellationToken = default)
    {
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeout.CancelAfter(TimeSpan.FromSeconds(20));
        var ready = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var arrivals = 0;
        async Task<T> Run(Func<ApplicationDbContext, CancellationToken, Task<T>> action)
        {
            try
            {
                await using var scope = Factory.Services.CreateAsyncScope();
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                await db.Database.OpenConnectionAsync(timeout.Token);
                if (Interlocked.Increment(ref arrivals) == 2) ready.TrySetResult();
                await ready.Task.WaitAsync(timeout.Token);
                return await action(db, timeout.Token);
            }
            catch { await timeout.CancelAsync(); throw; }
        }
        return await Task.WhenAll(Run(first), Run(second));
    }

    /// <summary>Database-level failure catches EF and raw-SQL writes, including API scopes in this factory.</summary>
    public async Task<IAsyncDisposable> FailNotificationWritesAsync()
    {
        if (Interlocked.CompareExchange(ref notificationFailureActive, 1, 0) != 0)
            throw new InvalidOperationException("Notification failure is already enabled for this fixture.");
        try
        {
            await WithDbAsync(db => db.Database.ExecuteSqlRawAsync("""
                CREATE FUNCTION hiring_test_fail_notification() RETURNS trigger LANGUAGE plpgsql AS $$
                BEGIN RAISE EXCEPTION 'Synthetic notification write failure' USING ERRCODE = '23514'; END;
                $$;
                CREATE TRIGGER hiring_test_fail_notification BEFORE INSERT ON notifications
                FOR EACH ROW EXECUTE FUNCTION hiring_test_fail_notification();
                """));
            return new NotificationFailureLease(this);
        }
        catch { Volatile.Write(ref notificationFailureActive, 0); throw; }
    }

    private async Task SeedAsync()
    {
        await using var scope = Factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var now = Factory.Clock.GetUtcNow();
        async Task<HiringActor> Actor(string name, AccountRole role)
        {
            var email = $"{name}@example.test";
            var user = new ApplicationUser
            {
                Id = Guid.NewGuid(), UserName = email, Email = email, FullName = $"Synthetic {name}",
                Role = role, Status = AccountStatus.ACTIVE, CreatedAt = now, UpdatedAt = now
            };
            var result = await users.CreateAsync(user, Password);
            Assert.True(result.Succeeded, string.Join(", ", result.Errors.Select(e => e.Code)));
            return new HiringActor(user.Id, email, role);
        }
        Learner = await Actor("hiring-learner", AccountRole.LEARNER);
        OtherLearner = await Actor("hiring-other-learner", AccountRole.LEARNER);
        Tutor = await Actor("hiring-tutor", AccountRole.TUTOR);
        OtherTutor = await Actor("hiring-other-tutor", AccountRole.TUTOR);
        Admin = await Actor("hiring-admin", AccountRole.ADMIN);
        db.Add(new Province { ProvinceCode = ProvinceCode, ProvinceName = "Synthetic province" });
        db.Add(new District { DistrictCode = DistrictCode, ProvinceCode = ProvinceCode, DistrictName = "Synthetic district" });
        db.Add(new Subject { Id = SubjectId, Name = "Synthetic hiring subject", IsActive = true, CreatedAt = now, UpdatedAt = now });
        foreach (var (id, actor) in new[] { (TutorProfileId, Tutor), (OtherTutorProfileId, OtherTutor) })
        {
            db.Add(new TutorProfile
            {
                Id = id, UserId = actor.Id, Status = TutorProfileStatus.APPROVED,
                Subjects = ["Synthetic hiring subject"], TeachingModes = ["ONLINE", "OFFLINE", "HYBRID"],
                ProvinceCode = ProvinceCode, DistrictCode = DistrictCode, SessionRateVnd = ListedPriceVnd,
                SubmittedAt = now, ApprovedAt = now, CreatedAt = now, UpdatedAt = now
            });
            db.Add(new TutorSubject { TutorProfileId = id, SubjectId = SubjectId, CreatedAt = now });
            foreach (var day in new[] { 1, 3, 5 })
                db.Add(new AvailabilitySlot
                {
                    Id = Guid.NewGuid(), TutorProfileId = id, DayOfWeek = day,
                    StartTime = new TimeOnly(18, 0), EndTime = new TimeOnly(21, 0),
                    IsActive = true, CreatedAt = now, UpdatedAt = now
                });
        }
        db.Add(new Course
        {
            Id = CourseId, TutorProfileId = TutorProfileId, SubjectId = SubjectId, Name = "Synthetic hiring course",
            Description = "Synthetic lesson content", SessionCount = 8, PricePerSessionVnd = CoursePriceVnd,
            StatusCode = "ACTIVE", CreatedAt = now, UpdatedAt = now
        });
        await db.SaveChangesAsync();
    }

    public ValueTask DisposeAsync() => Factory.DisposeAsync();

    private sealed class NotificationFailureLease(HiringFixture fixture) : IAsyncDisposable
    {
        private int disposed;
        public async ValueTask DisposeAsync()
        {
            if (Interlocked.Exchange(ref disposed, 1) != 0) return;
            await fixture.WithDbAsync(db => db.Database.ExecuteSqlRawAsync("""
                DROP TRIGGER IF EXISTS hiring_test_fail_notification ON notifications;
                DROP FUNCTION IF EXISTS hiring_test_fail_notification();
                """));
            Volatile.Write(ref fixture.notificationFailureActive, 0);
        }
    }
}

internal sealed record HiringActor(Guid Id, string Email, AccountRole Role);
