using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorMatching.Api.IntegrationTests.Fixtures;
using TutorMatching.Domain.Tutors;
using TutorMatching.Domain.Users;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Api.IntegrationTests.Authentication;

[Collection("PostgreSQL API")]
public sealed class GoogleAuthTests(PostgreSqlFixture fixture)
{
    private const string Picture = "https://lh3.googleusercontent.com/a/test-picture";

    [Theory]
    [InlineData("LEARNER")]
    [InlineData("TUTOR")]
    public async Task UnknownGoogleIdentityRequiresRoleThenCreatesPasswordlessSignedInAccount(string role)
    {
        await using var factory = await fixture.CreateFactoryAsync();
        using var client = factory.CreateApiClient();
        var email = $"new-{Guid.NewGuid():N}@gmail.com";
        var credential = factory.Google.Register("sub-new", email, "Nguyễn Văn Google", Picture);

        using var first = await SessionEndpointTests.Post(client, "google", new { credential });

        Assert.Equal(HttpStatusCode.Accepted, first.StatusCode);
        Assert.DoesNotContain(first.Headers, h => h.Key == "Set-Cookie" &&
            h.Value.Any(v => v.StartsWith("accessToken=") && !v.StartsWith("accessToken=;")));
        var pending = await first.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("role_required", pending.GetProperty("status").GetString());
        Assert.Equal(email, pending.GetProperty("email").GetString());
        Assert.Equal("Nguyễn Văn Google", pending.GetProperty("fullName").GetString());
        Assert.Equal(Picture, pending.GetProperty("avatarUrl").GetString());
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            Assert.False(await scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().Users
                .AnyAsync(u => u.Email == email));
        }

        using var complete = await SessionEndpointTests.Post(client, "google/complete",
            new { pendingToken = pending.GetProperty("pendingToken").GetString(), role });

        Assert.Equal(HttpStatusCode.Created, complete.StatusCode);
        Assert.Contains(complete.Headers.GetValues("Set-Cookie"), v => v.StartsWith("accessToken="));
        var body = await complete.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(role, body.GetProperty("role").GetString());
        Assert.Equal(Picture, body.GetProperty("avatarUrl").GetString());
        using var me = await client.GetAsync("/api/v1/users/me");
        Assert.Equal(HttpStatusCode.OK, me.StatusCode);

        await using var verify = factory.Services.CreateAsyncScope();
        var db = verify.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var user = await db.Users.SingleAsync(u => u.Email == email);
        Assert.Null(user.PasswordHash);
        Assert.True(user.EmailConfirmed);
        Assert.Equal(AccountStatus.ACTIVE, user.Status);
        Assert.Equal(Picture, user.AvatarUrl);
        Assert.Equal(1, await db.UserLogins.CountAsync(l => l.UserId == user.Id && l.LoginProvider == "Google" && l.ProviderKey == "sub-new"));
        var tutorProfile = await db.TutorProfiles.SingleOrDefaultAsync(t => t.UserId == user.Id);
        if (role == "TUTOR") Assert.Equal(TutorProfileStatus.DRAFT, tutorProfile!.Status);
        else Assert.Null(tutorProfile);
        Assert.True(await db.AuditEvents.AnyAsync(a => a.Action == "ExternalAccountRegistered" && a.EntityId == user.Id.ToString()));
    }

    [Fact]
    public async Task LinkedGoogleIdentitySignsInDirectlyAndLogoutEndsSession()
    {
        await using var factory = await fixture.CreateFactoryAsync();
        using var client = factory.CreateApiClient();
        var email = $"linked-{Guid.NewGuid():N}@gmail.com";
        var credential = factory.Google.Register("sub-linked", email);
        await RegisterWithGoogleAsync(client, credential, "LEARNER");
        using (var logout = await SessionEndpointTests.Post(client, "logout", null))
            Assert.Equal(HttpStatusCode.NoContent, logout.StatusCode);

        using var signIn = await SessionEndpointTests.Post(client, "google", new { credential });

        Assert.Equal(HttpStatusCode.OK, signIn.StatusCode);
        Assert.True(signIn.Headers.CacheControl?.NoStore);
        Assert.Contains(signIn.Headers.GetValues("Set-Cookie"), v => v.StartsWith("accessToken=") && v.Contains("httponly"));
        var body = await signIn.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(email, body.GetProperty("email").GetString());
        using var me = await client.GetAsync("/api/v1/users/me");
        Assert.Equal(HttpStatusCode.OK, me.StatusCode);
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var user = await db.Users.SingleAsync(u => u.Email == email);
        Assert.NotNull(user.LastLoginAt);
        Assert.Equal(1, await db.UserLogins.CountAsync(l => l.UserId == user.Id));
        Assert.True(await db.AuditEvents.AnyAsync(a => a.Action == "ExternalSignInSucceeded" && a.EntityId == user.Id.ToString()));
    }

    [Fact]
    public async Task SameVerifiedEmailLinksExistingPasswordAccountWithoutChangingIt()
    {
        await using var factory = await fixture.CreateFactoryAsync();
        using var client = factory.CreateApiClient();
        await SessionEndpointTests.Register(client); // session@example.com / password, LEARNER
        var credential = factory.Google.Register("sub-link", "SESSION@example.com", "Other Name", Picture);

        using var signIn = await SessionEndpointTests.Post(client, "google", new { credential });

        Assert.Equal(HttpStatusCode.OK, signIn.StatusCode);
        var body = await signIn.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Session User", body.GetProperty("fullName").GetString());
        Assert.Equal(JsonValueKind.Null, body.GetProperty("avatarUrl").ValueKind);
        using var password = await SessionEndpointTests.Post(client, "login", new { email = "session@example.com", password = "password" });
        Assert.Equal(HttpStatusCode.OK, password.StatusCode);
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var user = await db.Users.SingleAsync();
        Assert.Equal(AccountRole.LEARNER, user.Role);
        Assert.Null(user.AvatarUrl);
        Assert.True(await db.AuditEvents.AnyAsync(a => a.Action == "ExternalLoginLinked"));
    }

    [Fact]
    public async Task RefusalsAreGenericAndCreateNothing()
    {
        await using var factory = await fixture.CreateFactoryAsync();
        using var client = factory.CreateApiClient();
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            await CreateUserAsync(users, "admin@example.com", AccountRole.ADMIN, AccountStatus.ACTIVE);
            await CreateUserAsync(users, "locked@example.com", AccountRole.LEARNER, AccountStatus.LOCKED);
        }

        var credentials = new[]
        {
            "not-a-registered-google-credential",
            factory.Google.Register("sub-admin", "admin@example.com"),
            factory.Google.Register("sub-locked", "locked@example.com"),
            factory.Google.Register("sub-unverified", "unverified@example.com", emailVerified: false),
        };
        var titles = new List<string?>();
        foreach (var credential in credentials)
        {
            using var response = await SessionEndpointTests.Post(client, "google", new { credential });
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
            Assert.DoesNotContain(response.Headers.TryGetValues("Set-Cookie", out var cookies) ? cookies : [],
                v => v.StartsWith("accessToken=") && !v.StartsWith("accessToken=;"));
            titles.Add((await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("title").GetString());
        }

        Assert.Single(titles.Distinct());
        await using var verify = factory.Services.CreateAsyncScope();
        var db = verify.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        Assert.Equal(0, await db.UserLogins.CountAsync());
        Assert.False(await db.Users.AnyAsync(u => u.Email == "unverified@example.com"));
        Assert.True(await db.AuditEvents.CountAsync(a => a.Action == "ExternalSignInFailed") >= credentials.Length);
    }

    [Fact]
    public async Task CompleteRejectsAdminRoleExpiredTokenAndMissingCsrf()
    {
        await using var factory = await fixture.CreateFactoryAsync();
        using var client = factory.CreateApiClient();
        var credential = factory.Google.Register("sub-expire", $"expire-{Guid.NewGuid():N}@gmail.com");
        var pendingToken = await StartAsync(client, credential);

        using (var admin = await SessionEndpointTests.Post(client, "google/complete", new { pendingToken, role = "ADMIN" }))
            Assert.Equal(HttpStatusCode.BadRequest, admin.StatusCode);
        using (var tampered = await SessionEndpointTests.Post(client, "google/complete", new { pendingToken = pendingToken + "x", role = "LEARNER" }))
            Assert.Equal(HttpStatusCode.Unauthorized, tampered.StatusCode);

        factory.Clock.Advance(TimeSpan.FromMinutes(11));
        using (var expired = await SessionEndpointTests.Post(client, "google/complete", new { pendingToken, role = "LEARNER" }))
            Assert.Equal(HttpStatusCode.Unauthorized, expired.StatusCode);

        using var noCsrf = await client.PostAsJsonAsync("/api/v1/auth/google", new { credential });
        Assert.Equal(HttpStatusCode.BadRequest, noCsrf.StatusCode);
        await using var scope = factory.Services.CreateAsyncScope();
        Assert.Equal(0, await scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().Users.CountAsync());
    }

    [Fact]
    public async Task ConcurrentOrReplayedCompletionCreatesExactlyOneAccount()
    {
        await using var factory = await fixture.CreateFactoryAsync();
        using var client = factory.CreateApiClient();
        var email = $"race-{Guid.NewGuid():N}@gmail.com";
        var credential = factory.Google.Register("sub-race", email);
        var pendingToken = await StartAsync(client, credential);

        using var otherTab = factory.CreateApiClient();
        var responses = await Task.WhenAll(
            SessionEndpointTests.Post(client, "google/complete", new { pendingToken, role = "LEARNER" }),
            SessionEndpointTests.Post(otherTab, "google/complete", new { pendingToken, role = "LEARNER" }));
        using var replay = await SessionEndpointTests.Post(client, "google/complete", new { pendingToken, role = "LEARNER" });

        Assert.All(responses.Append(replay), r => Assert.Equal(HttpStatusCode.Created, r.StatusCode));
        var ids = new HashSet<Guid>();
        foreach (var response in responses.Append(replay))
        {
            ids.Add((await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid());
            response.Dispose();
        }
        Assert.Single(ids);
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        Assert.Equal(1, await db.Users.CountAsync(u => u.Email == email));
        Assert.Equal(1, await db.UserLogins.CountAsync(l => l.ProviderKey == "sub-race"));
    }

    [Fact]
    public async Task PasswordSignInForGoogleOnlyAccountReturnsStandardInvalidCredentials()
    {
        await using var factory = await fixture.CreateFactoryAsync();
        using var client = factory.CreateApiClient();
        var email = $"google-only-{Guid.NewGuid():N}@gmail.com";
        await RegisterWithGoogleAsync(client, factory.Google.Register("sub-only", email), "TUTOR");

        using var googleOnly = await SessionEndpointTests.Post(client, "login", new { email, password = "anything-123" });
        using var unknown = await SessionEndpointTests.Post(client, "login", new { email = "nobody@example.com", password = "anything-123" });

        Assert.Equal(HttpStatusCode.Unauthorized, googleOnly.StatusCode);
        Assert.Equal(
            (await unknown.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("title").GetString(),
            (await googleOnly.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("title").GetString());
    }

    private static async Task<string> StartAsync(HttpClient client, string credential)
    {
        using var response = await SessionEndpointTests.Post(client, "google", new { credential });
        Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("pendingToken").GetString()!;
    }

    private static async Task RegisterWithGoogleAsync(HttpClient client, string credential, string role)
    {
        var pendingToken = await StartAsync(client, credential);
        using var complete = await SessionEndpointTests.Post(client, "google/complete", new { pendingToken, role });
        Assert.Equal(HttpStatusCode.Created, complete.StatusCode);
    }

    private static async Task CreateUserAsync(UserManager<ApplicationUser> users, string email, AccountRole role,
        AccountStatus status)
    {
        var now = DateTimeOffset.UtcNow;
        var result = await users.CreateAsync(new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = email,
            Email = email,
            FullName = "Seeded User",
            Role = role,
            Status = status,
            CreatedAt = now,
            UpdatedAt = now
        }, "password-123");
        Assert.True(result.Succeeded);
    }
}
