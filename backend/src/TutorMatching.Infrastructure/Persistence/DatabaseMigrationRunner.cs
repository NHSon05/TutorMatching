using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace TutorMatching.Infrastructure.Persistence;

public static class DatabaseMigrationRunner
{
    public static async Task MigrateAsync(ApplicationDbContext db, string? targetMigration = null,
        CancellationToken cancellationToken = default)
    {
        // Normalize history BEFORE EF discovers pending migrations. This operation
        // is explicit deployment work, never a side effect of model construction.
        if (await db.Database.CanConnectAsync(cancellationToken))
        {
            await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
            await db.Database.ExecuteSqlRawAsync(
                "SELECT pg_advisory_xact_lock(748126940021)", cancellationToken);
            await db.Database.ExecuteSqlRawAsync("""
                DO $history$
                DECLARE primary_key text;
                BEGIN
                    IF to_regclass('"__EFMigrationsHistory"') IS NOT NULL THEN
                        IF to_regclass('ef_migrations_history') IS NOT NULL THEN
                            RAISE EXCEPTION 'Both legacy and snake_case migration histories exist; reconcile them before upgrading.';
                        END IF;
                        ALTER TABLE "__EFMigrationsHistory" RENAME TO ef_migrations_history;
                        ALTER TABLE ef_migrations_history RENAME COLUMN "MigrationId" TO migration_id;
                        ALTER TABLE ef_migrations_history RENAME COLUMN "ProductVersion" TO product_version;
                        SELECT conname INTO primary_key FROM pg_constraint
                            WHERE conrelid = 'ef_migrations_history'::regclass AND contype = 'p';
                        IF primary_key IS NOT NULL AND primary_key <> 'pk_ef_migrations_history' THEN
                            EXECUTE format('ALTER TABLE ef_migrations_history RENAME CONSTRAINT %I TO pk_ef_migrations_history', primary_key);
                        END IF;
                    END IF;
                END $history$;
                """, cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        await db.GetService<IMigrator>().MigrateAsync(targetMigration, cancellationToken);
    }
}
