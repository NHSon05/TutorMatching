using System.Net.Http.Json;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using TutorMatching.Api.Security;
using TutorMatching.Application.Abstractions;
using TutorMatching.Domain.Users;
using TutorMatching.Infrastructure;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Api.IntegrationTests.Security;

// Exercises the real security pipeline with a fake Identity store, never a developer database.
internal sealed class SecurityTestHost : IDisposable
{
    private readonly IHost host;
    private readonly HttpClient client;
    private readonly Dictionary<string, string> cookies = [];
    public TestClock Clock { get; } = new();
    public ApplicationUser User { get; } = new()
    {
        Id = Guid.NewGuid(), UserName = "test-user", SecurityStamp = "initial-stamp",
        Status = AccountStatus.ACTIVE
    };
    public IServiceProvider Services => host.Services;

    public SecurityTestHost(string environment = "Development")
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] = "Host=unused;Database=unused",
            ["Frontend:Origin"] = "https://frontend.example",
            ["Frontend:Origins:0"] = "http://localhost:3000",
            ["Frontend:Origins:1"] = "https://tutor-matching-psi.vercel.app/",
            ["Cookie:SecurePolicy"] = "SameAsRequest",
            ["Jwt:Issuer"] = "test-api",
            ["Jwt:Audience"] = "test-browser",
            ["Jwt:SigningKey"] = Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32))
        }).Build();
        host = new HostBuilder().ConfigureWebHost(builder => builder.UseTestServer().UseEnvironment(environment)
            .ConfigureServices((context, services) =>
            {
                services.AddRouting();
                services.AddLogging();
                services.AddInfrastructure(configuration);
                services.AddSingleton<TimeProvider>(Clock);
                services.AddScoped<IUserStore<ApplicationUser>>(_ => new TestUserStore(User));
                services.AddSingleton<ITokenSessionService>(new TestTokenSessions(User, Clock));
                services.AddApiSecurity(configuration, context.HostingEnvironment);
            })
            .Configure(app =>
            {
                app.UseRouting();
                app.UseApiSecurity();
                app.UseEndpoints(endpoints =>
                {
                    endpoints.MapCsrfEndpoint();
                    endpoints.MapPost("/api/test/signin", async context =>
                    {
                        var grant = await context.RequestServices.GetRequiredService<ITokenSessionService>().CreateAsync(User.Id);
                        context.RequestServices.GetRequiredService<JwtCookieTokens>().Issue(context, grant!);
                        context.Response.StatusCode = 204;
                    }).AllowAnonymous();
                    endpoints.MapPost("/api/test/refresh", async context =>
                    {
                        var grant = await context.RequestServices.GetRequiredService<ITokenSessionService>()
                            .RefreshAsync(context.Request.Cookies[JwtCookieTokens.RefreshCookie] ?? string.Empty);
                        if (grant is null) { context.Response.StatusCode = 401; return; }
                        context.RequestServices.GetRequiredService<JwtCookieTokens>().Issue(context, grant);
                        context.Response.StatusCode = 204;
                    }).AllowAnonymous();
                    endpoints.MapGet("/api/test/private", () => Results.Ok());
                    endpoints.MapGet("/api/test/admin", () => Results.Ok()).RequireAuthorization("ADMIN");
                    endpoints.MapPost("/api/v1/auth/probe", () => Results.NoContent()).AllowAnonymous();
                });
            })).Build();
        host.Start();
        client = host.GetTestClient();
        client.BaseAddress = new Uri("https://api.example");
    }

    public async Task<HttpResponseMessage> SendAsync(HttpMethod method, string path,
        string? csrf = null, string? origin = null, bool preflight = false)
    {
        using var request = new HttpRequestMessage(method, path);
        if (cookies.Count > 0)
            request.Headers.Add("Cookie", string.Join("; ", cookies.Select(pair => $"{pair.Key}={pair.Value}")));
        if (csrf is not null) request.Headers.Add(ApiSecurityExtensions.CsrfHeader, csrf);
        if (origin is not null) request.Headers.Add("Origin", origin);
        if (preflight)
        {
            request.Headers.Add("Access-Control-Request-Method", "POST");
            request.Headers.Add("Access-Control-Request-Headers", "content-type,x-csrf-token");
        }
        var response = await client.SendAsync(request);
        CaptureCookies(response);

        if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized &&
            path != "/api/test/refresh" &&
            path != "/api/v1/auth/csrf" &&
            cookies.ContainsKey(JwtCookieTokens.RefreshCookie))
        {
            var csrfToken = await CsrfAsync();
            using var refreshRequest = new HttpRequestMessage(HttpMethod.Post, "/api/test/refresh");
            refreshRequest.Headers.Add("Cookie", string.Join("; ", cookies.Select(pair => $"{pair.Key}={pair.Value}")));
            refreshRequest.Headers.Add(ApiSecurityExtensions.CsrfHeader, csrfToken);
            var refreshResponse = await client.SendAsync(refreshRequest);
            CaptureCookies(refreshResponse);

            if (refreshResponse.IsSuccessStatusCode)
            {
                response.Dispose();
                using var retryRequest = new HttpRequestMessage(method, path);
                retryRequest.Headers.Add("Cookie", string.Join("; ", cookies.Select(pair => $"{pair.Key}={pair.Value}")));
                if (csrf is not null) retryRequest.Headers.Add(ApiSecurityExtensions.CsrfHeader, csrf);
                if (origin is not null) retryRequest.Headers.Add("Origin", origin);
                response = await client.SendAsync(retryRequest);
                CaptureCookies(response);
            }
        }

        return response;
    }

    private void CaptureCookies(HttpResponseMessage msg)
    {
        if (msg.Headers.TryGetValues("Set-Cookie", out var values))
        {
            foreach (var value in values)
            {
                var pair = value.Split(';', 2)[0].Split('=', 2);
                cookies[pair[0]] = pair[1];
            }
        }
    }

    public async Task<string> CsrfAsync()
    {
        using var response = await SendAsync(HttpMethod.Get, "/api/v1/auth/csrf");
        response.EnsureSuccessStatusCode();
        var payload = await response.Content.ReadFromJsonAsync<CsrfPayload>();
        return payload!.RequestToken;
    }

    public async Task<HttpResponseMessage> SignInAsync() =>
        await SendAsync(HttpMethod.Post, "/api/test/signin", await CsrfAsync());

    public void Dispose()
    {
        client.Dispose();
        host.Dispose();
    }

    private sealed record CsrfPayload(string RequestToken, string HeaderName);
}

internal sealed class TestTokenSessions(ApplicationUser user, TimeProvider clock) : ITokenSessionService
{
    private sealed class SessionRecord
    {
        public Guid SessionId { get; init; }
        public Guid UserId { get; init; }
        public string SecurityStamp { get; set; } = string.Empty;
        public string Role { get; init; } = "LEARNER";
        public DateTimeOffset AbsoluteExpiresAt { get; init; }
        public bool IsRevoked { get; set; }
    }

    private sealed class RefreshRecord
    {
        public Guid SessionId { get; init; }
        public DateTimeOffset ExpiresAt { get; init; }
        public bool IsUsed { get; set; }
    }

    private readonly Dictionary<Guid, SessionRecord> sessions = [];
    private readonly Dictionary<string, RefreshRecord> refreshTokens = [];

    public Task<TokenSessionGrant?> CreateAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        if (user.Status != AccountStatus.ACTIVE || user.DeletedAt is not null)
            return Task.FromResult<TokenSessionGrant?>(null);

        var now = clock.GetUtcNow();
        var sessionId = Guid.NewGuid();
        var session = new SessionRecord
        {
            SessionId = sessionId,
            UserId = userId,
            SecurityStamp = user.SecurityStamp ?? string.Empty,
            Role = "LEARNER",
            AbsoluteExpiresAt = now.AddHours(8),
            IsRevoked = false
        };
        sessions[sessionId] = session;

        var rawRefresh = Guid.NewGuid().ToString("N");
        var refreshExpires = now.AddMinutes(30) > session.AbsoluteExpiresAt ? session.AbsoluteExpiresAt : now.AddMinutes(30);
        refreshTokens[rawRefresh] = new RefreshRecord
        {
            SessionId = sessionId,
            ExpiresAt = refreshExpires,
            IsUsed = false
        };

        return Task.FromResult<TokenSessionGrant?>(new TokenSessionGrant(sessionId, userId, "LEARNER", rawRefresh, refreshExpires));
    }

    public Task<TokenSessionGrant?> RefreshAsync(string rawRefreshToken, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(rawRefreshToken) || !refreshTokens.TryGetValue(rawRefreshToken, out var record))
            return Task.FromResult<TokenSessionGrant?>(null);

        if (!sessions.TryGetValue(record.SessionId, out var session) || session.IsRevoked)
            return Task.FromResult<TokenSessionGrant?>(null);

        if (record.IsUsed)
        {
            session.IsRevoked = true;
            return Task.FromResult<TokenSessionGrant?>(null);
        }

        var now = clock.GetUtcNow();
        if (now >= record.ExpiresAt || now >= session.AbsoluteExpiresAt)
            return Task.FromResult<TokenSessionGrant?>(null);

        if (user.SecurityStamp != session.SecurityStamp || user.Status != AccountStatus.ACTIVE || user.DeletedAt is not null)
        {
            session.IsRevoked = true;
            return Task.FromResult<TokenSessionGrant?>(null);
        }

        record.IsUsed = true;
        var newRefresh = Guid.NewGuid().ToString("N");
        var newExpiry = now.AddMinutes(30) > session.AbsoluteExpiresAt ? session.AbsoluteExpiresAt : now.AddMinutes(30);
        refreshTokens[newRefresh] = new RefreshRecord
        {
            SessionId = session.SessionId,
            ExpiresAt = newExpiry,
            IsUsed = false
        };

        return Task.FromResult<TokenSessionGrant?>(new TokenSessionGrant(session.SessionId, session.UserId, session.Role, newRefresh, newExpiry));
    }

    public Task<bool> ValidateAsync(Guid sessionId, Guid userId, string role, CancellationToken cancellationToken = default)
    {
        if (!sessions.TryGetValue(sessionId, out var session) || session.IsRevoked)
            return Task.FromResult(false);

        if (session.UserId != userId || !string.Equals(session.Role, role, StringComparison.OrdinalIgnoreCase))
            return Task.FromResult(false);

        var now = clock.GetUtcNow();
        if (now >= session.AbsoluteExpiresAt)
            return Task.FromResult(false);

        if (user.SecurityStamp != session.SecurityStamp || user.Status != AccountStatus.ACTIVE || user.DeletedAt is not null)
            return Task.FromResult(false);

        return Task.FromResult(true);
    }

    public Task<bool> LogoutAsync(string rawRefreshToken, CancellationToken cancellationToken = default)
    {
        if (!refreshTokens.TryGetValue(rawRefreshToken, out var record))
            return Task.FromResult(false);

        if (sessions.TryGetValue(record.SessionId, out var session))
        {
            session.IsRevoked = true;
            user.SecurityStamp = Guid.NewGuid().ToString("N");
        }

        return Task.FromResult(true);
    }
}

internal sealed class TestClock : TimeProvider
{
    private DateTimeOffset now = DateTimeOffset.UtcNow;
    public override DateTimeOffset GetUtcNow() => now;
    public void Advance(TimeSpan amount) => now += amount;
}

internal sealed class TestUserStore(ApplicationUser user) : IUserStore<ApplicationUser>, IUserSecurityStampStore<ApplicationUser>
{
    public Task<ApplicationUser?> FindByIdAsync(string userId, CancellationToken token) =>
        Task.FromResult(userId == user.Id.ToString() ? user : null);
    public Task<string?> GetSecurityStampAsync(ApplicationUser value, CancellationToken token) => Task.FromResult(value.SecurityStamp);
    public Task SetSecurityStampAsync(ApplicationUser value, string stamp, CancellationToken token)
    {
        value.SecurityStamp = stamp;
        return Task.CompletedTask;
    }
    public Task<string> GetUserIdAsync(ApplicationUser value, CancellationToken token) => Task.FromResult(value.Id.ToString());
    public Task<string?> GetUserNameAsync(ApplicationUser value, CancellationToken token) => Task.FromResult(value.UserName);
    public Task<string?> GetNormalizedUserNameAsync(ApplicationUser value, CancellationToken token) => Task.FromResult(value.NormalizedUserName);
    public Task SetUserNameAsync(ApplicationUser value, string? name, CancellationToken token) => throw new NotSupportedException();
    public Task SetNormalizedUserNameAsync(ApplicationUser value, string? name, CancellationToken token) => throw new NotSupportedException();
    public Task<IdentityResult> CreateAsync(ApplicationUser value, CancellationToken token) => throw new NotSupportedException();
    public Task<IdentityResult> UpdateAsync(ApplicationUser value, CancellationToken token) => throw new NotSupportedException();
    public Task<IdentityResult> DeleteAsync(ApplicationUser value, CancellationToken token) => throw new NotSupportedException();
    public Task<ApplicationUser?> FindByNameAsync(string name, CancellationToken token) => throw new NotSupportedException();
    public void Dispose() { }
}
