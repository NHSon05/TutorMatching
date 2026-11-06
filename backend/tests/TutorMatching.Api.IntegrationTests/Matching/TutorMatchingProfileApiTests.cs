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
public sealed class TutorMatchingProfileApiTests(PostgreSqlFixture postgresFixture, RedisTestFixture redisFixture)
{
    [Fact]
    public async Task PutAndGetMatchingProfile_AndQueryMatchedPostsHistory_SucceedForApprovedTutor()
    {
        await redisFixture.FlushDatabaseAsync();
        await using var factory = await postgresFixture.CreateFactoryAsync(
            redisConnectionString: redisFixture.ConnectionString);

        var tutorEmail = $"profile.tutor.{Guid.NewGuid():N}@example.com";
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
                FullName = "Gia Sư Cấu Hình",
                Role = AccountRole.TUTOR,
                Status = AccountStatus.ACTIVE,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow,
            };
            Assert.True((await userManager.CreateAsync(tutorUser, password)).Succeeded);

            db.TutorProfiles.Add(new TutorProfile
            {
                Id = Guid.NewGuid(),
                UserId = tutorUser.Id,
                NormalizedDisplayName = "gia su cau hinh",
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
            });
            await db.SaveChangesAsync();
        }

        using var tutorClient = factory.CreateApiClient();
        using var loginResponse = await PublicTutorDemandMatchApiTests.PostWithCsrfAsync(
            tutorClient,
            "/api/v1/auth/login",
            new { email = tutorEmail, password });
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        // 1. PUT /api/v1/tutors/me/matching-profile
        var csrf = await tutorClient.GetFromJsonAsync<CsrfDto>("/api/v1/auth/csrf");
        using var putRequest = new HttpRequestMessage(HttpMethod.Put, "/api/v1/tutors/me/matching-profile")
        {
            Content = JsonContent.Create(new
            {
                preferredSubjects = new[] { mathSubjectId },
                preferredGrades = new[] { 8, 9, 10 },
                minTuitionFeeVnd = 200_000,
                maxTuitionFeeVnd = 400_000,
                preferredProvinceCode = "HN",
                preferredDistrictCodes = new[] { "HN_CG" },
                receiveAllDistricts = true,
                teachingModes = new[] { "OFFLINE", "ONLINE" },
                isActive = true,
            }),
        };
        putRequest.Headers.Add(csrf!.HeaderName, csrf.RequestToken);
        using var putResponse = await tutorClient.SendAsync(putRequest);
        Assert.Equal(HttpStatusCode.OK, putResponse.StatusCode);

        // 2. GET /api/v1/tutors/me/matching-profile
        using var getProfileResponse = await tutorClient.GetAsync("/api/v1/tutors/me/matching-profile");
        Assert.Equal(HttpStatusCode.OK, getProfileResponse.StatusCode);
        using var profileDoc = JsonDocument.Parse(await getProfileResponse.Content.ReadAsStringAsync());
        Assert.Equal(200_000, profileDoc.RootElement.GetProperty("minTuitionFeeVnd").GetInt32());
        Assert.True(profileDoc.RootElement.GetProperty("receiveAllDistricts").GetBoolean());

        // 3. Submit a matching demand on the public endpoint
        using var publicClient = factory.CreateApiClient();
        using var matchResponse = await PublicTutorDemandMatchApiTests.PostWithCsrfAsync(
            publicClient,
            "/api/v1/public/tutor-demands/match",
            new
            {
                queryText = "Cần tìm gia sư dạy Toán lớp 9 ôn thi vào 10 tại Quận Cầu Giấy, học phí 250k/buổi tuần 2 buổi",
            });
        Assert.Equal(HttpStatusCode.OK, matchResponse.StatusCode);

        // 4. GET /api/v1/tutors/me/matched-posts
        using var historyResponse = await tutorClient.GetAsync("/api/v1/tutors/me/matched-posts?page=1&pageSize=20");
        Assert.Equal(HttpStatusCode.OK, historyResponse.StatusCode);
        using var historyDoc = JsonDocument.Parse(await historyResponse.Content.ReadAsStringAsync());
        Assert.Equal(1, historyDoc.RootElement.GetProperty("totalCount").GetInt32());
        var firstItem = historyDoc.RootElement.GetProperty("items")[0];
        Assert.Equal("Toán", firstItem.GetProperty("subjectName").GetString());
        Assert.Equal(9, firstItem.GetProperty("gradeLevel").GetInt32());
    }

    private sealed record CsrfDto(string RequestToken, string HeaderName);
}
