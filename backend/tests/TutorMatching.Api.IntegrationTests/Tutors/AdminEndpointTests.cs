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
public sealed class AdminEndpointTests(PostgreSqlFixture fixture)
{
    [Theory]
    [InlineData("approve", TutorProfileStatus.APPROVED)]
    [InlineData("reject", TutorProfileStatus.REJECTED)]
    public async Task AdminDecisionIsAtomicAndCannotBeRepeated(string action, TutorProfileStatus expected)
    {
        await using var factory = await fixture.CreateFactoryAsync();
        using var client = factory.CreateApiClient();
        var id = await Setup(factory, client, AccountRole.ADMIN);
        using var list = await client.GetAsync("/api/v1/users?page=1&pageSize=1");
        Assert.Equal(HttpStatusCode.OK, list.StatusCode);
        Assert.True(list.Headers.CacheControl?.NoStore);
        var page = await list.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(2, page.GetProperty("totalCount").GetInt32());
        Assert.Single(page.GetProperty("items").EnumerateArray());
        Assert.DoesNotContain("passwordHash", page.ToString(), StringComparison.OrdinalIgnoreCase);
        using var invalid = await client.GetAsync("/api/v1/admin/users?pageSize=101");
        Assert.Equal(HttpStatusCode.UnprocessableEntity, invalid.StatusCode);
        if (action == "reject")
        {
            using var missing = await Decide(client, id, action, " ");
            Assert.Equal(HttpStatusCode.UnprocessableEntity, missing.StatusCode);
        }
        using var result = await Decide(client, id, action, "Review note");
        Assert.Equal(HttpStatusCode.OK, result.StatusCode);
        using var repeated = await Decide(client, id, action, "Repeated");
        Assert.Equal(HttpStatusCode.Conflict, repeated.StatusCode);
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var profile = await db.TutorProfiles.SingleAsync(p => p.Id == id);
        Assert.Equal(expected, profile.Status);
        Assert.Equal(action == "approve", profile.ApprovedAt.HasValue);
        Assert.Single(await db.TutorProfileReviews.Where(r => r.TutorProfileId == id).ToListAsync());
        Assert.Single(await db.Notifications.Where(n => n.TutorProfileId == id).ToListAsync());
        Assert.Single(await db.AuditEvents.Where(a => a.EntityId == id.ToString()).ToListAsync());
    }

    [Theory]
    [InlineData(AccountRole.LEARNER)]
    [InlineData(AccountRole.TUTOR)]
    public async Task AnonymousAndOtherRolesCannotUseAdminApis(AccountRole role)
    {
        await using var factory = await fixture.CreateFactoryAsync();
        using var client = factory.CreateApiClient();
        using var anonymous = await client.GetAsync("/api/v1/users");
        Assert.Equal(HttpStatusCode.Unauthorized, anonymous.StatusCode);
        var id = await Setup(factory, client, role);
        using var list = await client.GetAsync("/api/v1/admin/users");
        Assert.Equal(HttpStatusCode.Forbidden, list.StatusCode);
        foreach (var action in new[] { "approve", "reject" })
        {
            using var result = await Decide(client, id, action, "Denied");
            Assert.Equal(HttpStatusCode.Forbidden, result.StatusCode);
        }
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

    private static async Task<HttpResponseMessage> Decide(HttpClient client, Guid id, string action, string note)
    {
        var csrf = await client.GetFromJsonAsync<JsonElement>("/api/v1/auth/csrf");
        using var request = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/admin/tutors/{id}/{action}") { Content = JsonContent.Create(new { note }) };
        request.Headers.Add("X-CSRF-TOKEN", csrf.GetProperty("requestToken").GetString());
        return await client.SendAsync(request);
    }
}
