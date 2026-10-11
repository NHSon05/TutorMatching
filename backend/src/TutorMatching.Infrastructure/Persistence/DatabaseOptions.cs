using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Migrations;

namespace TutorMatching.Infrastructure.Persistence;

public static class DatabaseOptions
{
    public static DbContextOptionsBuilder UseTutorMatchingDatabase(
        this DbContextOptionsBuilder options, string connectionString) => options
        .UseNpgsql(connectionString, postgres => postgres.MigrationsHistoryTable("ef_migrations_history"))
        .ReplaceService<IHistoryRepository, SnakeCaseHistoryRepository>();
}
