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
using TutorMatching.Application.Abstractions;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Api.IntegrationTests.Fixtures;

public sealed class ApiWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string connectionString;
    public CapturedEmailSender Emails { get; } = new();

    // Only the fixture creates factories, always with a new database inside its own container.
    internal ApiWebApplicationFactory(string connectionString) => this.connectionString = connectionString;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("ConnectionStrings:DefaultConnection", connectionString);
        builder.UseSetting("Frontend:Origin", "https://frontend.example");
        builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] = connectionString,
            ["Frontend:Origin"] = "https://frontend.example",
            ["Cookie:Name"] = "tutormatch_session",
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
            services.AddDbContext<ApplicationDbContext>(options => options.UseNpgsql(connectionString));
            services.RemoveAll<IEmailSender>();
            services.AddSingleton<IEmailSender>(Emails);
            services.AddDataProtection().UseEphemeralDataProtectionProvider();
        });
    }

    public HttpClient CreateApiClient() => CreateClient(new WebApplicationFactoryClientOptions
    {
        BaseAddress = new Uri("https://localhost"),
        AllowAutoRedirect = false
    });
}
