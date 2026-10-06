using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using TutorMatching.Application.Abstractions;
using TutorMatching.Infrastructure.Auditing;
using TutorMatching.Infrastructure.Persistence;
using TutorMatching.Infrastructure.Time;

namespace TutorMatching.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "ConnectionStrings:DefaultConnection is required.");
        }

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.AddDataProtection();

        services.AddIdentityCore<ApplicationUser>(options =>
            {
                options.User.RequireUniqueEmail = true;
                options.Password.RequiredLength = 8;
                options.Password.RequireDigit = false;
                options.Password.RequireLowercase = false;
                options.Password.RequireUppercase = false;
                options.Password.RequireNonAlphanumeric = false;
                options.Lockout.AllowedForNewUsers = true;
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
            })
            .AddRoles<IdentityRole<Guid>>()
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddSignInManager()
            .AddDefaultTokenProviders();

        services.AddScoped<DevelopmentDataSeeder>();
        services.TryAddSingleton<TimeProvider>(TimeProvider.System);
        services.TryAddSingleton<IClock, SystemClock>();
        services.AddScoped<IAuditWriter, AuditWriter>();

        return services;
    }

    public static async Task SeedDevelopmentDataAsync(
        this IServiceProvider services,
        bool isDevelopment)
    {
        if (!isDevelopment)
        {
            return;
        }

        await using var scope = services.CreateAsyncScope();
        await scope.ServiceProvider
            .GetRequiredService<DevelopmentDataSeeder>()
            .SeedAsync();
    }
}
