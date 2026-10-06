using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using TutorMatching.Infrastructure.Configurations;

namespace TutorMatching.Infrastructure.Persistence;

public sealed class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    public ApplicationDbContext CreateDbContext(string[] args)
    {
        DotEnvLoader.Load();

        var connectionString = Environment.GetEnvironmentVariable(
            "ConnectionStrings__DefaultConnection");

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "ConnectionStrings__DefaultConnection must be set before running EF Core tools.");
        }

        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        return new ApplicationDbContext(options);
    }
}
