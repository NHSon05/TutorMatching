using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using TutorMatching.Api.IntegrationTests.Authentication;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Api.IntegrationTests.Fixtures;

[Collection("PostgreSQL API")]
public sealed class SnakeCaseSchemaTests(PostgreSqlFixture fixture)
{
    [Theory]
    [InlineData("AspNetUserClaims", "asp_net_user_claims")]
    [InlineData("NormalizedUserName", "normalized_user_name")]
    [InlineData("IPAddress", "ip_address")]
    [InlineData("PK_UserAccounts", "pk_user_accounts")]
    [InlineData("already_snake_case", "already_snake_case")]
    public void NamingHandlesAcronymsAndBoundaries(string name, string expected) =>
        Assert.Equal(expected, SnakeCaseNaming.Convert(name));

    [Fact]
    public async Task FreshDatabaseHasOnlySnakeCaseIdentifiersAndMatchingModelConstraints()
    {
        await using var factory = await fixture.CreateFactoryAsync();
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        await AssertSnakeCaseCatalog(db);
        Assert.False(db.Database.HasPendingModelChanges());

        var tables = db.Model.GetEntityTypes().Select(e => e.GetTableName()).ToArray();
        Assert.Contains("user_accounts", tables);
        Assert.Contains("asp_net_user_roles", tables);
        var constraintNames = await Strings(db, "SELECT conname FROM pg_constraint WHERE connamespace = current_schema()::regnamespace");
        foreach (var entity in db.GetService<IDesignTimeModel>().Model.GetEntityTypes())
        {
            foreach (var key in entity.GetKeys()) Assert.Contains(key.GetName(), constraintNames);
            foreach (var key in entity.GetForeignKeys()) Assert.Contains(key.GetConstraintName(), constraintNames);
            foreach (var check in entity.GetCheckConstraints()) Assert.Contains(check.Name, constraintNames);
        }

        using var client = factory.CreateApiClient();
        await SessionEndpointTests.Register(client);
        var checkFailure = await Assert.ThrowsAsync<PostgresException>(() =>
            db.Database.ExecuteSqlRawAsync("UPDATE user_accounts SET full_name = ' x '"));
        Assert.Equal(PostgresErrorCodes.CheckViolation, checkFailure.SqlState);
        var uniqueFailure = await Assert.ThrowsAsync<PostgresException>(() =>
            db.Database.ExecuteSqlRawAsync("INSERT INTO asp_net_roles (id, name, normalized_name) VALUES (gen_random_uuid(), 'Other', 'LEARNER')"));
        Assert.Equal(PostgresErrorCodes.UniqueViolation, uniqueFailure.SqlState);
    }

    [Fact]
    public async Task PopulatedPascalCaseDatabaseAndHistoryAreRenamedWithoutRebuildingObjects()
    {
        await using var factory = await fixture.CreateFactoryAsync("20261010031244_AddTokenSessions");
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var userId = Guid.NewGuid();
        var sessionId = Guid.NewGuid();
        await db.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO "UserAccounts" ("Id", "FullName", "Status", "Email", "NormalizedEmail",
                "PasswordHash", "SecurityStamp", "EmailConfirmed", "PhoneNumberConfirmed", "TwoFactorEnabled", "LockoutEnabled", "AccessFailedCount")
            VALUES ({userId}, 'Preserved User', 'ACTIVE', 'preserved@example.test', 'PRESERVED@EXAMPLE.TEST',
                'synthetic-hash', 'synthetic-stamp', false, false, false, true, 0);
            INSERT INTO "AspNetUserRoles" VALUES ({userId}, '22222222-2222-2222-2222-222222222222');
            INSERT INTO "AspNetUserClaims" ("UserId", "ClaimType", "ClaimValue") VALUES ({userId}, 'sample', 'preserved');
            INSERT INTO "AspNetRoleClaims" ("RoleId", "ClaimType", "ClaimValue") VALUES ('22222222-2222-2222-2222-222222222222', 'sample', 'preserved');
            INSERT INTO "AspNetUserLogins" ("LoginProvider", "ProviderKey", "ProviderDisplayName", "UserId") VALUES ('sample', 'key', 'Sample', {userId});
            INSERT INTO "AspNetUserTokens" ("UserId", "LoginProvider", "Name", "Value") VALUES ({userId}, 'sample', 'sample', 'synthetic-value');
            INSERT INTO "TokenSessions" VALUES ({sessionId}, {userId}, 'synthetic-stamp', 'LEARNER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + interval '8 hours', true);
            INSERT INTO "SessionRefreshTokens" VALUES ('synthetic-token-hash', {sessionId}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + interval '30 minutes', true);
            """);
        // Simulate the migration-history naming used before this refactor.
        await db.Database.ExecuteSqlRawAsync("""
            ALTER TABLE ef_migrations_history RENAME TO "__EFMigrationsHistory";
            ALTER TABLE "__EFMigrationsHistory" RENAME COLUMN migration_id TO "MigrationId";
            ALTER TABLE "__EFMigrationsHistory" RENAME COLUMN product_version TO "ProductVersion";
            ALTER TABLE "__EFMigrationsHistory" RENAME CONSTRAINT pk_ef_migrations_history TO "PK___EFMigrationsHistory";
            """);
        var objectsBefore = await ObjectIds(db);
        await DatabaseMigrationRunner.MigrateAsync(db);
        var objectsAfter = await ObjectIds(db);
        var objectsAfterSet = objectsAfter.ToHashSet();
        Assert.All(objectsBefore, id => Assert.Contains(id, objectsAfterSet)); // Tables, constraints, indexes retain OIDs.
        await AssertSnakeCaseCatalog(db);
        var user = await db.Users.SingleAsync();
        Assert.Equal(userId, user.Id);
        Assert.Equal("synthetic-hash", user.PasswordHash);
        Assert.Equal("synthetic-stamp", user.SecurityStamp);
        Assert.Single(await db.UserRoles.ToListAsync());
        Assert.Single(await db.UserLogins.ToListAsync());
        Assert.Single(await db.UserTokens.ToListAsync());
        Assert.Single(await db.UserClaims.ToListAsync());
        Assert.Single(await db.RoleClaims.ToListAsync());
        Assert.Equal(DateTimeOffset.MinValue, (await db.TokenSessions.SingleAsync()).RevokedAt);
        Assert.Equal(DateTimeOffset.MinValue, (await db.SessionRefreshTokens.SingleAsync()).ConsumedAt);
        var history = (await db.Database.GetAppliedMigrationsAsync()).ToArray();
        Assert.Equal(5, history.Length);
        await DatabaseMigrationRunner.MigrateAsync(db);
        Assert.Equal(history, await db.Database.GetAppliedMigrationsAsync());
        // Renamed Identity sequences retain their ownership/default and next value.
        await db.Database.ExecuteSqlInterpolatedAsync($"INSERT INTO asp_net_user_claims (user_id, claim_type) VALUES ({userId}, 'next')");
        Assert.Equal(2, await db.UserClaims.CountAsync());
    }

    [Fact]
    public async Task ConflictingHistoriesAreRejectedWithoutDeletingEither()
    {
        await using var factory = await fixture.CreateFactoryAsync();
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        await db.Database.ExecuteSqlRawAsync("CREATE TABLE \"__EFMigrationsHistory\" (\"MigrationId\" text, \"ProductVersion\" text)");
        await Assert.ThrowsAsync<PostgresException>(() => DatabaseMigrationRunner.MigrateAsync(db));
        var tables = await Strings(db, "SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema()");
        Assert.Contains("__EFMigrationsHistory", tables);
        Assert.Contains("ef_migrations_history", tables);
        Assert.Equal(5, (await db.Database.GetAppliedMigrationsAsync()).Count());
    }

    internal static async Task AssertSnakeCaseCatalog(ApplicationDbContext db)
    {
        var names = await Strings(db, """
            SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema()
            UNION ALL SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema()
            UNION ALL SELECT conname FROM pg_constraint WHERE connamespace = current_schema()::regnamespace
            UNION ALL SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE n.nspname = current_schema() AND c.relkind IN ('i', 'S')
            """);
        Assert.NotEmpty(names);
        Assert.All(names, name => Assert.Matches("^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$", name));
        Assert.Contains("ef_migrations_history", names);
        Assert.Contains("migration_id", names);
    }

    private static Task<string[]> ObjectIds(ApplicationDbContext db) => Strings(db, """
        SELECT 'object:' || c.oid::text FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = current_schema() AND c.relkind IN ('r', 'i', 'S')
        UNION ALL SELECT 'constraint:' || oid::text FROM pg_constraint WHERE connamespace = current_schema()::regnamespace
        ORDER BY 1
        """);

    private static async Task<string[]> Strings(ApplicationDbContext db, string sql)
    {
        await db.Database.OpenConnectionAsync();
        await using var command = db.Database.GetDbConnection().CreateCommand();
        command.CommandText = sql;
        await using var reader = await command.ExecuteReaderAsync();
        var values = new List<string>();
        while (await reader.ReadAsync()) values.Add(reader.GetString(0));
        return values.ToArray();
    }
}
