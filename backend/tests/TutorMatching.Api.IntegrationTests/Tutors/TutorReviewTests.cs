using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorMatching.Api.IntegrationTests.Authentication;
using TutorMatching.Api.IntegrationTests.Fixtures;
using TutorMatching.Domain.Tutors;
using TutorMatching.Domain.Users;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Api.IntegrationTests.Tutors;
[Collection("PostgreSQL API")]
public sealed class TutorReviewTests(PostgreSqlFixture fixture)
{
    [Theory]
    [InlineData("APPROVE", TutorProfileStatus.APPROVED)]
    [InlineData("REQUEST_CHANGES", TutorProfileStatus.DRAFT)]
    [InlineData("REJECT", TutorProfileStatus.REJECTED)]
    public async Task DecisionRequiresCurrentVersionAndWritesOneAtomicHistory(string action, TutorProfileStatus target)
    {
        await using var factory = await fixture.CreateFactoryAsync();
        using var client = factory.CreateApiClient();
        var id = await Setup(factory, client, AccountRole.ADMIN);
        var detail = await client.GetFromJsonAsync<JsonElement>($"/api/v1/admin/tutor-reviews/{id}");
        var version = detail.GetProperty("profile").GetProperty("version").GetGuid();
        var page = await client.GetFromJsonAsync<JsonElement>("/api/v1/admin/tutor-reviews?pageSize=1");
        Assert.Single(page.GetProperty("items").EnumerateArray());
        using var stale = await Decide(client,id,action,Guid.NewGuid(),"Reason");
        Assert.Equal(HttpStatusCode.Conflict,stale.StatusCode);
        if(action != "APPROVE") {
            using var empty = await Decide(client,id,action,version," ");
            Assert.Equal(HttpStatusCode.UnprocessableEntity,empty.StatusCode);
        }
        var decisions = await Task.WhenAll(Decide(client,id,action,version,"Reason"),Decide(client,id,action,version,"Reason"));
        Assert.Single(decisions,r=>r.StatusCode==HttpStatusCode.OK);
        Assert.Single(decisions,r=>r.StatusCode==HttpStatusCode.Conflict);
        foreach(var response in decisions) response.Dispose();
        await using var scope = factory.Services.CreateAsyncScope();
        var db=scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var profile=await db.TutorProfiles.SingleAsync(x=>x.Id==id);
        Assert.Equal(target,profile.Status); Assert.NotEqual(version,profile.Version);
        var history=Assert.Single(await db.TutorProfileReviews.Where(x=>x.TutorProfileId==id).ToListAsync());
        Assert.Equal(action,history.Action); Assert.Equal(version,history.ReviewedVersion);
        Assert.Equal("Reason",history.Note);
        Assert.Single(await db.Notifications.Where(x=>x.TutorProfileId==id).ToListAsync());
        Assert.Single(await db.AuditEvents.Where(x=>x.EntityId==id.ToString()).ToListAsync());
        using var login=await SessionEndpointTests.Post(client,"login",new{email="pending-case@example.test",password="password"});
        Assert.Equal(HttpStatusCode.OK,login.StatusCode);
        var ownerHistory=await client.GetFromJsonAsync<JsonElement>("/api/v1/tutor/reviews");
        Assert.Single(ownerHistory.EnumerateArray());
        Assert.Equal(action,ownerHistory[0].GetProperty("action").GetString());
    }

    [Theory]
    [InlineData(AccountRole.LEARNER)]
    [InlineData(AccountRole.TUTOR)]
    public async Task ReviewApisEnforceRolesAndOwnerHistory(AccountRole role)
    {
        await using var factory=await fixture.CreateFactoryAsync(); using var client=factory.CreateApiClient();
        using var anonymous=await client.GetAsync("/api/v1/admin/tutor-reviews"); Assert.Equal(HttpStatusCode.Unauthorized,anonymous.StatusCode);
        var id=await Setup(factory,client,role);
        using var queue=await client.GetAsync("/api/v1/admin/tutor-reviews"); Assert.Equal(HttpStatusCode.Forbidden,queue.StatusCode);
        using var detail=await client.GetAsync($"/api/v1/admin/tutor-reviews/{id}"); Assert.Equal(HttpStatusCode.Forbidden,detail.StatusCode);
        using var decision=await Decide(client,id,"APPROVE",Guid.NewGuid(),null); Assert.Equal(HttpStatusCode.Forbidden,decision.StatusCode);
        using var history=await client.GetAsync("/api/v1/tutor/reviews");
        Assert.Equal(role==AccountRole.TUTOR?HttpStatusCode.OK:HttpStatusCode.Forbidden,history.StatusCode);
        if(role==AccountRole.TUTOR) Assert.Empty((await history.Content.ReadFromJsonAsync<JsonElement>()).EnumerateArray());
    }

    [Fact]
    public async Task ResubmissionRejectsPreviousVersionAndKeepsFullImmutableReason()
    {
        await using var factory=await fixture.CreateFactoryAsync(); using var client=factory.CreateApiClient();
        var id=await Setup(factory,client,AccountRole.ADMIN);
        var detail=await client.GetFromJsonAsync<JsonElement>($"/api/v1/admin/tutor-reviews/{id}");
        var oldVersion=detail.GetProperty("profile").GetProperty("version").GetGuid();
        var reason=new string('a',4000);
        using var changes=await Decide(client,id,"REQUEST_CHANGES",oldVersion,reason);
        Assert.Equal(HttpStatusCode.OK,changes.StatusCode);
        Guid newVersion;
        await using(var scope=factory.Services.CreateAsyncScope()) {
            var db=scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var profile=await db.TutorProfiles.SingleAsync(x=>x.Id==id);
            profile.Status=TutorProfileStatus.PENDING_REVIEW; profile.SubmittedAt=DateTimeOffset.UtcNow;
            await db.SaveChangesAsync(); newVersion=profile.Version;
            Assert.Equal(reason,(await db.TutorProfileReviews.SingleAsync()).Note);
            Assert.Equal(2000,(await db.Notifications.SingleAsync()).Body!.Length);
        }
        using var stale=await Decide(client,id,"APPROVE",oldVersion,null); Assert.Equal(HttpStatusCode.Conflict,stale.StatusCode);
        using var valid=await Decide(client,id,"APPROVE",newVersion,null); Assert.Equal(HttpStatusCode.OK,valid.StatusCode);
        await using var check=factory.Services.CreateAsyncScope(); var checkDb=check.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        Assert.Equal(2,await checkDb.TutorProfileReviews.CountAsync());
        var history=await checkDb.TutorProfileReviews.FirstAsync(); history.Note="Overwrite";
        await Assert.ThrowsAsync<InvalidOperationException>(()=>checkDb.SaveChangesAsync());
        using var otherLogin=await SessionEndpointTests.Post(client,"login",new{email="pending-case@example.test",password="password"});
        var ownerHistory=await client.GetFromJsonAsync<JsonElement>("/api/v1/tutor/reviews"); Assert.Equal(2,ownerHistory.GetArrayLength());
    }

    [Fact]
    public async Task ValidatesRequestsAndExcludesInactiveAccountsFromQueueAndApproval()
    {
        await using var factory=await fixture.CreateFactoryAsync(); using var client=factory.CreateApiClient();
        var id=await Setup(factory,client,AccountRole.ADMIN);
        using var invalidPage=await client.GetAsync("/api/v1/admin/tutor-reviews?pageSize=101"); Assert.Equal(HttpStatusCode.UnprocessableEntity,invalidPage.StatusCode);
        using var missing=await client.GetAsync($"/api/v1/admin/tutor-reviews/{Guid.NewGuid()}"); Assert.Equal(HttpStatusCode.NotFound,missing.StatusCode);
        using var noVersion=await Decide(client,id,"APPROVE",Guid.Empty,null); Assert.Equal(HttpStatusCode.UnprocessableEntity,noVersion.StatusCode);
        using var action=await Decide(client,id,"INVALID",Guid.NewGuid(),null); Assert.Equal(HttpStatusCode.UnprocessableEntity,action.StatusCode);
        var csrf=await client.GetFromJsonAsync<JsonElement>("/api/v1/auth/csrf");
        using var withoutVersion=new HttpRequestMessage(HttpMethod.Post,$"/api/v1/admin/tutor-reviews/{id}"){Content=JsonContent.Create(new{action="APPROVE"})};
        withoutVersion.Headers.Add("X-CSRF-TOKEN",csrf.GetProperty("requestToken").GetString());
        using var invalid=await client.SendAsync(withoutVersion); Assert.Equal(HttpStatusCode.UnprocessableEntity,invalid.StatusCode);
        Guid version;
        await using(var scope=factory.Services.CreateAsyncScope()) {
            var db=scope.ServiceProvider.GetRequiredService<ApplicationDbContext>(); var profile=await db.TutorProfiles.SingleAsync(x=>x.Id==id); version=profile.Version;
            var user=await db.Users.SingleAsync(x=>x.Id==profile.UserId); user.Status=AccountStatus.LOCKED; await db.SaveChangesAsync();
        }
        var queue=await client.GetFromJsonAsync<JsonElement>("/api/v1/admin/tutor-reviews"); Assert.Equal(0,queue.GetProperty("totalCount").GetInt32());
        using var decision=await Decide(client,id,"APPROVE",version,null); Assert.Equal(HttpStatusCode.Conflict,decision.StatusCode);
        await using var verify=factory.Services.CreateAsyncScope(); var checkDb=verify.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        Assert.Empty(await checkDb.TutorProfileReviews.ToListAsync()); Assert.Empty(await checkDb.Notifications.ToListAsync());
    }

    [Fact]
    public async Task MigrationPreservesLegacyDecisionAndDoesNotInventVersion()
    {
        await using var factory=await fixture.CreateFactoryAsync("20261021104138_TutorProfileTeachingModes");
        await using var scope=factory.Services.CreateAsyncScope(); var db=scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var manager=scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var user=new ApplicationUser{Id=Guid.NewGuid(),UserName="review-migration@example.test",Email="review-migration@example.test",FullName="Legacy Review",Role=AccountRole.TUTOR,Status=AccountStatus.ACTIVE};
        Assert.True((await manager.CreateAsync(user,"password")).Succeeded);
        var profile=new TutorProfile{Id=Guid.NewGuid(),UserId=user.Id}; db.TutorProfiles.Add(profile); await db.SaveChangesAsync();
        var rid=Guid.NewGuid(); var reason="Keep historical reason";
        await db.Database.ExecuteSqlInterpolatedAsync($"INSERT INTO tutor_profile_reviews(id,tutor_profile_id,reviewer_user_id,from_status_code,to_status_code,note,reviewed_at) VALUES ({rid},{profile.Id},{user.Id},'PENDING_REVIEW','REJECTED',{reason},CURRENT_TIMESTAMP)");
        await DatabaseMigrationRunner.MigrateAsync(db); db.ChangeTracker.Clear();
        var history=await db.TutorProfileReviews.SingleAsync(x=>x.Id==rid);
        Assert.Equal("REJECT",history.Action); Assert.Null(history.ReviewedVersion); Assert.Equal(reason,history.Note);
        await DatabaseMigrationRunner.MigrateAsync(db); Assert.Single(await db.TutorProfileReviews.ToListAsync());
    }

    [Fact]
    public async Task RequiresCsrfAndDoesNotExposeAnotherTutorsReviewHistory()
    {
        await using var factory=await fixture.CreateFactoryAsync(); using var client=factory.CreateApiClient();
        var id=await Setup(factory,client,AccountRole.ADMIN);
        var detail=await client.GetFromJsonAsync<JsonElement>($"/api/v1/admin/tutor-reviews/{id}");
        var version=detail.GetProperty("profile").GetProperty("version").GetGuid();
        using var missingCsrf=await client.PostAsJsonAsync($"/api/v1/admin/tutor-reviews/{id}",new {action="APPROVE",expectedVersion=version});
        Assert.False(missingCsrf.IsSuccessStatusCode);
        using var decision=await Decide(client,id,"REJECT",version,"Private owner reason"); Assert.Equal(HttpStatusCode.OK,decision.StatusCode);
        await using(var scope=factory.Services.CreateAsyncScope()) {
            var manager=scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            Assert.True((await manager.CreateAsync(new ApplicationUser{Id=Guid.NewGuid(),UserName="other-review@example.test",Email="other-review@example.test",FullName="Other Tutor",Role=AccountRole.TUTOR,Status=AccountStatus.ACTIVE},"password")).Succeeded);
        }
        using var login=await SessionEndpointTests.Post(client,"login",new{email="other-review@example.test",password="password"}); Assert.Equal(HttpStatusCode.OK,login.StatusCode);
        using var history=await client.GetAsync("/api/v1/tutor/reviews"); Assert.Equal(HttpStatusCode.OK,history.StatusCode); Assert.True(history.Headers.CacheControl?.NoStore);
        Assert.Empty((await history.Content.ReadFromJsonAsync<JsonElement>()).EnumerateArray());
    }

    private static async Task<Guid> Setup(ApiWebApplicationFactory factory, HttpClient client, AccountRole role)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var manager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        foreach (var (email, accountRole) in new[] { ("admin-case@example.test", role), ("pending-case@example.test", AccountRole.TUTOR) })
        {
            var now = DateTimeOffset.UtcNow;
            Assert.True((await manager.CreateAsync(new ApplicationUser { Id = Guid.NewGuid(), UserName = email, Email = email,
                FullName = "Admin Case", Role = accountRole, Status = AccountStatus.ACTIVE, CreatedAt = now, UpdatedAt = now }, "password")).Succeeded);
        }
        var tutor = await db.Users.SingleAsync(u => u.Email == "pending-case@example.test");
        var profile = new TutorProfile { Id = Guid.NewGuid(), UserId = tutor.Id, Status = TutorProfileStatus.PENDING_REVIEW,
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow };
        db.TutorProfiles.Add(profile);
        await db.SaveChangesAsync();
        using var login = await SessionEndpointTests.Post(client, "login", new { email = "admin-case@example.test", password = "password" });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        return profile.Id;
    }

    private static async Task<HttpResponseMessage> Decide(HttpClient client,Guid id,string action,Guid version,string? note)
    {
        var csrf=await client.GetFromJsonAsync<JsonElement>("/api/v1/auth/csrf");
        using var request=new HttpRequestMessage(HttpMethod.Post,$"/api/v1/admin/tutor-reviews/{id}"){Content=JsonContent.Create(new{action,expectedVersion=version,note})};
        request.Headers.Add("X-CSRF-TOKEN",csrf.GetProperty("requestToken").GetString()); return await client.SendAsync(request);
    }
}
