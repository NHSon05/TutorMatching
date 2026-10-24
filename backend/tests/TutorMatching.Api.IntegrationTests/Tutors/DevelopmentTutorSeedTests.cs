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
            Assert.Equal(10,await db.TutorProfiles.CountAsync());
            var p=await db.TutorProfiles.FirstAsync();p.Bio="Owner edit";p.Status=TutorProfileStatus.DRAFT;await db.SaveChangesAsync();
            await seed.SeedAsync();db.ChangeTracker.Clear();
            Assert.Equal("Owner edit",(await db.TutorProfiles.SingleAsync(x=>x.Id==p.Id)).Bio);
            Assert.Equal(TutorProfileStatus.DRAFT,(await db.TutorProfiles.SingleAsync(x=>x.Id==p.Id)).Status);
        }
        using var client=factory.CreateApiClient();var page=await client.GetFromJsonAsync<JsonElement>("/api/v1/tutors");
        Assert.Equal(9,page.GetProperty("totalCount").GetInt32());
        Assert.All(page.GetProperty("items").EnumerateArray(),item=>Assert.NotEmpty(item.GetProperty("subjects").EnumerateArray()));
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
            Assert.Equal(10,await db.TutorProfiles.CountAsync());Assert.Equal(10,await db.TutorProfiles.CountAsync(p=>p.Status==TutorProfileStatus.APPROVED));
            Assert.False((await db.Subjects.SingleAsync(s=>s.Id==subject.Id)).IsActive);
            Assert.Equal(10,await db.TutorSubjects.Select(s=>s.TutorProfileId).Distinct().CountAsync());
        }
    }
}
