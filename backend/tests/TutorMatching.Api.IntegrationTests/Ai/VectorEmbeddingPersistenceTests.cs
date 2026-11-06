using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorMatching.Api.IntegrationTests.Fixtures;
using TutorMatching.Application.Abstractions;
using TutorMatching.Domain.Content;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Api.IntegrationTests.Ai;

[Collection("Redis API")]
public sealed class VectorEmbeddingPersistenceTests(PostgreSqlFixture postgresFixture, RedisTestFixture redisFixture)
{
    [Fact]
    public async Task EmbeddingColumn_RoundTrips1536Floats_AndSimilarityQueryRanksClosestDemandFirst()
    {
        await redisFixture.FlushDatabaseAsync();
        await using var factory = await postgresFixture.CreateFactoryAsync(
            redisConnectionString: redisFixture.ConnectionString);

        await using var scope = factory.Services.CreateAsyncScope();
        var embeddings = scope.ServiceProvider.GetRequiredService<ITextEmbeddingService>();
        var store = scope.ServiceProvider.GetRequiredService<IDemandMatchingStore>();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var mathText = $"Cần gia sư dạy Toán lớp 9 luyện thi vào 10 ở Cầu Giấy {Guid.NewGuid():N}";
        var englishText = $"Tuyển giáo viên Tiếng Anh IELTS online cho người đi làm {Guid.NewGuid():N}";
        var mathDetail = await SeedDetailAsync(store, embeddings, mathText, "Toán", 9, "OFFLINE");
        var englishDetail = await SeedDetailAsync(store, embeddings, englishText, "Tiếng Anh", 12, "ONLINE");
        var withoutEmbedding = await SeedDetailAsync(store, null, $"Gia sư Toán lớp 9 {Guid.NewGuid():N}", "Toán", 9, "ONLINE");

        // 1. Round-trip: the jsonb embedding column stores and restores all 1536 float components.
        db.ChangeTracker.Clear();
        var persisted = await db.ExtractedDemandDetails.AsNoTracking().SingleAsync(x => x.Id == mathDetail.Id);
        Assert.NotNull(persisted.Embedding);
        Assert.Equal(ITextEmbeddingService.Dimensions, persisted.Embedding!.Count);
        Assert.Equal(mathDetail.Embedding, persisted.Embedding);

        // 2. Similarity query: closest demand ranks first; rows without an embedding are excluded.
        var query = await embeddings.GenerateAsync("Tìm gia sư Toán lớp 9 ôn thi vào 10 Cầu Giấy");
        var results = await store.FindSimilarDemandDetailsAsync(query, topK: 50);

        var mathIndex = IndexOf(results, mathDetail.Id);
        var englishIndex = IndexOf(results, englishDetail.Id);
        Assert.True(mathIndex >= 0, "Math demand should be returned.");
        Assert.True(englishIndex < 0 || mathIndex < englishIndex, "Math demand should outrank the English demand.");
        Assert.DoesNotContain(results, r => r.ExtractedDemandDetailId == withoutEmbedding.Id);
        Assert.True(results.Zip(results.Skip(1)).All(p => p.First.Similarity >= p.Second.Similarity));

        var mathScore = results[mathIndex].Similarity;
        Assert.InRange(mathScore, 0.5, 1.0001);
        Assert.Equal(VectorMath.CosineSimilarity(query, mathDetail.Embedding!.ToArray()), mathScore, 4);

        // 3. Guards: dimension mismatch and non-positive topK are rejected.
        await Assert.ThrowsAsync<ArgumentException>(() => store.FindSimilarDemandDetailsAsync(new float[8], topK: 5));
        await Assert.ThrowsAsync<ArgumentOutOfRangeException>(() => store.FindSimilarDemandDetailsAsync(query, topK: 0));
    }

    [Fact]
    public async Task PublicMatchEndpoint_PersistsEmbeddingForNewDemand()
    {
        await redisFixture.FlushDatabaseAsync();
        await using var factory = await postgresFixture.CreateFactoryAsync(
            redisConnectionString: redisFixture.ConnectionString);
        using var client = factory.CreateApiClient();

        using var response = await Demands.PublicTutorDemandMatchApiTests.PostWithCsrfAsync(
            client,
            "/api/v1/public/tutor-demands/match",
            new { queryText = $"Cần tìm gia sư dạy Toán lớp 8 tại Quận Đống Đa Hà Nội, học phí 300k/buổi mã {Guid.NewGuid():N}" });
        response.EnsureSuccessStatusCode();
        using var doc = System.Text.Json.JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var demandPostId = doc.RootElement.GetProperty("demandPostId").GetGuid();

        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var detail = await db.ExtractedDemandDetails.AsNoTracking().SingleAsync(x => x.DemandPostId == demandPostId);

        Assert.NotNull(detail.Embedding);
        Assert.Equal(ITextEmbeddingService.Dimensions, detail.Embedding!.Count);
        var norm = Math.Sqrt(detail.Embedding.Sum(v => (double)v * v));
        Assert.InRange(norm, 0.999, 1.001);
    }

    private static int IndexOf(IReadOnlyList<SimilarDemandDetailDto> results, Guid id)
    {
        for (var i = 0; i < results.Count; i++)
        {
            if (results[i].ExtractedDemandDetailId == id)
            {
                return i;
            }
        }

        return -1;
    }

    private static async Task<ExtractedDemandDetail> SeedDetailAsync(
        IDemandMatchingStore store,
        ITextEmbeddingService? embeddings,
        string rawContent,
        string subjectName,
        int grade,
        string mode)
    {
        var now = DateTimeOffset.UtcNow;
        var post = DemandPost.Create(
            actorFingerprint: $"test:{Guid.NewGuid():N}",
            contentHash: Guid.NewGuid().ToString("N"),
            rawContent: rawContent,
            requesterUserId: null,
            now: now);
        post.MarkExtracted();

        var vector = embeddings is null ? null : (await embeddings.GenerateAsync(rawContent)).ToList();
        var detail = ExtractedDemandDetail.Create(
            demandPostId: post.Id,
            subjectId: null,
            subjectNameRaw: subjectName,
            gradeLevel: grade,
            tuitionFeeVnd: 300_000,
            feePeriod: "PER_SESSION",
            isFeeNegotiable: false,
            sessionsPerWeek: 2,
            teachingMode: mode,
            provinceCode: null,
            districtCode: null,
            rawAddress: null,
            isLocationAmbiguous: false,
            scheduleNotes: null,
            confidenceScore: 0.80m,
            extractedJson: "{}",
            embedding: vector,
            now: now);

        await store.SaveDemandAndNotificationsAsync(post, detail, [], CancellationToken.None);
        return detail;
    }
}
