using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;
using TutorMatching.Application.Abstractions;
using TutorMatching.Infrastructure.Persistence;
using TutorMatching.Infrastructure.Email;

namespace TutorMatching.Api.IntegrationTests.Fixtures;

public sealed class ApiWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string connectionString;
    private readonly string? redisConnectionString;
    public CapturedEmailSender Emails { get; } = new();
    internal TutorMatching.Api.IntegrationTests.Security.TestClock Clock { get; } = new();
    private readonly string signingKey = Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32));

    // Only the fixture creates factories, always with a new database inside its own container.
    internal ApiWebApplicationFactory(string connectionString, string? redisConnectionString = null)
    {
        this.connectionString = connectionString;
        this.redisConnectionString = redisConnectionString;
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("ConnectionStrings:DefaultConnection", connectionString);
        if (!string.IsNullOrWhiteSpace(redisConnectionString))
        {
            builder.UseSetting("ConnectionStrings:Redis", redisConnectionString);
        }
        builder.UseSetting("Frontend:Origin", "https://frontend.example");
        builder.UseSetting("Jwt:Issuer", "test-api");
        builder.UseSetting("Jwt:Audience", "test-browser");
        builder.UseSetting("Jwt:SigningKey", signingKey);
        builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] = connectionString,
            ["ConnectionStrings:Redis"] = redisConnectionString ?? "localhost:6379,abortConnect=false",
            ["Frontend:Origin"] = "https://frontend.example",
            ["Cookie:Name"] = "tutormatch_session",
            ["Jwt:Issuer"] = "test-api",
            ["Jwt:Audience"] = "test-browser",
            ["Jwt:SigningKey"] = signingKey,
            ["SeedAdmin:Enabled"] = "false",
            ["Smtp:Host"] = "unused.test",
            ["Smtp:Port"] = "1025",
            ["Smtp:FromAddress"] = "no-reply@example.test"
        }));
        builder.ConfigureLogging(logging => logging.ClearProviders());
        builder.ConfigureTestServices(services =>
        {
            // Also replace EF registrations explicitly: no fallback to developer .env is possible.
            services.RemoveAll<DbContextOptions<ApplicationDbContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<ApplicationDbContext>>();
            services.AddDbContext<ApplicationDbContext>(options => options.UseTutorMatchingDatabase(connectionString));
            if (!string.IsNullOrWhiteSpace(redisConnectionString))
            {
                services.RemoveAll<IConnectionMultiplexer>();
                services.AddSingleton<IConnectionMultiplexer>(_ =>
                {
                    var redisOptions = ConfigurationOptions.Parse(redisConnectionString);
                    redisOptions.AbortOnConnectFail = false;
                    return ConnectionMultiplexer.Connect(redisOptions);
                });
            }
            services.RemoveAll<IEmailSender>();
            services.AddSingleton<IEmailSender>(Emails);
            services.AddSingleton<TimeProvider>(Clock);
            services.AddDataProtection().UseEphemeralDataProtectionProvider();
        });
    }

    public HttpClient CreateApiClient() => CreateClient(new WebApplicationFactoryClientOptions
    {
        BaseAddress = new Uri("https://localhost"),
        AllowAutoRedirect = false
    });
}
