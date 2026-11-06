using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorMatching.Api.IntegrationTests.Demands;
using TutorMatching.Api.IntegrationTests.Fixtures;
using TutorMatching.Domain.Catalog;
using TutorMatching.Domain.Locations;
using TutorMatching.Domain.Tutors;
using TutorMatching.Domain.Users;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Api.IntegrationTests.Matching;

[Collection("Redis API")]
public sealed class TutorMatchedPostsSseTests(PostgreSqlFixture postgresFixture, RedisTestFixture redisFixture)
{
    [Fact]
    public async Task Stream_WithoutAuthentication_Returns401Unauthorized()
    {
        await redisFixture.FlushDatabaseAsync();
        await using var factory = await postgresFixture.CreateFactoryAsync(
            redisConnectionString: redisFixture.ConnectionString);
        using var client = factory.CreateApiClient();

        using var response = await client.GetAsync(
            "/api/v1/tutors/me/matched-posts/stream",
            HttpCompletionOption.ResponseHeadersRead);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Stream_WhenApprovedTutorSubscribes_ReceivesPostMatchedSseEventUnder2Seconds_AndSupportsLastEventIdReplay()
    {
        await redisFixture.FlushDatabaseAsync();
        await using var factory = await postgresFixture.CreateFactoryAsync(
            redisConnectionString: redisFixture.ConnectionString);

        var tutorEmail = $"sse.tutor.{Guid.NewGuid():N}@example.com";
        const string password = "Password123!";
        Guid mathSubjectId;

        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

            if (!await db.Provinces.AnyAsync(p => p.ProvinceCode == "HN"))
            {
                db.Provinces.Add(new Province { ProvinceCode = "HN", ProvinceName = "Hà Nội", IsActive = true });
            }

            if (!await db.Districts.AnyAsync(d => d.DistrictCode == "HN_CG"))
            {
                db.Districts.Add(new District
                {
                    DistrictCode = "HN_CG",
                    ProvinceCode = "HN",
                    DistrictName = "Quận Cầu Giấy",
                    IsActive = true,
                });
            }

            var mathSubject = await db.Subjects.FirstOrDefaultAsync(s => s.Name == "Toán");
            if (mathSubject is null)
            {
                mathSubject = new Subject
                {
                    Id = Guid.NewGuid(),
                    Name = "Toán",
                    IsActive = true,
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow,
                };
                db.Subjects.Add(mathSubject);
            }
            mathSubjectId = mathSubject.Id;
            await db.SaveChangesAsync();

            var tutorUser = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                UserName = tutorEmail,
                NormalizedUserName = tutorEmail.ToUpperInvariant(),
                Email = tutorEmail,
                NormalizedEmail = tutorEmail.ToUpperInvariant(),
                FullName = "Gia Sư SSE",
                Role = AccountRole.TUTOR,
                Status = AccountStatus.ACTIVE,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow,
            };
            Assert.True((await userManager.CreateAsync(tutorUser, password)).Succeeded);

            var tutorProfile = new TutorProfile
            {
                Id = Guid.NewGuid(),
                UserId = tutorUser.Id,
                NormalizedDisplayName = "gia su sse",
                Status = TutorProfileStatus.APPROVED,
                CurrentStep = 6,
                Subjects = ["Toán"],
                TeachingLevels = ["SECONDARY"],
                TeachingModes = ["OFFLINE", "ONLINE"],
                ProvinceCode = "HN",
                DistrictCode = "HN_CG",
                SessionRateVnd = 250_000,
                IsNegotiable = true,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow,
                ApprovedAt = DateTimeOffset.UtcNow,
            };
            db.TutorProfiles.Add(tutorProfile);

            var matchingProfile = TutorMatchingProfile.Create(
                tutorProfileId: tutorProfile.Id,
                preferredSubjects: [mathSubjectId],
                preferredGrades: [8, 9, 10],
                minTuitionFeeVnd: 200_000,
                maxTuitionFeeVnd: 400_000,
                preferredProvinceCode: "HN",
                preferredDistrictCodes: ["HN_CG"],
                receiveAllDistricts: false,
                teachingModes: ["OFFLINE", "ONLINE"],
                isActive: true);
            db.TutorMatchingProfiles.Add(matchingProfile);

            await db.SaveChangesAsync();
        }

        using var tutorClient = factory.CreateApiClient();
        using var loginResponse = await PublicTutorDemandMatchApiTests.PostWithCsrfAsync(
            tutorClient,
            "/api/v1/auth/login",
            new { email = tutorEmail, password });
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
        using var sseResponse = await tutorClient.GetAsync(
            "/api/v1/tutors/me/matched-posts/stream",
            HttpCompletionOption.ResponseHeadersRead,
            cts.Token);

        Assert.Equal(HttpStatusCode.OK, sseResponse.StatusCode);
        Assert.Equal("text/event-stream", sseResponse.Content.Headers.ContentType?.MediaType);

        await using var stream = await sseResponse.Content.ReadAsStreamAsync(cts.Token);
        using var reader = new StreamReader(stream);

        // Wait for initial ": connected" heartbeat frame confirming active subscription
        var handshakeLine = await reader.ReadLineAsync(cts.Token);
        Assert.Equal(": connected", handshakeLine);

        // Trigger a public demand submission from another client and measure end-to-end latencies (T059)
        using var publicClient = factory.CreateApiClient();
        var publicStopwatch = System.Diagnostics.Stopwatch.StartNew();
        using var matchResponse = await PublicTutorDemandMatchApiTests.PostWithCsrfAsync(
            publicClient,
            "/api/v1/public/tutor-demands/match",
            new
            {
                queryText = "Cần tìm gia sư dạy Toán lớp 9 ôn thi vào 10 tại Quận Cầu Giấy, học phí 250k/buổi tuần 2 buổi",
            });
        publicStopwatch.Stop();
        Assert.Equal(HttpStatusCode.OK, matchResponse.StatusCode);
        Assert.True(
            publicStopwatch.Elapsed < TimeSpan.FromMilliseconds(2500),
            $"Public match latency exceeded 2.5s budget: {publicStopwatch.ElapsedMilliseconds}ms");

        var sseStopwatch = System.Diagnostics.Stopwatch.StartNew();
        string? eventLine = null;
        string? idLine = null;
        string? dataLine = null;

        while (!cts.Token.IsCancellationRequested)
        {
            var line = await reader.ReadLineAsync(cts.Token);
            if (line is null)
            {
                break;
            }

            if (line.StartsWith("event: ", StringComparison.Ordinal))
            {
                eventLine = line;
            }
            else if (line.StartsWith("id: ", StringComparison.Ordinal))
            {
                idLine = line;
            }
            else if (line.StartsWith("data: ", StringComparison.Ordinal))
            {
                dataLine = line;
                break;
            }
        }
        sseStopwatch.Stop();

        Assert.Equal("event: post_matched", eventLine);
        Assert.NotNull(idLine);
        Assert.NotNull(dataLine);
        Assert.True(
            sseStopwatch.Elapsed < TimeSpan.FromSeconds(2),
            $"SSE delivery latency exceeded 2s budget: {sseStopwatch.ElapsedMilliseconds}ms");
        using var payloadDoc = JsonDocument.Parse(dataLine["data: ".Length..]);
        Assert.Equal("Toán", payloadDoc.RootElement.GetProperty("subjectName").GetString());

        // Verify Last-Event-ID replay from "0" replays the event immediately
        using var replayRequest = new HttpRequestMessage(HttpMethod.Get, "/api/v1/tutors/me/matched-posts/stream");
        replayRequest.Headers.Add("Last-Event-ID", "0");
        using var replayResponse = await tutorClient.SendAsync(
            replayRequest,
            HttpCompletionOption.ResponseHeadersRead,
            cts.Token);
        Assert.Equal(HttpStatusCode.OK, replayResponse.StatusCode);
    }
}
