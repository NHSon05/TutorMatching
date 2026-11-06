using TutorMatching.Application.Abstractions;
using TutorMatching.Infrastructure.Extraction;

namespace TutorMatching.Application.UnitTests.Ai;

public sealed class TextEmbeddingServiceTests
{
    private readonly ITextEmbeddingService service = new DeterministicTextEmbeddingService();

    [Fact]
    public async Task GenerateAsync_Returns1536DimensionalUnitVector()
    {
        var vector = await service.GenerateAsync("Cần tìm gia sư dạy Toán lớp 9 tại Quận Cầu Giấy");

        Assert.Equal(ITextEmbeddingService.Dimensions, service.VectorDimensions);
        Assert.Equal(1536, vector.Length);
        Assert.All(vector, v => Assert.False(float.IsNaN(v) || float.IsInfinity(v)));

        var norm = Math.Sqrt(vector.Sum(v => (double)v * v));
        Assert.InRange(norm, 0.999, 1.001);
    }

    [Fact]
    public async Task GenerateAsync_IsDeterministic_AndIgnoresCaseDiacriticsAndPunctuation()
    {
        var first = await service.GenerateAsync("Gia sư TOÁN lớp 9, Cầu Giấy!");
        var second = await service.GenerateAsync("Gia sư TOÁN lớp 9, Cầu Giấy!");
        var normalized = await service.GenerateAsync("gia su toan lop 9 cau giay");

        Assert.Equal(first, second);
        Assert.InRange(VectorMath.CosineSimilarity(first, normalized), 0.999, 1.001);
    }

    [Fact]
    public async Task GenerateAsync_ForEmptyText_ReturnsZeroVector()
    {
        var vector = await service.GenerateAsync("   ");

        Assert.Equal(1536, vector.Length);
        Assert.All(vector, v => Assert.Equal(0f, v));
        Assert.Equal(0d, VectorMath.CosineSimilarity(vector, vector));
    }

    [Fact]
    public async Task CosineSimilarity_RanksSemanticallyCloserDemandsHigher()
    {
        var query = await service.GenerateAsync("Tìm gia sư Toán lớp 9 ôn thi vào 10 Cầu Giấy");
        var similar = await service.GenerateAsync("Cần gia sư dạy Toán lớp 9 luyện thi vào 10 ở Cầu Giấy");
        var unrelated = await service.GenerateAsync("Tuyển giáo viên Tiếng Anh IELTS online cho người đi làm");

        var similarScore = VectorMath.CosineSimilarity(query, similar);
        var unrelatedScore = VectorMath.CosineSimilarity(query, unrelated);

        Assert.True(similarScore > unrelatedScore, $"similar={similarScore}, unrelated={unrelatedScore}");
        Assert.True(similarScore > 0.5, $"similar={similarScore}");
        Assert.True(unrelatedScore < 0.3, $"unrelated={unrelatedScore}");
    }

    [Fact]
    public void CosineSimilarity_RejectsVectorsOfDifferentLength()
    {
        Assert.Throws<ArgumentException>(() => VectorMath.CosineSimilarity([1f, 0f], [1f, 0f, 0f]));
    }

    [Fact]
    public void CosineSimilarity_ComputesKnownValues()
    {
        Assert.Equal(1d, VectorMath.CosineSimilarity([1f, 0f], [2f, 0f]), 6);
        Assert.Equal(0d, VectorMath.CosineSimilarity([1f, 0f], [0f, 3f]), 6);
        Assert.Equal(-1d, VectorMath.CosineSimilarity([1f, 1f], [-1f, -1f]), 6);
    }
}
