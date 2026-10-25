using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorMatching.Application.Abstractions;
using TutorMatching.Api.IntegrationTests.Fixtures;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Api.IntegrationTests.Authentication;

[Collection("PostgreSQL API")]
public sealed class TokenSessionMigrationTests(PostgreSqlFixture fixture)
{
    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task TimestampUpgradePreservesStateEvenWhenLegacyBooleansAndTimesDisagree(bool hasLegacyTimes)
    {
        await using var factory = await fixture.CreateFactoryAsync("20261010034332_UseSnakeCaseDatabaseNames");
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var userId = Guid.NewGuid();
        var now = factory.Clock.GetUtcNow();
        await db.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO user_accounts (id, full_name, status, security_stamp, email, normalized_email, email_confirmed,
                phone_number_confirmed, two_factor_enabled, lockout_enabled, access_failed_count)
            VALUES ({userId}, 'Migration User', 'ACTIVE', 'stamp', 'migration@example.test',
                'MIGRATION@EXAMPLE.TEST', false, false, false, true, 0);
            """);
        if (hasLegacyTimes)
            await db.Database.ExecuteSqlRawAsync("""
                ALTER TABLE token_sessions ADD COLUMN revoked_at timestamptz;
                ALTER TABLE session_refresh_tokens ADD COLUMN consumed_at timestamptz;
                """);

        var expected = new Dictionary<Guid, DateTimeOffset?>();
        for (var i = 0; i < 4; i++)
        {
            var id = Guid.NewGuid();
            var flagged = i % 2 == 1;
            var known = hasLegacyTimes && i >= 2;
            expected[id] = known ? now : flagged ? DateTimeOffset.MinValue : null;
            await db.Database.ExecuteSqlInterpolatedAsync($"""
                INSERT INTO token_sessions (id, user_id, security_stamp, role, created_at,
                    last_refreshed_at, absolute_expires_at, is_revoked)
                VALUES ({id}, {userId}, 'stamp', 'LEARNER', {now}, {now}, {now.AddHours(8)}, {flagged});
                INSERT INTO session_refresh_tokens (token_hash, session_id, created_at, expires_at, is_used)
                VALUES ({id.ToString()}, {id}, {now}, {now.AddMinutes(30)}, {flagged});
                """);
            if (known)
                await db.Database.ExecuteSqlInterpolatedAsync($"""
                    UPDATE token_sessions SET revoked_at = {now} WHERE id = {id};
                    UPDATE session_refresh_tokens SET consumed_at = {now} WHERE session_id = {id};
                    """);
        }

        await DatabaseMigrationRunner.MigrateAsync(db);
        var sessions = await db.TokenSessions.AsNoTracking().ToDictionaryAsync(s => s.Id);
        var tokens = await db.SessionRefreshTokens.AsNoTracking().ToDictionaryAsync(t => t.SessionId);
        Assert.Equal(4, sessions.Count);
        Assert.Equal(4, tokens.Count);
        foreach (var (id, timestamp) in expected)
        {
            Assert.Equal(timestamp, sessions[id].RevokedAt);
            Assert.Equal(timestamp, tokens[id].ConsumedAt);
        }
        Assert.Equal(0, await db.Database.SqlQueryRaw<int>("""
            SELECT count(*)::int AS "Value" FROM information_schema.columns
            WHERE table_schema = current_schema()
                AND ((table_name = 'token_sessions' AND column_name = 'is_revoked')
                    OR (table_name = 'session_refresh_tokens' AND column_name = 'is_used'))
            """).SingleAsync());
        await DatabaseMigrationRunner.MigrateAsync(db);
        Assert.Equal(4, await db.TokenSessions.CountAsync());
    }

    [Fact]
    public async Task AdoptsLegacyTablesWithoutLosingRevocationConsumptionOrExtendingExpiry()
    {
        await using var factory = await fixture.CreateFactoryAsync("20261003070401_InitialIdentityProfileAudit");
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var userId = Guid.NewGuid();
        var stamp = Guid.NewGuid().ToString();
        var timestamp = factory.Clock.GetUtcNow();
        var now = new DateTimeOffset(
            timestamp.Ticks - timestamp.Ticks % TimeSpan.TicksPerMicrosecond,
            timestamp.Offset);
        var activeId = Guid.NewGuid();
        var revokedId = Guid.NewGuid();
        await db.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO "UserAccounts" ("Id", "FullName", "Status", "Email", "NormalizedEmail",
                "SecurityStamp", "EmailConfirmed", "PhoneNumberConfirmed", "TwoFactorEnabled", "LockoutEnabled", "AccessFailedCount")
            VALUES ({userId}, 'Legacy User', 'ACTIVE', 'legacy@example.test', 'LEGACY@EXAMPLE.TEST',
                {stamp}, false, false, false, true, 0);
            INSERT INTO "AspNetUserRoles" ("UserId", "RoleId")
            VALUES ({userId}, '22222222-2222-2222-2222-222222222222');
            """);

        // Reproduce the timestamp-based schema observed in existing installations,
        // including its historical migration ID, absent from the repository.
        await db.Database.ExecuteSqlRawAsync("""
            CREATE TABLE "TokenSessions" (
                "Id" uuid PRIMARY KEY, "UserId" uuid NOT NULL REFERENCES "UserAccounts" ("Id"),
                "SecurityStamp" varchar(256) NOT NULL, "Role" varchar(16) NOT NULL,
                "CreatedAt" timestamptz NOT NULL, "LastActivityAt" timestamptz NOT NULL,
                "AbsoluteExpiresAt" timestamptz NOT NULL, "RevokedAt" timestamptz
            );
            CREATE TABLE "SessionRefreshTokens" (
                "TokenHash" varchar(64) PRIMARY KEY,
                "SessionId" uuid NOT NULL REFERENCES "TokenSessions" ("Id"),
                "CreatedAt" timestamptz NOT NULL, "ConsumedAt" timestamptz
            );
            CREATE INDEX "IX_TokenSessions_UserId" ON "TokenSessions" ("UserId");
            CREATE INDEX "IX_SessionRefreshTokens_SessionId" ON "SessionRefreshTokens" ("SessionId");
            INSERT INTO ef_migrations_history VALUES ('20261009000000_AddTokenSessions', '10.0.12');
            """);
        await db.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO "TokenSessions" VALUES
                ({activeId}, {userId}, {stamp}, 'LEARNER', {now.AddHours(-2)}, {now.AddMinutes(-5)}, {now.AddMinutes(10)}, NULL),
                ({revokedId}, {userId}, {stamp}, 'LEARNER', {now.AddHours(-2)}, {now.AddMinutes(-5)}, {now.AddMinutes(10)}, {now.AddMinutes(-1)});
            INSERT INTO "SessionRefreshTokens" VALUES
                ('consumed', {activeId}, {now.AddMinutes(-10)}, {now.AddMinutes(-5)}),
                ('expired', {activeId}, {now.AddHours(-1)}, NULL),
                ('active', {activeId}, {now.AddMinutes(-5)}, NULL);
            """);

        await DatabaseMigrationRunner.MigrateAsync(db);
        await SnakeCaseSchemaTests.AssertSnakeCaseCatalog(db);
        var sessions = await db.TokenSessions.AsNoTracking().ToDictionaryAsync(s => s.Id);
        Assert.Equal(2, sessions.Count);
        Assert.Equal(now.AddMinutes(-1), sessions[revokedId].RevokedAt);
        Assert.Null(sessions[activeId].RevokedAt);
        Assert.Equal(now.AddMinutes(-5), sessions[activeId].LastRefreshedAt);
        var tokens = await db.SessionRefreshTokens.AsNoTracking().ToDictionaryAsync(t => t.TokenHash);
        Assert.Equal(3, tokens.Count);
        Assert.Equal(now.AddMinutes(-5), tokens["consumed"].ConsumedAt);
        Assert.Null(tokens["active"].ConsumedAt);
        Assert.Equal(now.AddMinutes(-30), tokens["expired"].ExpiresAt);
        Assert.Equal(now.AddMinutes(10), tokens["active"].ExpiresAt);

        var service = scope.ServiceProvider.GetRequiredService<ITokenSessionService>();
        Assert.False(await service.ValidateAsync(revokedId, userId, "LEARNER"));
        // New inserts must still work with the retained nullable legacy audit columns.
        var grant = await service.CreateAsync(userId);
        Assert.NotNull(grant);
        Assert.NotNull(await service.RefreshAsync(grant.RefreshToken));
        await DatabaseMigrationRunner.MigrateAsync(db); // Applied migration is not executed again.
        Assert.Equal(3, await db.TokenSessions.CountAsync());
    }
}
