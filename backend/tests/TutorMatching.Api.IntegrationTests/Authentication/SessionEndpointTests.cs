using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using TutorMatching.Api.IntegrationTests.Fixtures;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Api.IntegrationTests.Authentication;

[Collection("PostgreSQL API")]
public sealed class SessionEndpointTests(PostgreSqlFixture fixture)
{
    [Fact]
    public async Task LoginCreatesPrivateSessionAndLogoutRevokesCopiedCookie()
    {
        await using var factory = await fixture.CreateFactoryAsync();
        using var client = factory.CreateApiClient();
        await Register(client);
        using var login = await Post(client, "login", new { email = "session@example.com", password = "password" });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        var cookie = login.Headers.GetValues("Set-Cookie").Single(x => x.StartsWith("accessToken="));
        var refreshCookie = login.Headers.GetValues("Set-Cookie").Single(x => x.StartsWith("refreshToken="));
        Assert.Contains("httponly", refreshCookie);
        Assert.Contains("secure", refreshCookie);
        Assert.Contains("path=/api/v1/auth", refreshCookie);
        var body = await login.Content.ReadAsStringAsync();
        Assert.DoesNotContain("accessToken", body);
        Assert.DoesNotContain("refreshToken", body);
        Assert.Contains("httponly", cookie);
        Assert.Contains("secure", cookie);
        using var me = await client.GetAsync("/api/v1/users/me");
        Assert.Equal(HttpStatusCode.OK, me.StatusCode);
        using var logout = await Post(client, "logout", null);
        Assert.Equal(HttpStatusCode.NoContent, logout.StatusCode);
        using var replay = factory.CreateApiClient();
        replay.DefaultRequestHeaders.Add("Cookie", cookie.Split(';')[0]);
        using var denied = await replay.GetAsync("/api/v1/users/me");
        Assert.Equal(HttpStatusCode.Unauthorized, denied.StatusCode);
    }

    [Fact]
    public async Task RefreshRotatesSessionAndRevokesOnReuse()
    {
        await using var factory = await fixture.CreateFactoryAsync();
        using var client = factory.CreateApiClient();
        await Register(client);
        using var login = await Post(client, "login", new { email = "session@example.com", password = "password" });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        var originalRefresh = login.Headers.GetValues("Set-Cookie").Single(x => x.StartsWith("refreshToken="));

        // Advance beyond access token expiry: refresh works with valid refresh cookie.
        factory.Clock.Advance(TimeSpan.FromMinutes(6));
        using var refresh1 = await Post(client, "refresh", null);
        Assert.Equal(HttpStatusCode.NoContent, refresh1.StatusCode);
        var rotatedAccess = refresh1.Headers.GetValues("Set-Cookie").Single(x => x.StartsWith("accessToken="));
        var rotatedRefresh = refresh1.Headers.GetValues("Set-Cookie").Single(x => x.StartsWith("refreshToken="));
        Assert.NotEqual(originalRefresh, rotatedRefresh);

        // Access works with rotated token.
        using var me = await client.GetAsync("/api/v1/users/me");
        Assert.Equal(HttpStatusCode.OK, me.StatusCode);

        // Reusing the consumed original token must fail and revoke the session family.
        using var attacker = factory.CreateApiClient();
        attacker.DefaultRequestHeaders.Add("Cookie", originalRefresh.Split(';')[0]);
        using var reused = await Post(attacker, "refresh", null);
        Assert.Equal(HttpStatusCode.Unauthorized, reused.StatusCode);

        // Current legitimate session is now revoked as well.
        using var legitAfterReuse = await Post(client, "refresh", null);
        Assert.Equal(HttpStatusCode.Unauthorized, legitAfterReuse.StatusCode);
    }

    [Fact]
    public async Task FiveFailuresLockAccountAndUnknownEmailHasSameFailure()
    {
        await using var factory = await fixture.CreateFactoryAsync();
        using var client = factory.CreateApiClient();
        await Register(client);
        for (var i = 0; i < 5; i++)
        {
            using var failed = await Post(client, "login", new { email = "session@example.com", password = "wrong" });
            Assert.Equal(HttpStatusCode.Unauthorized, failed.StatusCode);
        }
        using var locked = await Post(client, "login", new { email = "session@example.com", password = "password" });
        using var missing = await Post(client, "login", new { email = "missing@example.com", password = "password" });
        Assert.Equal(HttpStatusCode.Unauthorized, locked.StatusCode);
        Assert.Equal(locked.StatusCode, missing.StatusCode);
        await using var scope = factory.Services.CreateAsyncScope();
        var manager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        Assert.True(await manager.IsLockedOutAsync((await manager.FindByEmailAsync("session@example.com"))!));
    }

    internal static async Task Register(HttpClient client)
    {
        using var response = await Post(client, "register", new { fullName = "Session User", email = "session@example.com", password = "password", passwordConfirmation = "password", role = "LEARNER" });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    internal static async Task<HttpResponseMessage> Post(HttpClient client, string action, object? body)
    {
        var csrf = await client.GetFromJsonAsync<Csrf>("/api/v1/auth/csrf");
        using var request = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/auth/{action}");
        request.Headers.Add(csrf!.HeaderName, csrf.RequestToken);
        if (body is not null) request.Content = JsonContent.Create(body);
        return await client.SendAsync(request);
    }
    private sealed record Csrf(string RequestToken, string HeaderName);
}
