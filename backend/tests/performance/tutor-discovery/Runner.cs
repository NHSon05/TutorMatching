using System.Collections.Concurrent;
using System.Data.Common;
using System.Diagnostics;
using System.Net.Http.Json;
using System.Runtime.InteropServices;
using System.Text.Json;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Npgsql;
using Testcontainers.PostgreSql;
using TutorMatching.Domain.Tutors;
using TutorMatching.Domain.Users;
using TutorMatching.Infrastructure.Persistence;

internal static class Runner
{
    private static readonly Guid MathId = Guid.Parse("02000000-0000-0000-0000-000000000001");
    public static async Task<int> Main(string[] args)
    {
        var hireCreation = args.Contains("--hire-browser");
        var hireResponse = args.Contains("--hire-response-browser");
        var browser = args.Contains("--browser") || hireCreation || hireResponse;
        var output = Path.GetFullPath(args.FirstOrDefault(a => !a.StartsWith("--")) ?? Path.Combine(Path.GetTempPath(), "tutor-discovery-" + Guid.NewGuid().ToString("N")));
        Directory.CreateDirectory(output);
        using var deadline = new CancellationTokenSource(TimeSpan.FromMinutes(10));
        var token = deadline.Token;
        await using var database = new PostgreSqlBuilder("postgres:17.6-alpine")
            .WithDatabase("discovery_performance").WithUsername("benchmark")
            .WithPassword(Guid.NewGuid().ToString("N")).Build();
        await database.StartAsync(token);
        if (browser)
        {
            var scenario = hireResponse ? "hire-response" : (hireCreation ? "hire-creation" : "discovery");
            return await BrowserFixture.Run(database.GetConnectionString(), output, token, scenario);
        }
        var capture = new QueryCapture();
        await using var factory = new PerformanceFactory(database.GetConnectionString(), capture);
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        client.Timeout = TimeSpan.FromSeconds(30);
        using (var health = await client.GetAsync("/openapi/v1.json", token)) health.EnsureSuccessStatusCode();
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            await DatabaseMigrationRunner.MigrateAsync(db);
            await Seed(db, token);
            await db.Database.ExecuteSqlRawAsync("ALTER DATABASE discovery_performance SET work_mem = '64MB';", token);
            await db.Database.ExecuteSqlRawAsync("VACUUM ANALYZE", token);
            Npgsql.NpgsqlConnection.ClearAllPools();
        }
        var windows = Uri.EscapeDataString("[{\"dayOfWeek\":1,\"startTime\":\"18:00\",\"endTime\":\"21:00\"}]");
        var queries = new Dictionary<string, string>
        {
            ["simple"] = "/tutors?page=1&pageSize=20",
            ["combined"] = $"/tutors?page=1&pageSize=20&subjectId={MathId}&levelCode=HIGH_SCHOOL&mode=ONLINE&minPrice=100000&maxPrice=200000&sort=priceAsc",
            ["capacity"] = $"/tutors?page=1&pageSize=20&sessionsPerWeek=2&durationMinutes=60&weeklyWindows={windows}"
        };
        var results = new List<object>();
        var passed = true;
        foreach (var (name, url) in queries)
        {
            capture.Commands.Clear();
            capture.Enabled = true;
            using (var warm = await client.GetAsync(url, token)) warm.EnsureSuccessStatusCode();
            capture.Enabled = false;
            await capture.Explain(database.GetConnectionString(), Path.Combine(output, name + "-plans.txt"), token);
            for (var i = 0; i < 20; i++)
            {
                using var warm = await client.GetAsync(url, token);
                warm.EnsureSuccessStatusCode();
            }
            var times = new ConcurrentBag<double>();
            var errors = new ConcurrentBag<string>();
            using var start = new SemaphoreSlim(0);
            var timer = Stopwatch.StartNew();
            var workers = Enumerable.Range(0, 100).Select(async _ =>
            {
                await start.WaitAsync(token);
                for (var i = 0; i < 10; i++)
                {
                    var request = Stopwatch.StartNew();
                    try
                    {
                        using var response = await client.GetAsync(url, token);
                        if (!response.IsSuccessStatusCode) errors.Add(((int)response.StatusCode).ToString());
                        else
                        {
                            var body = await response.Content.ReadFromJsonAsync<JsonElement>(token);
                            if (body.GetProperty("totalCount").GetInt32() <= 0 || body.GetProperty("items").GetArrayLength() != 20)
                                errors.Add("invalid-page");
                        }
                    }
                    catch (Exception exception) { errors.Add(exception.GetType().Name); }
                    finally { times.Add(request.Elapsed.TotalMilliseconds); }
                }
            }).ToArray();
            start.Release(100);
            await Task.WhenAll(workers);
            timer.Stop();
            var sorted = times.Order().ToArray();
            var p95 = sorted[(int)Math.Ceiling(sorted.Length * .95) - 1];
            passed &= p95 <= 3000 && errors.IsEmpty;
            results.Add(new
            {
                name,
                users = 100,
                requests = times.Count,
                seconds = timer.Elapsed.TotalSeconds,
                requestsPerSecond = times.Count / timer.Elapsed.TotalSeconds,
                p95Milliseconds = p95,
                maxMilliseconds = sorted[^1],
                errorCount = errors.Count,
                errors = errors.GroupBy(x => x).ToDictionary(x => x.Key, x => x.Count())
            });
            Console.WriteLine($"{name}: {times.Count} requests, p95 {p95:F1}ms, errors {errors.Count}");
        }
        var report = new
        {
            seedVersion = "discovery-v1",
            profiles = 10000,
            approvedActive = 8000,
            transport = "loopback HTTP Kestrel",
            admissionControl = "per-IP limiter disabled only in isolated harness",
            postgres = "17.6-alpine Testcontainers",
            runtime = RuntimeInformation.FrameworkDescription,
            os = RuntimeInformation.OSDescription,
            architecture = RuntimeInformation.ProcessArchitecture.ToString(),
            logicalProcessors = Environment.ProcessorCount,
            warmupPerScenario = 21,
            requestsPerUserPerScenario = 10,
            measuredAtUtc = DateTimeOffset.UtcNow,
            passed,
            results
        };
        await File.WriteAllTextAsync(Path.Combine(output, "results.json"), JsonSerializer.Serialize(report, new JsonSerializerOptions { WriteIndented = true }), token);
        Console.WriteLine($"Report: {output}; pass: {passed}");
        return passed ? 0 : 1;
    }

    private static async Task Seed(ApplicationDbContext db, CancellationToken token)
    {
        var now = DateTimeOffset.UtcNow;
        for (var batch = 0; batch < 20; batch++)
        {
            for (var n = 0; n < 500; n++)
            {
                var i = batch * 500 + n;
                var userId = Guid.NewGuid();
                var profileId = Guid.NewGuid();
                db.Users.Add(new ApplicationUser
                {
                    Id = userId,
                    UserName = $"synthetic-{i}@example.test",
                    NormalizedUserName = $"SYNTHETIC-{i}@EXAMPLE.TEST",
                    Email = $"synthetic-{i}@example.test",
                    NormalizedEmail = $"SYNTHETIC-{i}@EXAMPLE.TEST",
                    FullName = $"Synthetic Tutor {i:D5}",
                    Role = AccountRole.TUTOR,
                    Status = i % 10 == 0 ? AccountStatus.LOCKED : AccountStatus.ACTIVE,
                    SecurityStamp = Guid.NewGuid().ToString(),
                    CreatedAt = now,
                    UpdatedAt = now
                });
                db.TutorProfiles.Add(new TutorProfile
                {
                    Id = profileId,
                    UserId = userId,
                    Status = i % 10 == 1 ? TutorProfileStatus.DRAFT : TutorProfileStatus.APPROVED,
                    Bio = "Synthetic performance fixture",
                    Degree = i % 2 == 0 ? "Bachelor" : "Master",
                    SessionRateVnd = 100000 + i % 5 * 50000,
                    TeachingModes = i % 3 == 0 ? ["ONLINE", "HYBRID"] : ["ONLINE"],
                    CreatedAt = now.AddSeconds(-i),
                    UpdatedAt = now,
                    ApprovedAt = now.AddSeconds(-i)
                });
                db.TutorSubjects.Add(new TutorSubject { TutorProfileId = profileId, SubjectId = MathId });
                db.Set<TutorSubjectLevel>().Add(new TutorSubjectLevel { TutorProfileId = profileId, SubjectId = MathId, LevelCode = i % 2 == 0 ? "HIGH_SCHOOL" : "PRIMARY" });
                for (var day = 1; day <= 5; day++)
                    db.AvailabilitySlots.Add(new AvailabilitySlot
                    {
                        Id = Guid.NewGuid(),
                        TutorProfileId = profileId,
                        DayOfWeek = day,
                        StartTime = new TimeOnly(18, 0),
                        EndTime = new TimeOnly(19 + i % 3, 0)
                    });
            }
            await db.SaveChangesAsync(token);
            db.ChangeTracker.Clear();
        }
        Console.WriteLine("Seeded 10,000 synthetic profiles and 50,000 weekly slots.");
    }
}

internal sealed class PerformanceFactory(string connection, QueryCapture capture) : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseContentRoot(Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../../../src/TutorMatching.Api")));
        builder.UseEnvironment("Testing");
        builder.UseSetting("ConnectionStrings:DefaultConnection", connection);
        builder.UseSetting("Jwt:SigningKey", Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32)));
        builder.UseSetting("Jwt:Issuer", "benchmark");
        builder.UseSetting("Jwt:Audience", "benchmark");
        builder.UseSetting("Frontend:Origin", "http://localhost:3108");
        builder.UseSetting("SeedAdmin:Enabled", "false");
        builder.ConfigureLogging(logging => logging.ClearProviders());
        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<DbContextOptions<ApplicationDbContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<ApplicationDbContext>>();
            services.AddDbContext<ApplicationDbContext>(options => options.UseTutorMatchingDatabase(connection).AddInterceptors(capture));
            // All synthetic users share loopback. Measure query/API capacity rather than
            // the intentional 120 requests/minute per-IP admission limit (tested separately).
            services.PostConfigure<Microsoft.AspNetCore.RateLimiting.RateLimiterOptions>(options =>
                options.GlobalLimiter = System.Threading.RateLimiting.PartitionedRateLimiter.Create<Microsoft.AspNetCore.Http.HttpContext, string>(
                    _ => System.Threading.RateLimiting.RateLimitPartition.GetNoLimiter("isolated-fixture")));
            services.AddControllers().AddApplicationPart(typeof(TutorMatching.Api.Controllers.TutorsController).Assembly);
            services.AddDataProtection().UseEphemeralDataProtectionProvider();
        });
    }
}

internal sealed class QueryCapture : DbCommandInterceptor
{
    public bool Enabled { get; set; }
    public List<(string Sql, NpgsqlParameter[] Parameters)> Commands { get; } = [];
    public override ValueTask<InterceptionResult<DbDataReader>> ReaderExecutingAsync(DbCommand command,
        CommandEventData eventData, InterceptionResult<DbDataReader> result, CancellationToken cancellationToken = default)
    {
        if (Enabled)
            Commands.Add((command.CommandText, command.Parameters.Cast<NpgsqlParameter>().Select(p => p.Clone()).ToArray()));
        return base.ReaderExecutingAsync(command, eventData, result, cancellationToken);
    }
    public async Task Explain(string connectionString, string path, CancellationToken token)
    {
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(token);
        using var writer = new StreamWriter(path);
        foreach (var (sql, parameters) in Commands)
        {
            await writer.WriteLineAsync(sql);
            await using var command = new NpgsqlCommand("EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) " + sql, connection);
            command.Parameters.AddRange(parameters);
            await using var reader = await command.ExecuteReaderAsync(token);
            while (await reader.ReadAsync(token)) await writer.WriteLineAsync(reader.GetString(0));
            await writer.WriteLineAsync();
        }
    }
}
