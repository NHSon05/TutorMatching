using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TutorMatching.Api.IntegrationTests.Authentication;
using TutorMatching.Api.IntegrationTests.Demands;
using TutorMatching.Api.IntegrationTests.Fixtures;
using TutorMatching.Api.IntegrationTests.Hiring;
using TutorMatching.Domain.Users;

namespace TutorMatching.Api.IntegrationTests.Administration;

[Collection("PostgreSQL API")]
public sealed class AdminUsersEndpointTests(PostgreSqlFixture postgres)
{
    [Fact]
    public async Task SearchFiltersByQueryRoleAndStatusWithDeterministicPaging()
    {
        await using var fixture = await AdminFixture.CreateAsync(postgres);
        using var admin = await fixture.CreateClientAsync(fixture.Admin);

        var byEmail = await Page(admin, $"/api/v1/admin/users?q={Uri.EscapeDataString(fixture.Messaging.Tutor.Email.ToUpperInvariant())}");
        var item = Assert.Single(byEmail.GetProperty("items").EnumerateArray());
        Assert.Equal(fixture.Messaging.Tutor.Id, item.GetProperty("id").GetGuid());
        Assert.Equal(fixture.Messaging.TutorProfileId, item.GetProperty("tutorProfileId").GetGuid());
        Assert.NotEqual(Guid.Empty, item.GetProperty("version").GetGuid());

        var admins = await Page(admin, "/api/v1/admin/users?role=ADMIN");
        Assert.Equal(2, admins.GetProperty("totalCount").GetInt32());
        Assert.All(admins.GetProperty("items").EnumerateArray(), u => Assert.Equal("ADMIN", u.GetProperty("role").GetString()));

        var locked = await Page(admin, "/api/v1/admin/users?status=LOCKED");
        Assert.Equal(fixture.Messaging.LockedAccount.Id,
            Assert.Single(locked.GetProperty("items").EnumerateArray()).GetProperty("id").GetGuid());

        var wildcard = await Page(admin, "/api/v1/admin/users?q=%25");
        Assert.Equal(0, wildcard.GetProperty("totalCount").GetInt32());

        var first = await Page(admin, "/api/v1/admin/users?page=1&pageSize=2");
        var second = await Page(admin, "/api/v1/admin/users?page=2&pageSize=2");
        var firstIds = first.GetProperty("items").EnumerateArray().Select(u => u.GetProperty("id").GetGuid()).ToList();
        Assert.Equal(2, firstIds.Count);
        Assert.DoesNotContain(second.GetProperty("items").EnumerateArray().Select(u => u.GetProperty("id").GetGuid()), firstIds.Contains);

        foreach (var bad in new[] { "role=OWNER", "status=INACTIVE", "q=" + new string('a', 101) })
        {
            using var response = await admin.GetAsync("/api/v1/admin/users?" + bad);
            Assert.True(response.StatusCode is HttpStatusCode.BadRequest or HttpStatusCode.UnprocessableEntity, bad);
        }
    }

    [Fact]
    public async Task DetailReturnsVersionAndProfileSummaryWithoutSecrets()
    {
        await using var fixture = await AdminFixture.CreateAsync(postgres);
        using var admin = await fixture.CreateClientAsync(fixture.Admin);
        using var response = await admin.GetAsync($"/api/v1/admin/users/{fixture.Messaging.Tutor.Id}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(response.Headers.CacheControl?.NoStore);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("ACTIVE", body.GetProperty("status").GetString());
        Assert.Equal("APPROVED", body.GetProperty("tutorProfileStatus").GetString());
        var version = await fixture.WithDbAsync(db => db.Users.Where(u => u.Id == fixture.Messaging.Tutor.Id)
            .Select(u => u.ConcurrencyVersion).SingleAsync());
        Assert.Equal(version, body.GetProperty("version").GetGuid());
        var raw = body.ToString();
        foreach (var secret in new[] { "passwordHash", "securityStamp", "concurrencyStamp", "token" })
            Assert.DoesNotContain(secret, raw, StringComparison.OrdinalIgnoreCase);

        using var missing = await admin.GetAsync($"/api/v1/admin/users/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);
    }

    [Fact]
    public async Task LockRevokesSessionsHidesTutorAndAuditsThenUnlockRequiresNewLogin()
    {
        await using var fixture = await AdminFixture.CreateAsync(postgres);
        var tutor = fixture.Messaging.Tutor;
        using var admin = await fixture.CreateClientAsync(fixture.Admin);
        using var tutorSession = await fixture.CreateClientAsync(tutor);
        using var anonymous = fixture.Factory.CreateApiClient();
        var publicPath = $"/api/v1/tutors/{fixture.Messaging.TutorProfileId}";
        using (var visible = await anonymous.GetAsync(publicPath)) Assert.Equal(HttpStatusCode.OK, visible.StatusCode);
        var before = await fixture.WithDbAsync(db => db.Users.AsNoTracking().SingleAsync(u => u.Id == tutor.Id));

        using var lockResponse = await SetStatus(admin, tutor.Id, before.ConcurrencyVersion, "LOCKED");
        Assert.Equal(HttpStatusCode.OK, lockResponse.StatusCode);
        var locked = await lockResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("LOCKED", locked.GetProperty("status").GetString());
        var lockedVersion = locked.GetProperty("version").GetGuid();
        Assert.NotEqual(before.ConcurrencyVersion, lockedVersion);

        await fixture.WithDbAsync(async db =>
        {
            var user = await db.Users.AsNoTracking().SingleAsync(u => u.Id == tutor.Id);
            Assert.Equal(AccountStatus.LOCKED, user.Status);
            Assert.NotEqual(before.SecurityStamp, user.SecurityStamp);
            Assert.False(await db.TokenSessions.AnyAsync(s => s.UserId == tutor.Id && s.RevokedAt == null));
            var audit = await db.AuditEvents.SingleAsync(a => a.Action == "AccountLocked" && a.EntityId == tutor.Id.ToString());
            Assert.Equal(fixture.Admin.Id, audit.ActorUserId);
            Assert.Equal("UserAccount", audit.EntityType);
            Assert.Null(audit.IpAddress);
            return true;
        });
        // History stays referenced; only the account state changes.
        Assert.True(await fixture.WithDbAsync(db => db.HireRequests.AnyAsync(r => r.TutorProfileId == fixture.Messaging.TutorProfileId)));

        using (var me = await tutorSession.GetAsync("/api/v1/users/me")) Assert.Equal(HttpStatusCode.Unauthorized, me.StatusCode);
        using (var login = await SessionEndpointTests.Post(fixture.Factory.CreateApiClient(), "login",
                   new { email = tutor.Email, password = HiringFixture.Password }))
            Assert.NotEqual(HttpStatusCode.OK, login.StatusCode);
        using (var hidden = await anonymous.GetAsync(publicPath)) Assert.Equal(HttpStatusCode.NotFound, hidden.StatusCode);
        var search = await anonymous.GetFromJsonAsync<JsonElement>("/api/v1/tutors?pageSize=50");
        Assert.DoesNotContain(fixture.Messaging.TutorProfileId.ToString(), search.ToString());

        using (var repeat = await SetStatus(admin, tutor.Id, lockedVersion, "LOCKED"))
            Assert.Equal(HttpStatusCode.Conflict, repeat.StatusCode);

        using var unlockResponse = await SetStatus(admin, tutor.Id, lockedVersion, "ACTIVE");
        Assert.Equal(HttpStatusCode.OK, unlockResponse.StatusCode);
        var unlocked = await unlockResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("ACTIVE", unlocked.GetProperty("status").GetString());
        Assert.NotEqual(lockedVersion, unlocked.GetProperty("version").GetGuid());
        Assert.Equal(1, await fixture.WithDbAsync(db => db.AuditEvents.CountAsync(a => a.Action == "AccountUnlocked")));

        // The pre-lock session is never revived; a fresh login works.
        using (var me = await tutorSession.GetAsync("/api/v1/users/me")) Assert.Equal(HttpStatusCode.Unauthorized, me.StatusCode);
        using var fresh = await fixture.CreateClientAsync(tutor);
        using (var me = await fresh.GetAsync("/api/v1/users/me")) Assert.Equal(HttpStatusCode.OK, me.StatusCode);
        using (var visible = await anonymous.GetAsync(publicPath)) Assert.Equal(HttpStatusCode.OK, visible.StatusCode);
    }

    [Fact]
    public async Task SelfLockStaleVersionUnconfirmedAndNonAdminAreRejectedWithoutWrites()
    {
        await using var fixture = await AdminFixture.CreateAsync(postgres);
        using var admin = await fixture.CreateClientAsync(fixture.Admin);
        var versions = await fixture.WithDbAsync(db => db.Users.ToDictionaryAsync(u => u.Id, u => u.ConcurrencyVersion));

        using (var self = await SetStatus(admin, fixture.Admin.Id, versions[fixture.Admin.Id], "LOCKED"))
            Assert.Equal(HttpStatusCode.UnprocessableEntity, self.StatusCode);
        using (var stale = await SetStatus(admin, fixture.SecondAdmin.Id, Guid.NewGuid(), "LOCKED"))
            Assert.Equal(HttpStatusCode.Conflict, stale.StatusCode);
        using (var unconfirmed = await SetStatus(admin, fixture.SecondAdmin.Id, versions[fixture.SecondAdmin.Id], "LOCKED", confirmed: false))
            Assert.Equal(HttpStatusCode.UnprocessableEntity, unconfirmed.StatusCode);
        using (var inactive = await SetStatus(admin, fixture.SecondAdmin.Id, versions[fixture.SecondAdmin.Id], "INACTIVE"))
            Assert.Equal(HttpStatusCode.UnprocessableEntity, inactive.StatusCode);
        using (var missing = await SetStatus(admin, Guid.NewGuid(), Guid.NewGuid(), "LOCKED"))
            Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);

        foreach (var actor in new[] { fixture.Messaging.Learner, fixture.Messaging.Tutor })
        {
            using var client = await fixture.CreateClientAsync(actor);
            using var list = await client.GetAsync("/api/v1/admin/users");
            Assert.Equal(HttpStatusCode.Forbidden, list.StatusCode);
            using var change = await SetStatus(client, fixture.SecondAdmin.Id, versions[fixture.SecondAdmin.Id], "LOCKED");
            Assert.Equal(HttpStatusCode.Forbidden, change.StatusCode);
        }
        using (var anonymous = fixture.Factory.CreateApiClient())
        using (var list = await anonymous.GetAsync("/api/v1/admin/users"))
            Assert.Equal(HttpStatusCode.Unauthorized, list.StatusCode);

        await fixture.WithDbAsync(async db =>
        {
            Assert.Equal(versions, await db.Users.ToDictionaryAsync(u => u.Id, u => u.ConcurrencyVersion));
            Assert.False(await db.AuditEvents.AnyAsync(a => a.Action == "AccountLocked" || a.Action == "AccountUnlocked"));
            return true;
        });
    }

    [Fact]
    public async Task ConcurrentLocksWithSameVersionCommitExactlyOnce()
    {
        await using var fixture = await AdminFixture.CreateAsync(postgres);
        using var first = await fixture.CreateClientAsync(fixture.Admin);
        using var second = await fixture.CreateClientAsync(fixture.SecondAdmin);
        var target = fixture.Messaging.Learner.Id;
        var version = await fixture.WithDbAsync(db => db.Users.Where(u => u.Id == target).Select(u => u.ConcurrencyVersion).SingleAsync());
        var responses = await Task.WhenAll(SetStatus(first, target, version, "LOCKED"), SetStatus(second, target, version, "LOCKED"));
        try
        {
            Assert.Equal(new[] { HttpStatusCode.OK, HttpStatusCode.Conflict }, responses.Select(r => r.StatusCode).Order());
            Assert.Equal(1, await fixture.WithDbAsync(db => db.AuditEvents.CountAsync(a => a.Action == "AccountLocked" && a.EntityId == target.ToString())));
        }
        finally { foreach (var r in responses) r.Dispose(); }
    }

    private static async Task<JsonElement> Page(HttpClient client, string path)
    {
        using var response = await client.GetAsync(path);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(response.Headers.CacheControl?.NoStore);
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    private static Task<HttpResponseMessage> SetStatus(HttpClient client, Guid id, Guid version, string status, bool confirmed = true) =>
        PublicTutorDemandMatchApiTests.PostWithCsrfAsync(client, $"/api/v1/admin/users/{id}/status",
            new { expectedVersion = version, confirmed, status });
}
