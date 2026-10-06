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
            ["Cookie:SecurePolicy"] = "SameAsRequest"
        }).Build();
        host = new HostBuilder().ConfigureWebHost(builder => builder.UseTestServer().UseEnvironment(environment)
            .ConfigureServices((context, services) =>
            {
                services.AddRouting();
                services.AddLogging();
                services.AddInfrastructure(configuration);
                services.AddSingleton<TimeProvider>(Clock);
                services.AddScoped<IUserStore<ApplicationUser>>(_ => new TestUserStore(User));
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
                        var principal = new ClaimsPrincipal(new ClaimsIdentity(new[]
                        {
                            new Claim(ClaimTypes.NameIdentifier, User.Id.ToString()),
                            new Claim(ClaimTypes.Name, "test-user"),
                            new Claim(ClaimTypes.Role, AccountRole.LEARNER.ToString()),
                            new Claim("AspNet.Identity.SecurityStamp", User.SecurityStamp!)
                        }, IdentityConstants.ApplicationScheme));
                        await context.SignInAsync(IdentityConstants.ApplicationScheme, principal);
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
        if (response.Headers.TryGetValues("Set-Cookie", out var values))
        {
            foreach (var value in values)
            {
                var pair = value.Split(';', 2)[0].Split('=', 2);
                cookies[pair[0]] = pair[1];
            }
        }
        return response;
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
