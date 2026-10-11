using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Migrations.Internal;

namespace TutorMatching.Infrastructure.Persistence;

// EF documents replacing the provider history repository for column customization.
// Keep the provider version pinned and cover this extension with real migration tests.
#pragma warning disable EF1001
public sealed class SnakeCaseHistoryRepository(HistoryRepositoryDependencies dependencies)
    : NpgsqlHistoryRepository(dependencies)
{
    protected override void ConfigureTable(EntityTypeBuilder<HistoryRow> history)
    {
        base.ConfigureTable(history);
        history.Property(row => row.MigrationId).HasColumnName("migration_id");
        history.Property(row => row.ProductVersion).HasColumnName("product_version");
        history.HasKey(row => row.MigrationId).HasName("pk_ef_migrations_history");
    }
}
#pragma warning restore EF1001
