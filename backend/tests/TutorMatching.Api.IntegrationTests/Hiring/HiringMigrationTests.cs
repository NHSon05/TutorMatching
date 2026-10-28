using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorMatching.Api.IntegrationTests.Fixtures;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Api.IntegrationTests.Hiring;

[Collection("PostgreSQL API")]
public sealed class HiringMigrationTests(PostgreSqlFixture postgres)
{
    internal const string Previous = "20261022162700_AddDiscoveryPerformanceIndexes";

    [Fact]
    public async Task EmptyDatabaseMigratesWithUniqueIndexesAndSnakeCase()
    {
        await using var factory = await postgres.CreateFactoryAsync();
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        Assert.Contains(await db.Database.GetAppliedMigrationsAsync(), m => m.EndsWith("_HireNegotiationFoundation"));
        var indexes = await db.Database.SqlQueryRaw<string>("SELECT indexdef AS \"Value\" FROM pg_indexes WHERE tablename='hire_create_operations'").ToListAsync();
        Assert.Contains(indexes, i => i.Contains("UNIQUE") && i.Contains("learner_id, idempotency_key"));
        Assert.Contains(indexes, i => i.Contains("UNIQUE") && i.Contains("request_id"));
        Assert.False(db.Database.HasPendingModelChanges());
    }

    [Fact]
    public async Task LegacyRowsKeepUnknownActorAndGetDeterministicSequencesAndSnapshots()
    {
        await using var factory = await postgres.CreateFactoryAsync(Previous);
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var id = await SeedLegacyAsync(db, false);
        await DatabaseMigrationRunner.MigrateAsync(db);
        var request = await db.HireRequests.AsNoTracking().SingleAsync(x => x.Id == id);
        Assert.NotEqual(Guid.Empty, request.Version);
        Assert.Null(request.ListedPriceVnd); // No historical listed price existed; do not use today's rate.
        Assert.NotNull(request.InitialTerms);
        Assert.Equal(100000, request.InitialTerms.PriceVnd);
        Assert.Single(request.InitialTerms.Schedules);
        Assert.Null(request.FinalAgreement);
        var history = await db.RequestStatusHistories.Where(x => x.HireRequestId == id).OrderBy(x => x.Sequence).ToListAsync();
        Assert.Equal(new[] { 1, 2 }, history.Select(x => x.Sequence));
        Assert.All(history, h => Assert.Null(h.ActorUserId));
        var proposals = await db.Negotiations.Where(x => x.HireRequestId == id).OrderBy(x => x.Sequence).ToListAsync();
        Assert.Equal(new[] { 1, 2 }, proposals.Select(x => x.Sequence));
        Assert.Equal(90000, proposals[1].Terms!.PriceVnd);
        Assert.Single(proposals[1].Terms!.Schedules);
        Assert.Equal(2, request.LatestProposalSequence);
        Assert.Equal(3, request.NextEventSequence);
        await DatabaseMigrationRunner.MigrateAsync(db, Previous);
        Assert.Equal(1, await db.Database.SqlQueryRaw<int>("SELECT count(*)::int AS \"Value\" FROM hire_requests").SingleAsync());
        await DatabaseMigrationRunner.MigrateAsync(db);
        Assert.Equal(2, await db.Negotiations.CountAsync());
    }

    [Fact]
    public async Task UnrecoverableAgreementStopsBeforeSchemaChangesWithoutDroppingRows()
    {
        await using var factory = await postgres.CreateFactoryAsync(Previous);
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        await SeedLegacyAsync(db, true);
        var exception = await Assert.ThrowsAnyAsync<Exception>(() => DatabaseMigrationRunner.MigrateAsync(db));
        Assert.Contains("HIRE_LEGACY_REVIEW_REQUIRED", exception.Message);
        Assert.DoesNotContain(await db.Database.GetAppliedMigrationsAsync(), m => m.EndsWith("_HireNegotiationFoundation"));
        Assert.Equal(1, await db.Database.SqlQueryRaw<int>("SELECT count(*)::int AS \"Value\" FROM hire_requests").SingleAsync());
        Assert.Equal(0, await db.Database.SqlQueryRaw<int>("SELECT count(*)::int AS \"Value\" FROM information_schema.columns WHERE table_name='hire_requests' AND column_name='initial_terms'").SingleAsync());
    }

    private static async Task<Guid> SeedLegacyAsync(ApplicationDbContext db, bool accepted)
    {
        var learner = Guid.NewGuid(); var tutor = Guid.NewGuid(); var profile = Guid.NewGuid();
        var subject = Guid.NewGuid(); var request = Guid.NewGuid();
        // Raw SQL deliberately targets the old schema rather than the current EF model.
        await db.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO user_accounts(id,email,normalized_email,full_name,role,status,created_at,updated_at,access_failed_count,email_confirmed,phone_number_confirmed,two_factor_enabled,lockout_enabled)
            VALUES ({learner},'legacy-learner@example.test','LEGACY-LEARNER@EXAMPLE.TEST','Synthetic learner','LEARNER','ACTIVE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,0,false,false,false,false),
                   ({tutor},'legacy-tutor@example.test','LEGACY-TUTOR@EXAMPLE.TEST','Synthetic tutor','TUTOR','ACTIVE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,0,false,false,false,false);
            INSERT INTO tutor_profiles(id,user_id,status,current_step,subjects,languages,teaching_levels,teaching_modes,certifications,has_certifications,is_negotiable,version,normalized_display_name,created_at,updated_at)
            VALUES ({profile},{tutor},'APPROVED',1,'[]','[]','[]','["ONLINE"]','[]',false,true,{Guid.NewGuid()},'synthetic',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
            INSERT INTO subjects(id,name,is_active,created_at,updated_at) VALUES ({subject},'Synthetic legacy subject',true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
            INSERT INTO hire_requests(id,requester_user_id,tutor_profile_id,subject_id,start_date,sessions_per_week,duration_minutes,teaching_mode_code,proposed_price_vnd,status_code,created_at,updated_at)
            VALUES ({request},{learner},{profile},{subject},'2030-01-01',1,60,'ONLINE',100000,{(accepted ? "ACCEPTED" : "NEGOTIATING")},CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
            INSERT INTO request_schedules(id,hire_request_id,day_of_week,start_time,end_time,created_at)
            VALUES ({Guid.NewGuid()},{request},1,'18:00','20:00',CURRENT_TIMESTAMP);
            INSERT INTO request_status_history(id,hire_request_id,actor_user_id,from_status_code,to_status_code,created_at)
            VALUES ('03000000-0000-0000-0000-000000000001',{request},NULL,NULL,'PENDING',CURRENT_TIMESTAMP),
                   ('03000000-0000-0000-0000-000000000002',{request},NULL,'PENDING','NEGOTIATING',CURRENT_TIMESTAMP);
            INSERT INTO negotiations(id,hire_request_id,sender_user_id,proposed_price_vnd,response_status_code,created_at)
            VALUES ('04000000-0000-0000-0000-000000000001',{request},{learner},90000,'PENDING',CURRENT_TIMESTAMP),
                   ('04000000-0000-0000-0000-000000000002',{request},{tutor},NULL,'PENDING',CURRENT_TIMESTAMP);
            """);
        return request;
    }
}
