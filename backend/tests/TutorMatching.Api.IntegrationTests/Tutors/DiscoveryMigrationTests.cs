using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorMatching.Api.IntegrationTests.Fixtures;
using TutorMatching.Domain.Tutors;
using TutorMatching.Domain.Users;
using TutorMatching.Infrastructure.Persistence;
namespace TutorMatching.Api.IntegrationTests.Tutors;
[Collection("PostgreSQL API")]
public sealed class DiscoveryMigrationTests(PostgreSqlFixture fixture)
{
    [Fact]
    public async Task FoundationMigrationPreservesLegacyAndIsIdempotent()
    {
        await using var factory = await fixture.CreateFactoryAsync();
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var levels = await db.Set<TutorMatching.Domain.Catalog.TeachingLevel>().CountAsync();
        Assert.Equal(4, levels);
        await DatabaseMigrationRunner.MigrateAsync(db);
        Assert.Equal(levels, await db.Set<TutorMatching.Domain.Catalog.TeachingLevel>().CountAsync());
        Assert.True(await db.Subjects.AnyAsync(s => s.Id == TutorDiscoverySeed.MathId));
        var manager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var user = new ApplicationUser { Id=Guid.NewGuid(), UserName="migration@example.test", Email="migration@example.test",FullName="Migration Tutor",Role=AccountRole.TUTOR };
        Assert.True((await manager.CreateAsync(user,"password")).Succeeded);
        var profile = TutorDiscoverySeed.Legacy(user.Id,false);
        db.Add(profile); await db.SaveChangesAsync();
        db.ChangeTracker.Clear();
        var loaded=await db.TutorProfiles.SingleAsync(p=>p.Id==profile.Id);
        Assert.Equal("Unknown legacy subject", Assert.Single(loaded.Subjects));
        Assert.NotEqual(Guid.Empty,loaded.Version);
    }
    [Fact]
    public async Task UpgradeBackfillsOnlyKnownValuesAndAuditsVisibilityDowngrade()
    {
        await using var factory = await fixture.CreateFactoryAsync("20261019090000_AddDatabaseSchemaEntities");
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var manager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var ids = new List<Guid>();
        foreach (var mapped in new[] { true, false })
        {
            var id = Guid.NewGuid(); ids.Add(id);
            var email = id.ToString()+"@example.test";
            Assert.True((await manager.CreateAsync(new ApplicationUser { Id=id, UserName=email,Email=email, FullName="Legacy Tutor",Role=AccountRole.TUTOR },"password")).Succeeded);
            var pid=Guid.NewGuid();
            var subjects = mapped ? "[\"Toán học\"]" : "[\"Unknown legacy subject\"]";
            await db.Database.ExecuteSqlInterpolatedAsync($"INSERT INTO tutor_profiles(id,user_id,status,current_step,subjects,languages,teaching_levels,has_certifications,certifications,is_negotiable,session_rate_vnd,created_at,updated_at) VALUES ({pid},{id},'APPROVED',1,{subjects}::jsonb,'[]'::jsonb,'[\"THPT\"]'::jsonb,false,'[]'::jsonb,false,150000,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)");
        }
        await DatabaseMigrationRunner.MigrateAsync(db);
        db.ChangeTracker.Clear();
        var known=await db.TutorProfiles.SingleAsync(p=>p.UserId==ids[0]);
        var unknown=await db.TutorProfiles.SingleAsync(p=>p.UserId==ids[1]);
        Assert.Equal(TutorProfileStatus.APPROVED,known.Status);
        Assert.Equal(TutorProfileStatus.DRAFT,unknown.Status);
        Assert.Equal("Unknown legacy subject",Assert.Single(unknown.Subjects));
        Assert.Empty(await db.TutorProfileReviews.Where(r=>r.TutorProfileId==unknown.Id).ToListAsync());
        Assert.Single(await db.AuditEvents.Where(a=>a.Action=="DiscoveryMigrationDrafted" && a.EntityId==unknown.Id.ToString()).ToListAsync());
        Assert.Single(await db.Set<TutorSubjectLevel>().Where(t=>t.TutorProfileId==known.Id).ToListAsync());
    }

}
