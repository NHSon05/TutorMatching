using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorMatching.Api.IntegrationTests.Fixtures;
using TutorMatching.Domain.Catalog;
using TutorMatching.Domain.Locations;
using TutorMatching.Domain.Tutors;
using TutorMatching.Domain.Users;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Api.IntegrationTests.Demands;

[Collection("Redis API")]
public sealed class PublicTutorDemandMatchApiTests(PostgreSqlFixture postgresFixture, RedisTestFixture redisFixture)
{
    [Fact]
    public async Task PostPublicDemandMatch_ExtractsCriteria_ReturnsOnlyApprovedActiveTutorsWithoutPrivateData_AndPersistsToDb()
    {
        await redisFixture.FlushDatabaseAsync();
        await using var factory = await postgresFixture.CreateFactoryAsync(
            redisConnectionString: redisFixture.ConnectionString);

        Guid mathId;
        Guid approvedTutorProfileId;
        Guid pendingTutorProfileId;

        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

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
            mathId = mathSubject.Id;

            var approvedUser = CreateUser("approved.tutor@example.com", "Lê Hoàng Nam", "0988776655", AccountStatus.ACTIVE);
            var pendingUser = CreateUser("pending.tutor@example.com", "Phạm Văn B", "0988776656", AccountStatus.ACTIVE);
            db.Users.AddRange(approvedUser, pendingUser);

            var approvedProfile = new TutorProfile
            {
                Id = Guid.NewGuid(),
                UserId = approvedUser.Id,
                NormalizedDisplayName = "le hoang nam",
                Status = TutorProfileStatus.APPROVED,
                CurrentStep = 6,
                Subjects = ["Toán"],
                TeachingLevels = ["SECONDARY", "HIGH_SCHOOL"],
                TeachingModes = ["OFFLINE", "ONLINE"],
                ProvinceCode = "HN",
                DistrictCode = "HN_CG",
                SessionRateVnd = 250_000,
                HourlyRateVnd = 200_000,
                IsNegotiable = true,
                Degree = "Cử nhân Sư phạm Toán",
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow,
                ApprovedAt = DateTimeOffset.UtcNow,
            };
            approvedTutorProfileId = approvedProfile.Id;

            var pendingProfile = new TutorProfile
            {
                Id = Guid.NewGuid(),
                UserId = pendingUser.Id,
                NormalizedDisplayName = "pham van b",
                Status = TutorProfileStatus.PENDING_REVIEW,
                CurrentStep = 6,
                Subjects = ["Toán"],
                TeachingLevels = ["SECONDARY"],
                TeachingModes = ["OFFLINE"],
                ProvinceCode = "HN",
                DistrictCode = "HN_CG",
                SessionRateVnd = 250_000,
                IsNegotiable = true,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow,
            };
            pendingTutorProfileId = pendingProfile.Id;

            db.TutorProfiles.AddRange(approvedProfile, pendingProfile);
            db.TutorSubjects.Add(new TutorSubject
            {
                TutorProfileId = approvedProfile.Id,
                SubjectId = mathId,
            });

            await db.SaveChangesAsync();
        }

        using var client = factory.CreateApiClient();
        using var response = await PostWithCsrfAsync(
            client,
            "/api/v1/public/tutor-demands/match",
            new
            {
                queryText = "Cần tìm gia sư dạy Toán lớp 9 ôn thi vào 10 tại Quận Cầu Giấy, học phí 250k/buổi tuần 2 buổi",
            });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var rawJson = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(rawJson);
        var root = doc.RootElement;

        var demandPostId = root.GetProperty("demandPostId").GetGuid();
        Assert.NotEqual(Guid.Empty, demandPostId);
        Assert.False(root.GetProperty("isDeduplicatedHit").GetBoolean());

        var extracted = root.GetProperty("extractedCriteria");
        Assert.Equal(mathId, extracted.GetProperty("subjectId").GetGuid());
        Assert.Equal("Toán", extracted.GetProperty("subjectName").GetString());
        Assert.Equal(9, extracted.GetProperty("gradeLevel").GetInt32());
        Assert.Equal(250_000, extracted.GetProperty("tuitionFeeVnd").GetInt32());
        Assert.Equal("HN", extracted.GetProperty("provinceCode").GetString());
        Assert.Equal("HN_CG", extracted.GetProperty("districtCode").GetString());
        Assert.False(extracted.GetProperty("isLocationAmbiguous").GetBoolean());

        var matchedTutors = root.GetProperty("matchedTutors").EnumerateArray().ToList();
        Assert.Contains(matchedTutors, t => t.GetProperty("tutorProfileId").GetGuid() == approvedTutorProfileId);
        Assert.DoesNotContain(matchedTutors, t => t.GetProperty("tutorProfileId").GetGuid() == pendingTutorProfileId);

        // SRS Privacy Invariant: Never leak email, phone, birthDate, or exact address in public responses
        Assert.DoesNotContain("approved.tutor@example.com", rawJson, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("0988776655", rawJson, StringComparison.OrdinalIgnoreCase);

        // Second identical request should hit Redis deduplication cache immediately
        using var secondResponse = await PostWithCsrfAsync(
            client,
            "/api/v1/public/tutor-demands/match",
            new
            {
                queryText = "Cần tìm gia sư dạy Toán lớp 9 ôn thi vào 10 tại Quận Cầu Giấy, học phí 250k/buổi tuần 2 buổi",
            });

        Assert.Equal(HttpStatusCode.OK, secondResponse.StatusCode);
        using var secondDoc = JsonDocument.Parse(await secondResponse.Content.ReadAsStringAsync());
        Assert.True(secondDoc.RootElement.GetProperty("isDeduplicatedHit").GetBoolean());
        Assert.Equal(demandPostId, secondDoc.RootElement.GetProperty("demandPostId").GetGuid());
    }

    internal static ApplicationUser CreateUser(string email, string fullName, string phoneNumber, AccountStatus status) => new()
    {
        Id = Guid.NewGuid(),
        UserName = email,
        NormalizedUserName = email.ToUpperInvariant(),
        Email = email,
        NormalizedEmail = email.ToUpperInvariant(),
        FullName = fullName,
        PhoneNumber = phoneNumber,
        DateOfBirth = new DateOnly(1998, 5, 15),
        Role = AccountRole.TUTOR,
        Status = status,
        SecurityStamp = Guid.NewGuid().ToString("N"),
        ConcurrencyStamp = Guid.NewGuid().ToString("N"),
        CreatedAt = DateTimeOffset.UtcNow,
        UpdatedAt = DateTimeOffset.UtcNow,
    };

    internal static async Task<HttpResponseMessage> PostWithCsrfAsync(HttpClient client, string url, object body)
    {
        var csrf = await client.GetFromJsonAsync<CsrfDto>("/api/v1/auth/csrf");
        using var request = new HttpRequestMessage(HttpMethod.Post, url)
        {
            Content = JsonContent.Create(body),
        };
        request.Headers.Add(csrf!.HeaderName, csrf.RequestToken);
        return await client.SendAsync(request);
    }

    private sealed record CsrfDto(string RequestToken, string HeaderName);
}
