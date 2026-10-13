using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using TutorMatching.Application.Abstractions;
using TutorMatching.Api.IntegrationTests.Fixtures;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Api.IntegrationTests.Authentication;

[Collection("PostgreSQL API")]
public sealed class SessionEndpointTests(PostgreSqlFixture fixture)
{
    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task RoleRemovalOrReplacementDeniesAccessAndRefreshWithoutStampChange(bool replaceRole)
    {
        await using var factory = await fixture.CreateFactoryAsync();
        using var client = factory.CreateApiClient();
        await Register(client);
        using var login = await Post(client, "login", new { email = "session@example.com", password = "password" });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var manager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var user = (await manager.FindByEmailAsync("session@example.com"))!;
        var stamp = user.SecurityStamp;
        var session = await db.TokenSessions.AsNoTracking().SingleAsync();
        Assert.True((await manager.RemoveFromRoleAsync(user, "LEARNER")).Succeeded);
        if (replaceRole) Assert.True((await manager.AddToRoleAsync(user, "TUTOR")).Succeeded);
        Assert.Equal(stamp, (await db.Users.AsNoTracking().SingleAsync()).SecurityStamp);

        // Direct service assertion avoids relying on /me's independent profile/role checks.
        var service = scope.ServiceProvider.GetRequiredService<ITokenSessionService>();
        Assert.False(await service.ValidateAsync(session.Id, user.Id, session.Role));
        using var denied = await client.GetAsync("/api/v1/users/me");
        Assert.Equal(HttpStatusCode.Unauthorized, denied.StatusCode);
        using var refresh = await Post(client, "refresh", null);
        Assert.Equal(HttpStatusCode.Unauthorized, refresh.StatusCode);
        Assert.DoesNotContain(refresh.Headers.GetValues("Set-Cookie"), value =>
            value.StartsWith("accessToken=") && !value.StartsWith("accessToken=;"));
        Assert.NotNull((await db.TokenSessions.AsNoTracking().SingleAsync()).RevokedAt);
        Assert.Single(await db.SessionRefreshTokens.ToListAsync());
    }

    [Fact]
    public async Task RotationReuseAndLogoutRecordActualEventTimesWithoutOverwritingRevocation()
    {
        await using var factory = await fixture.CreateFactoryAsync();
        using var client = factory.CreateApiClient();
        await Register(client);
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var service = scope.ServiceProvider.GetRequiredService<ITokenSessionService>();
        var grant = (await service.CreateAsync((await db.Users.SingleAsync()).Id))!;
        Assert.Null((await db.TokenSessions.SingleAsync()).RevokedAt);
        Assert.Null((await db.SessionRefreshTokens.SingleAsync()).ConsumedAt);
        Assert.True(await service.ValidateAsync(grant.SessionId, grant.UserId, grant.Role));
        factory.Clock.Advance(TimeSpan.FromMinutes(1));
        var consumedAt = factory.Clock.GetUtcNow();
        var rotated = await service.RefreshAsync(grant.RefreshToken);
        Assert.NotNull(rotated);
        var tokens = await db.SessionRefreshTokens.AsNoTracking().ToListAsync();
        Assert.Single(tokens, token => token.ConsumedAt == consumedAt);
        Assert.Single(tokens, token => token.ConsumedAt is null);
        factory.Clock.Advance(TimeSpan.FromMinutes(1));
        var revokedAt = factory.Clock.GetUtcNow();
        Assert.Null(await service.RefreshAsync(grant.RefreshToken));
        Assert.Equal(revokedAt, (await db.TokenSessions.AsNoTracking().SingleAsync()).RevokedAt);
        factory.Clock.Advance(TimeSpan.FromMinutes(1));
        Assert.True(await service.LogoutAsync(rotated.RefreshToken));
        Assert.Equal(revokedAt, (await db.TokenSessions.AsNoTracking().SingleAsync()).RevokedAt);

        var another = (await service.CreateAsync(grant.UserId))!;
        factory.Clock.Advance(TimeSpan.FromMinutes(1));
        Assert.True(await service.LogoutAsync(another.RefreshToken));
        Assert.Equal(factory.Clock.GetUtcNow(), (await db.TokenSessions.AsNoTracking()
            .SingleAsync(s => s.Id == another.SessionId)).RevokedAt);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("https://example.com/avatar.png")]
    public async Task LoginReturnsTokensAndAvatarAndLogoutRevokesCopiedCookie(string? avatarUrl)
    {
        await using var factory = await fixture.CreateFactoryAsync();
        using var client = factory.CreateApiClient();
        await Register(client);
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var user = await db.Users.SingleAsync();
            user.AvatarUrl = avatarUrl;
            await db.SaveChangesAsync();
        }
        using var login = await Post(client, "login", new { email = "session@example.com", password = "password" });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        var cookie = login.Headers.GetValues("Set-Cookie").Single(x => x.StartsWith("accessToken="));
        var refreshCookie = login.Headers.GetValues("Set-Cookie").Single(x => x.StartsWith("refreshToken="));
        Assert.Contains("httponly", refreshCookie);
        Assert.Contains("secure", refreshCookie);
        Assert.Contains("path=/api/v1/auth", refreshCookie);
        var body = await login.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
        var accessToken = body.GetProperty("accessToken").GetString();
        var refreshToken = body.GetProperty("refreshToken").GetString();
        Assert.False(string.IsNullOrWhiteSpace(accessToken));
        Assert.False(string.IsNullOrWhiteSpace(refreshToken));
        Assert.Equal($"accessToken={accessToken}", cookie.Split(';')[0]);
        Assert.Equal($"refreshToken={refreshToken}", refreshCookie.Split(';')[0]);
        Assert.Equal(avatarUrl, body.GetProperty("avatarUrl").GetString());
        Assert.Equal("session@example.com", body.GetProperty("email").GetString());
        Assert.Equal("Session User", body.GetProperty("fullName").GetString());
        Assert.Equal("LEARNER", body.GetProperty("role").GetString());
        Assert.Equal("ACTIVE", body.GetProperty("status").GetString());
        Assert.NotEqual(Guid.Empty, body.GetProperty("id").GetGuid());
        Assert.True(login.Headers.CacheControl?.NoStore);
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

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task ConcurrentRefreshOrLogoutCannotLeaveAnActiveFamily(bool logout)
    {
        await using var factory = await fixture.CreateFactoryAsync();
        using var client = factory.CreateApiClient();
        await Register(client);
        await using var setup = factory.Services.CreateAsyncScope();
        var db = setup.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var user = await db.Users.SingleAsync();
        var grant = (await setup.ServiceProvider.GetRequiredService<ITokenSessionService>().CreateAsync(user.Id))!;

        // Hold the row so both requests overlap deterministically. Without the
        // service lock both read ConsumedAt=null and block only at SaveChanges.
        await using var blocker = new NpgsqlConnection(db.Database.GetConnectionString());
        await blocker.OpenAsync();
        await using var transaction = await blocker.BeginTransactionAsync();
        await using var command = new NpgsqlCommand("SELECT 1 FROM token_sessions WHERE id = @id FOR UPDATE", blocker, transaction);
        command.Parameters.AddWithValue("id", grant.SessionId);
        await command.ExecuteScalarAsync();

        await using var firstScope = factory.Services.CreateAsyncScope();
        await using var secondScope = factory.Services.CreateAsyncScope();
        var first = firstScope.ServiceProvider.GetRequiredService<ITokenSessionService>().RefreshAsync(grant.RefreshToken);
        var secondService = secondScope.ServiceProvider.GetRequiredService<ITokenSessionService>();
        Task<TokenSessionGrant?>? secondRefresh = null;
        Task<bool>? secondLogout = null;
        if (logout) secondLogout = secondService.LogoutAsync(grant.RefreshToken);
        else secondRefresh = secondService.RefreshAsync(grant.RefreshToken);

        await using var observer = new NpgsqlConnection(db.Database.GetConnectionString());
        await observer.OpenAsync();
        var waiting = false;
        try
        {
            using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(15));
            while (!waiting)
            {
                await using var query = new NpgsqlCommand("SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND cardinality(pg_blocking_pids(pid)) > 0", observer);
                waiting = (long)(await query.ExecuteScalarAsync(timeout.Token))! >= 2;
                if (!waiting) await Task.Delay(20, timeout.Token);
            }
        }
        finally
        {
            await transaction.CommitAsync();
        }

        var firstGrant = await first;
        if (secondRefresh is not null)
        {
            var secondGrant = await secondRefresh;
            Assert.True((firstGrant is null) != (secondGrant is null));
        }
        if (secondLogout is not null) Assert.True(await secondLogout);
        await using var verification = factory.Services.CreateAsyncScope();
        var service = verification.ServiceProvider.GetRequiredService<ITokenSessionService>();
        Assert.False(await service.ValidateAsync(grant.SessionId, grant.UserId, grant.Role));
        if (firstGrant is not null) Assert.Null(await service.RefreshAsync(firstGrant.RefreshToken));
    }
}
