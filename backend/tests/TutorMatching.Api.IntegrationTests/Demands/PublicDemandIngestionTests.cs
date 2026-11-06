using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorMatching.Api.IntegrationTests.Fixtures;
using TutorMatching.Application.Abstractions;
using TutorMatching.Domain.Content;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Api.IntegrationTests.Demands;

[Collection("Redis API")]
public sealed class PublicDemandIngestionTests(PostgreSqlFixture postgresFixture, RedisTestFixture redisFixture)
{
    [Fact]
    public async Task IngestBatchOf10Requests_With3ExactDuplicatesAnd2PunctuationTweaks_PersistsOnly5UniqueExtractedPosts()
    {
        await redisFixture.FlushDatabaseAsync();
        await using var factory = await postgresFixture.CreateFactoryAsync(
            redisConnectionString: redisFixture.ConnectionString);

        await using var scope = factory.Services.CreateAsyncScope();
        var ingestionService = scope.ServiceProvider.GetRequiredService<IPublicDemandIngestionService>();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var actor = "guest:session-sprint6-test";

        // 5 unique base demands + 3 exact double-clicks + 2 minor punctuation/suffix tweaks = 10 requests
        string[] requests =
        [
            // Unique #1
            "Cần tìm gia sư dạy Toán lớp 9 ôn thi vào 10 tại quận Cầu Giấy Hà Nội học phí 250k/buổi tuần 2 buổi",
            // Exact duplicate #1 (double-click of #1)
            "Cần tìm gia sư dạy Toán lớp 9 ôn thi vào 10 tại quận Cầu Giấy Hà Nội học phí 250k/buổi tuần 2 buổi",
            // Exact duplicate #2 (extra spaces/case of #1)
            "  cần tìm GIA SƯ dạy Toán lớp 9 ôn thi vào 10 tại quận Cầu Giấy Hà Nội học phí 250k/buổi tuần 2 buổi  ",
            // Punctuation tweak #1 of #1
            "Cần tìm gia sư dạy Toán lớp 9, ôn thi vào 10 tại quận Cầu Giấy, Hà Nội! Học phí 250k/buổi, tuần 2 buổi.",

            // Unique #2
            "Tìm gia sư Tiếng Anh lớp 7 giao tiếp và ngữ pháp tại Đống Đa Hà Nội học phí 200k/buổi tuần 3 buổi",
            // Exact duplicate #3 (double-click of #2)
            "Tìm gia sư Tiếng Anh lớp 7 giao tiếp và ngữ pháp tại Đống Đa Hà Nội học phí 200k/buổi tuần 3 buổi",
            // Minor tweak #2 of #2 (SimHash near-duplicate)
            "Tìm gia sư Tiếng Anh lớp 7 giao tiếp và ngữ pháp tại Đống Đa Hà Nội học phí 200k/buổi tuần 3 buổi ạ",

            // Unique #3
            "Cần tìm gia sư Hóa học lớp 11 chuyên sâu gần ĐH Bách Khoa Hai Bà Trưng học phí 300k/buổi",
            // Unique #4
            "Tìm gia sư dạy Vật Lý lớp 12 luyện thi đại học hình thức Online qua Zoom học phí 250k/buổi",
            // Unique #5
            "Cần cô giáo dạy Toán và Tiếng Việt lớp 3 tại khu đô thị Ciputra Tây Hồ học phí 220k/buổi",
        ];

        var results = new List<PublicDemandIngestionResult>();
        foreach (var raw in requests)
        {
            var result = await ingestionService.IngestAsync(actor, raw, requesterUserId: null);
            results.Add(result);
        }

        Assert.Equal(10, results.Count);
        Assert.Equal(5, results.Count(r => !r.IsDeduplicatedHit));
        Assert.Equal(5, results.Count(r => r.IsDeduplicatedHit));

        // Verify exact and near duplicates point back to the original DemandPostId
        Assert.Equal(results[0].DemandPostId, results[1].DemandPostId);
        Assert.Equal(results[0].DemandPostId, results[2].DemandPostId);
        Assert.Equal(results[0].DemandPostId, results[3].DemandPostId);

        Assert.Equal(results[4].DemandPostId, results[5].DemandPostId);
        Assert.Equal(results[4].DemandPostId, results[6].DemandPostId);

        // Verify database only created 5 EXTRACTED posts for the 5 unique requests
        var extractedPosts = await db.DemandPosts
            .Where(p => p.ActorFingerprint == actor && p.Status == PostStatus.EXTRACTED)
            .ToListAsync();

        Assert.Equal(5, extractedPosts.Count);
    }
}
