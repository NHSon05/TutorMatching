using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using TutorMatching.Application.Abstractions;
using TutorMatching.Infrastructure.Auditing;
using TutorMatching.Infrastructure.Email;
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

        services.AddOptions<SmtpOptions>()
            .Bind(configuration.GetSection("Smtp"))
            .Validate(options => !string.IsNullOrWhiteSpace(options.Host), "Smtp: Host is required")
            .Validate(options => options.Port is > 0 and <= 65535, "Smtp: Port is invalid")
            .Validate(options => options.TimeoutSeconds is >= 1 and <= 120, "Smtp: TimeoutSeconds must be between 1 and 120")
            .Validate(options => System.Net.Mail.MailAddress.TryCreate(options.FromAddress, out _), "Smtp: FromAddress is invalid")
            .ValidateOnStart();

        services.AddTransient<IEmailSender, SmtpEmailSender>();

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
