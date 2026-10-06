using System.Net;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using TutorMatching.Domain.Users;

namespace TutorMatching.Api.IntegrationTests.Security;

public sealed class ApiSecurityTests
{
    [Fact]
    public void IdentityConfiguresFiveAttemptsAndFifteenMinuteLockout()
    {
        using var host = new SecurityTestHost();
        var options = host.Services.GetRequiredService<IOptions<IdentityOptions>>().Value;
        Assert.True(options.Lockout.AllowedForNewUsers);
        Assert.Equal(5, options.Lockout.MaxFailedAccessAttempts);
        Assert.Equal(TimeSpan.FromMinutes(15), options.Lockout.DefaultLockoutTimeSpan);
    }

    [Fact]
    public async Task AnonymousAndWrongRoleReturnStatusCodesWithoutRedirects()
    {
        using var host = new SecurityTestHost();
        using var anonymous = await host.SendAsync(HttpMethod.Get, "/api/test/private");
        Assert.Equal(HttpStatusCode.Unauthorized, anonymous.StatusCode);
        Assert.Null(anonymous.Headers.Location);
        using var login = await host.SignInAsync();
        Assert.Equal(HttpStatusCode.NoContent, login.StatusCode);
        using var allowed = await host.SendAsync(HttpMethod.Get, "/api/test/private");
        Assert.Equal(HttpStatusCode.OK, allowed.StatusCode);
        using var forbidden = await host.SendAsync(HttpMethod.Get, "/api/test/admin");
        Assert.Equal(HttpStatusCode.Forbidden, forbidden.StatusCode);
        Assert.Null(forbidden.Headers.Location);
    }

    [Fact]
    public async Task CookieIsSecureHttpOnlyLaxAndNotPersistentInProduction()
    {
        using var host = new SecurityTestHost("Production");
        var options = host.Services.GetRequiredService<IOptionsMonitor<CookieAuthenticationOptions>>()
            .Get(IdentityConstants.ApplicationScheme);
        Assert.Equal(CookieSecurePolicy.Always, options.Cookie.SecurePolicy);
        using var response = await host.SignInAsync();
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        var cookie = response.Headers.GetValues("Set-Cookie")
            .Single(value => value.StartsWith("tutormatch_session="));
        Assert.Contains("secure", cookie);
        Assert.Contains("httponly", cookie);
        Assert.Contains("samesite=lax", cookie);
        Assert.DoesNotContain("expires=", cookie);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("invalid-token")]
    public async Task AnonymousMutationsRejectMissingOrInvalidCsrf(string? token)
    {
        using var host = new SecurityTestHost();
        using var rejected = await host.SendAsync(HttpMethod.Post, "/api/v1/auth/probe", token);
        Assert.Equal(HttpStatusCode.BadRequest, rejected.StatusCode);
        using var accepted = await host.SendAsync(HttpMethod.Post, "/api/v1/auth/probe", await host.CsrfAsync());
        Assert.Equal(HttpStatusCode.NoContent, accepted.StatusCode);
    }

    [Fact]
    public async Task CsrfTokenIsNotCachedAndMustBeRefetchedAfterSignIn()
    {
        using var host = new SecurityTestHost();
        var anonymousToken = await host.CsrfAsync();
        using var login = await host.SignInAsync();
        using var rejected = await host.SendAsync(HttpMethod.Post, "/api/v1/auth/probe", anonymousToken);
        Assert.Equal(HttpStatusCode.BadRequest, rejected.StatusCode);
        using var tokenResponse = await host.SendAsync(HttpMethod.Get, "/api/v1/auth/csrf");
        Assert.True(tokenResponse.Headers.CacheControl?.NoStore);
        using var accepted = await host.SendAsync(HttpMethod.Post, "/api/v1/auth/probe", await host.CsrfAsync());
        Assert.Equal(HttpStatusCode.NoContent, accepted.StatusCode);
    }

    [Theory]
    [InlineData("https://frontend.example", true)]
    [InlineData("https://untrusted.example", false)]
    public async Task CorsAllowsCredentialsOnlyForConfiguredOrigin(string origin, bool allowed)
    {
        using var host = new SecurityTestHost();
        using var response = await host.SendAsync(HttpMethod.Options, "/api/v1/auth/probe",
            origin: origin, preflight: true);
        Assert.Equal(allowed, response.Headers.Contains("Access-Control-Allow-Origin"));
        if (allowed)
        {
            Assert.Equal(origin, response.Headers.GetValues("Access-Control-Allow-Origin").Single());
            Assert.Equal("true", response.Headers.GetValues("Access-Control-Allow-Credentials").Single());
        }
    }

    [Fact]
    public async Task IdleSessionExpiresAfterThirtyMinutes()
    {
        using var host = new SecurityTestHost();
        using var login = await host.SignInAsync();
        host.Clock.Advance(TimeSpan.FromMinutes(31));
        using var response = await host.SendAsync(HttpMethod.Get, "/api/test/private");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ActiveSessionRenewsButCannotExceedEightHours()
    {
        using var host = new SecurityTestHost();
        using var login = await host.SignInAsync();
        for (var i = 1; i <= 20; i++)
        {
            host.Clock.Advance(TimeSpan.FromMinutes(25));
            using var response = await host.SendAsync(HttpMethod.Get, "/api/test/private");
            Assert.Equal(i < 20 ? HttpStatusCode.OK : HttpStatusCode.Unauthorized, response.StatusCode);
        }
    }

    [Theory]
    [InlineData("stamp")]
    [InlineData("locked")]
    [InlineData("inactive")]
    [InlineData("deleted")]
    public async Task RevokedOrDisabledAccountsCannotReuseCookie(string change)
    {
        using var host = new SecurityTestHost();
        using var login = await host.SignInAsync();
        switch (change)
        {
            case "stamp": host.User.SecurityStamp = "rotated-stamp"; break;
            case "locked": host.User.Status = AccountStatus.LOCKED; break;
            case "inactive": host.User.Status = AccountStatus.INACTIVE; break;
            case "deleted": host.User.DeletedAt = host.Clock.GetUtcNow(); break;
        }
        using var response = await host.SendAsync(HttpMethod.Get, "/api/test/private");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task AuthMutationsAreRateLimitedWithRetryAfter()
    {
        using var host = new SecurityTestHost();
        var token = await host.CsrfAsync();
        for (var i = 0; i < 10; i++)
        {
            using var accepted = await host.SendAsync(HttpMethod.Post, "/api/v1/auth/probe", token);
            Assert.Equal(HttpStatusCode.NoContent, accepted.StatusCode);
        }
        using var rejected = await host.SendAsync(HttpMethod.Post, "/api/v1/auth/probe", token);
        Assert.Equal(HttpStatusCode.TooManyRequests, rejected.StatusCode);
        Assert.NotNull(rejected.Headers.RetryAfter);
    }

    [Fact]
    public async Task GlobalLimitAlsoAppliesToNonAuthEndpoints()
    {
        using var host = new SecurityTestHost();
        for (var i = 0; i < 120; i++)
        {
            using var response = await host.SendAsync(HttpMethod.Get, "/api/test/private");
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }
        using var rejected = await host.SendAsync(HttpMethod.Get, "/api/test/private");
        Assert.Equal(HttpStatusCode.TooManyRequests, rejected.StatusCode);
    }
}
