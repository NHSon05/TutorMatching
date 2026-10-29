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
    public static Task<int> Run(string connectionString, string output, CancellationToken token, bool hiring)
        => Run(connectionString, output, token, hiring ? "hire-creation" : "discovery");

    public static async Task<int> Run(string connectionString, string output, CancellationToken token, string scenario = "discovery")
    {
        var hiring = scenario is "hire-creation" or "hire-response";
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
        builder.Services.AddScoped<TutorMatching.Application.Hiring.RespondToHireRequest>();
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
        var specFile = scenario switch
        {
            "hire-response" => "hire-response.spec.ts",
            "hire-creation" => "hire-creation.spec.ts",
            _ => "tutor-discovery.spec.ts"
        };
        foreach (var arg in new[] { "--prefix", "frontend", "run", "test:e2e", "--", specFile }) start.ArgumentList.Add(arg);
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
        if (scenario == "hire-creation" && process.ExitCode == 0)
        {
            await using var scope = app.Services.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var counts = new[] { await db.HireRequests.CountAsync(token), await db.RequestSchedules.CountAsync(token),
                await db.RequestStatusHistories.CountAsync(token), await db.Conversations.CountAsync(token),
                await db.Notifications.CountAsync(token), await db.HireCreateOperations.CountAsync(token) };
            if (counts.Any(c => c != 1)) throw new InvalidOperationException("Browser replay duplicated business rows.");
            await File.WriteAllTextAsync(Path.Combine(output, "hiring-counts.json"), System.Text.Json.JsonSerializer.Serialize(counts), token);
        }
        else if (scenario == "hire-response" && process.ExitCode == 0)
        {
            await using var scope = app.Services.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var requestCount = await db.HireRequests.CountAsync(token);
            if (requestCount != 2) throw new InvalidOperationException($"Expected 2 hire requests, got {requestCount}.");

            var accepted = await db.HireRequests.SingleOrDefaultAsync(r => r.StatusCode == "ACCEPTED", token);
            var rejected = await db.HireRequests.SingleOrDefaultAsync(r => r.StatusCode == "REJECTED", token);
            if (accepted is null || rejected is null)
                throw new InvalidOperationException("Expected 1 ACCEPTED and 1 REJECTED hire request.");

            if (accepted.FinalAgreement is null || accepted.AgreedPriceVnd is null || accepted.AcceptedAt is null)
                throw new InvalidOperationException("Accepted request must have frozen final agreement, price, and accepted timestamp.");

            if (rejected.FinalAgreement is not null)
                throw new InvalidOperationException("Rejected request must not have final agreement.");

            var historyCount = await db.RequestStatusHistories.CountAsync(token);
            if (historyCount != 4)
                throw new InvalidOperationException($"Expected 4 status histories (2 create + 2 responses), got {historyCount}.");

            var rejectedHistory = await db.RequestStatusHistories.SingleOrDefaultAsync(h => h.ToStatusCode == "REJECTED", token);
            if (rejectedHistory is null || string.IsNullOrWhiteSpace(rejectedHistory.Reason))
                throw new InvalidOperationException("Rejected history must contain the rejection reason.");

            var notifications = await db.Notifications.ToListAsync(token);
            if (notifications.Count != 4)
                throw new InvalidOperationException($"Expected 4 notifications, got {notifications.Count}.");

            var learnerId = await db.Users.Where(u => u.Email == "learner@example.test").Select(u => u.Id).SingleAsync(token);
            if (notifications.Count(n => n.UserId == learnerId &&
                (n.TypeCode == "HIRE_REQUEST_ACCEPTED" || n.TypeCode == "HIRE_REQUEST_REJECTED")) != 2)
                throw new InvalidOperationException("Each response must notify the learner exactly once.");
            var conversations = await db.Conversations.CountAsync(token);
            var operations = await db.HireCreateOperations.CountAsync(token);
            if (conversations != 2 || operations != 2)
                throw new InvalidOperationException("Responses must not create extra conversations or creation operations.");
            if (accepted.FinalAgreement.Terms.PriceVnd != accepted.InitialTerms.PriceVnd ||
                accepted.FinalAgreement.AcceptedBy != await db.Users.Where(u => u.Email == "tutor@example.test").Select(u => u.Id).SingleAsync(token))
                throw new InvalidOperationException("Agreement must preserve the initial price and responding tutor.");

            var responseCounts = new
            {
                Requests = requestCount,
                AcceptedId = accepted.Id,
                RejectedId = rejected.Id,
                Histories = historyCount,
                Conversations = conversations,
                Operations = operations,
                Notifications = notifications.Count,
                RejectionReason = rejectedHistory.Reason,
                FinalAgreementPrice = accepted.FinalAgreement.Terms.PriceVnd
            };
            await File.WriteAllTextAsync(Path.Combine(output, "hire-response-counts.json"), System.Text.Json.JsonSerializer.Serialize(responseCounts), token);
        }
        await app.StopAsync(token);
        return process.ExitCode;
    }
}
