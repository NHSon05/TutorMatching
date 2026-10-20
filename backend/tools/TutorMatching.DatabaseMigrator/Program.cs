using Microsoft.EntityFrameworkCore;
using Npgsql;
using TutorMatching.Infrastructure.Persistence;

try
{
    await using var db = new ApplicationDbContextFactory().CreateDbContext([]);
    var connection = new NpgsqlConnectionStringBuilder(db.Database.GetConnectionString());
    if (connection.Host is not ("localhost" or "127.0.0.1" or "::1") && !args.Contains("--allow-remote"))
        throw new InvalidOperationException("Remote migration requires --allow-remote and an intentionally configured target.");
    Console.WriteLine($"Migrating database {connection.Database} on {connection.Host}.");
    await DatabaseMigrationRunner.MigrateAsync(db);
    Console.WriteLine("Migration complete. History and application schema are up to date.");
}
catch (Exception ex)
{
    // Do not print connection strings or stack traces containing configuration.
    Console.Error.WriteLine($"Migration failed ({ex.GetType().Name}): {ex.Message}");
    Environment.ExitCode = 1;
}
