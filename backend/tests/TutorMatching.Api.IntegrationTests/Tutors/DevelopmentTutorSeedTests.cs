using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorMatching.Api.IntegrationTests.Fixtures;
using TutorMatching.Domain.Tutors;
using TutorMatching.Infrastructure.Persistence;
namespace TutorMatching.Api.IntegrationTests.Tutors;
[Collection("PostgreSQL API")]
public sealed class DevelopmentTutorSeedTests(PostgreSqlFixture fixture)
{
    [Fact]
    public async Task DemoTutorsAreDiscoverableAndRerunningSeedDoesNotDuplicateOrOverwriteEdits()
    {
        await using var factory=await fixture.CreateFactoryAsync();
        await using(var scope=factory.Services.CreateAsyncScope()) {
            var seed=scope.ServiceProvider.GetRequiredService<DevelopmentDataSeeder>();await seed.SeedAsync();await seed.SeedAsync();
            var db=scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            Assert.Equal(20,await db.TutorProfiles.CountAsync());
            var p=await db.TutorProfiles.FirstAsync(x=>x.Status==TutorProfileStatus.APPROVED);p.Bio="Owner edit";p.Status=TutorProfileStatus.DRAFT;await db.SaveChangesAsync();
            await seed.SeedAsync();db.ChangeTracker.Clear();
            Assert.Equal("Owner edit",(await db.TutorProfiles.SingleAsync(x=>x.Id==p.Id)).Bio);
            Assert.Equal(TutorProfileStatus.DRAFT,(await db.TutorProfiles.SingleAsync(x=>x.Id==p.Id)).Status);
        }
        using var client=factory.CreateApiClient();var page=await client.GetFromJsonAsync<JsonElement>("/api/v1/tutors");
        Assert.Equal(15,page.GetProperty("totalCount").GetInt32());
        Assert.All(page.GetProperty("items").EnumerateArray(),item=>Assert.NotEmpty(item.GetProperty("subjects").EnumerateArray()));
    }
    [Fact]
    public async Task MigrationDraftedDemoProfilesAreRepairedWithPartialLinksAndSeedRemainsIdempotent()
    {
        await using var factory = await fixture.CreateFactoryAsync();
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var seed = scope.ServiceProvider.GetRequiredService<DevelopmentDataSeeder>();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            await seed.SeedAsync();
            var subjectCount = await db.TutorSubjects.CountAsync();
            var levelCount = await db.Set<TutorSubjectLevel>().CountAsync();
            await db.Set<TutorSubjectLevel>().ExecuteDeleteAsync();
            var mathId = await db.Subjects.Where(s => s.Name == "Toán học").Select(s => s.Id).SingleAsync();
            await db.TutorSubjects.Where(s => s.SubjectId != mathId).ExecuteDeleteAsync();
            // The migration uses SQL and preserves UpdatedAt, unlike normal profile edits.
            await db.TutorProfiles.ExecuteUpdateAsync(setters => setters
                .SetProperty(p => p.Status, TutorProfileStatus.DRAFT)
                .SetProperty(p => p.ApprovedAt, (DateTimeOffset?)null));
            db.ChangeTracker.Clear();
            foreach (var profile in await db.TutorProfiles.ToListAsync())
            {
                db.AuditEvents.Add(new TutorMatching.Infrastructure.Auditing.AuditEvent
                {
                    Id = Guid.NewGuid(), Action = "DiscoveryMigrationDrafted", EntityType = "TutorProfile",
                    EntityId = profile.Id.ToString(), CreatedAt = DateTimeOffset.UtcNow
                });
            }
            await db.SaveChangesAsync();
            await seed.SeedAsync();
            await seed.SeedAsync();
            db.ChangeTracker.Clear();
            Assert.Equal(16, await db.TutorProfiles.CountAsync(p => p.Status == TutorProfileStatus.APPROVED && p.ApprovedAt != null));
            Assert.Equal(subjectCount, await db.TutorSubjects.CountAsync());
            Assert.Equal(levelCount, await db.Set<TutorSubjectLevel>().CountAsync());
        }
        using var client = factory.CreateApiClient();
        var page = await client.GetFromJsonAsync<JsonElement>("/api/v1/tutors");
        Assert.Equal(16, page.GetProperty("totalCount").GetInt32());
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task DraftDemoWithoutMigrationEvidenceOrEditedAfterMigrationIsNotApproved(bool editedAfterMigration)
    {
        await using var factory = await fixture.CreateFactoryAsync();
        await using var scope = factory.Services.CreateAsyncScope();
        var seed = scope.ServiceProvider.GetRequiredService<DevelopmentDataSeeder>();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        await seed.SeedAsync();
        var profile = await db.TutorProfiles.FirstAsync(p=>p.Status==TutorProfileStatus.APPROVED);
        profile.Status = TutorProfileStatus.DRAFT;
        profile.ApprovedAt = null;
        profile.UpdatedAt = DateTimeOffset.UtcNow;
        if (editedAfterMigration)
            db.AuditEvents.Add(new TutorMatching.Infrastructure.Auditing.AuditEvent
            {
                Id = Guid.NewGuid(), Action = "DiscoveryMigrationDrafted", EntityType = "TutorProfile",
                EntityId = profile.Id.ToString(), CreatedAt = profile.UpdatedAt.AddDays(-1)
            });
        await db.SaveChangesAsync();
        await seed.SeedAsync();
        db.ChangeTracker.Clear();
        Assert.Equal(TutorProfileStatus.DRAFT, (await db.TutorProfiles.SingleAsync(p => p.Id == profile.Id)).Status);
    }

    [Fact]
    public async Task LegacyDemoSeedIsRepairedWithoutResettingApprovalOrInactiveCatalogs()
    {
        await using var factory=await fixture.CreateFactoryAsync();
        await using(var scope=factory.Services.CreateAsyncScope()) {
            var seed=scope.ServiceProvider.GetRequiredService<DevelopmentDataSeeder>();await seed.SeedAsync();
            var db=scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            await db.Set<TutorSubjectLevel>().ExecuteDeleteAsync();await db.TutorSubjects.ExecuteDeleteAsync();
            db.ChangeTracker.Clear();
            var subject=await db.Subjects.FirstAsync();subject.IsActive=false;await db.SaveChangesAsync();
            await seed.SeedAsync();
            Assert.Equal(20,await db.TutorProfiles.CountAsync());Assert.Equal(16,await db.TutorProfiles.CountAsync(p=>p.Status==TutorProfileStatus.APPROVED));
            Assert.False((await db.Subjects.SingleAsync(s=>s.Id==subject.Id)).IsActive);
            Assert.Equal(20,await db.TutorSubjects.Select(s=>s.TutorProfileId).Distinct().CountAsync());
        }
    }
}
