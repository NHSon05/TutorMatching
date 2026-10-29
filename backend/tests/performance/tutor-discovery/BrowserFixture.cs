using System.Diagnostics;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using TutorMatching.Api.Errors;
using TutorMatching.Api.Routing;
using Microsoft.AspNetCore.Mvc;
using TutorMatching.Api.OpenApi;
using TutorMatching.Api.Security;
using TutorMatching.Application.Authentication.Register;
using TutorMatching.Domain.Users;
using TutorMatching.Infrastructure;
using TutorMatching.Infrastructure.Persistence;

internal static class BrowserFixture
{
    public static async Task<int> Run(string connectionString, string output, CancellationToken token, bool hiring = false)
    {
        var password = "Fixture-" + Guid.NewGuid().ToString("N");
        var builder = WebApplication.CreateBuilder();
        builder.Environment.EnvironmentName = "Development";
        builder.Configuration["ConnectionStrings:DefaultConnection"] = connectionString;
        builder.Configuration["Cookie:SecurePolicy"] = "SameAsRequest";
        builder.Configuration["Jwt:SigningKey"] = Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32));
        builder.Configuration["Jwt:Issuer"] = "benchmark";
        builder.Configuration["Jwt:Audience"] = "benchmark";
        builder.Configuration["Frontend:Origin"] = hiring ? "http://localhost:3000" : "http://localhost:3108";
        builder.Configuration["SeedAdmin:Enabled"] = "false";
        builder.WebHost.UseKestrel(opts => opts.ListenLocalhost(5108));
        builder.Logging.AddConsole();

        builder.Services.AddControllers(options => { if (hiring) options.UseCentralRoutePrefix(new RouteAttribute(ApiRoutes.Prefix)); })
            .AddApplicationPart(typeof(TutorMatching.Api.Controllers.TutorsController).Assembly);
        builder.Services.AddApiErrors();
        builder.Services.AddScoped<RegisterAccountHandler>();
        builder.Services.AddScoped<TutorMatching.Application.Hiring.CreateHireRequest>();
        builder.Services.AddScoped<TutorMatching.Application.Users.Profile.CurrentProfileHandler>();
        builder.Services.AddScoped<TutorMatching.Application.Authentication.Sessions.SessionHandler>();
        builder.Services.AddInfrastructure(builder.Configuration);
        builder.Services.AddApiSecurity(builder.Configuration, builder.Environment);
        builder.Services.AddVersionedOpenApi();
        builder.Services.AddDataProtection().UseEphemeralDataProtectionProvider();
        builder.Services.PostConfigure<Microsoft.AspNetCore.RateLimiting.RateLimiterOptions>(options =>
            options.GlobalLimiter = System.Threading.RateLimiting.PartitionedRateLimiter.Create<Microsoft.AspNetCore.Http.HttpContext, string>(
                _ => System.Threading.RateLimiting.RateLimitPartition.GetNoLimiter("isolated-fixture")));

        var app = builder.Build();
        app.UseApiErrors();
        app.MapOpenApi().AllowAnonymous();
        app.UseStaticFiles();
        app.UseRouting();
        app.UseApiSecurity();
        app.MapCsrfEndpoint();
        app.MapControllers();

        await app.StartAsync(token);

        await using (var scope = app.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            await DatabaseMigrationRunner.MigrateAsync(db);
            var manager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            foreach (var (email, role) in new[] { ("admin@example.test", AccountRole.ADMIN), ("tutor@example.test", AccountRole.TUTOR), ("learner@example.test", AccountRole.LEARNER) })
            {
                var user = new ApplicationUser
                {
                    Id = Guid.NewGuid(),
                    Email = email,
                    UserName = email,
                    FullName = role == AccountRole.TUTOR ? "Discovery Browser Tutor" : "Browser Admin",
                    Role = role,
                    Status = AccountStatus.ACTIVE,
                    PhoneNumber = role == AccountRole.TUTOR ? "+84911111111" : null,
                    DateOfBirth = new DateOnly(1995, 1, 1)
                };
                var created = await manager.CreateAsync(user, password);
                if (!created.Succeeded) throw new InvalidOperationException("Fixture account creation failed.");
            }
        }

        if (hiring) await HiringBrowserSeed.Seed(app.Services, token);

        using var probeClient = new HttpClient { BaseAddress = new Uri("http://localhost:5108") };
        var probe = await probeClient.GetAsync(hiring ? "/api/v1/auth/csrf" : "/auth/csrf", token);
        Console.WriteLine($"[BrowserFixture Probe] CSRF: {probe.StatusCode} {await probe.Content.ReadAsStringAsync(token)}");

        var root = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../../../../"));
        var start = new ProcessStartInfo("npm") { WorkingDirectory = root, UseShellExecute = false };
        foreach (var arg in new[] { "--prefix", "frontend", "run", "test:e2e", "--", hiring ? "hire-creation.spec.ts" : "tutor-discovery.spec.ts" }) start.ArgumentList.Add(arg);
        start.Environment["PLAYWRIGHT_API_BASE_URL"] = hiring ? "http://localhost:5108/api/v1" : "http://localhost:5108";
        start.Environment["PLAYWRIGHT_BASE_URL"] = hiring ? "http://localhost:3000" : "http://localhost:3108";
        start.Environment["DISCOVERY_FIXTURE_PASSWORD"] = password;
        start.Environment["DISCOVERY_FIXTURE_OUTPUT"] = output;
        using var process = Process.Start(start)!;
        var signal = Path.Combine(output, "lock-account");
        while (!process.HasExited)
        {
            if (File.Exists(signal))
            {
                await using var scope = app.Services.CreateAsyncScope();
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var user = await db.Users.SingleAsync(x => x.Email == "tutor@example.test", token);
                user.Status = AccountStatus.LOCKED;
                await db.SaveChangesAsync(token);
                File.Move(signal, Path.Combine(output, "account-locked"));
            }
            await Task.Delay(200, token);
        }
        if (hiring && process.ExitCode == 0)
        {
            await using var scope = app.Services.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var counts = new[] { await db.HireRequests.CountAsync(token), await db.RequestSchedules.CountAsync(token),
                await db.RequestStatusHistories.CountAsync(token), await db.Conversations.CountAsync(token),
                await db.Notifications.CountAsync(token), await db.HireCreateOperations.CountAsync(token) };
            if (counts.Any(c => c != 1)) throw new InvalidOperationException("Browser replay duplicated business rows.");
            await File.WriteAllTextAsync(Path.Combine(output, "hiring-counts.json"), System.Text.Json.JsonSerializer.Serialize(counts), token);
        }
        await app.StopAsync(token);
        return process.ExitCode;
    }
}
