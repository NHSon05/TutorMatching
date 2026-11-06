using TutorMatching.Application.Abstractions;
using TutorMatching.Domain.Catalog;
using TutorMatching.Domain.Locations;
using TutorMatching.Infrastructure.Extraction;

namespace TutorMatching.Application.UnitTests.Extraction;

public sealed class HybridExtractionServiceTests
{
    private static readonly IReadOnlyList<Subject> CatalogSubjects =
    [
        new Subject { Id = Guid.Parse("11111111-1111-1111-1111-111111111111"), Name = "Toán", IsActive = true },
        new Subject { Id = Guid.Parse("22222222-2222-2222-2222-222222222222"), Name = "Tiếng Anh", IsActive = true },
        new Subject { Id = Guid.Parse("33333333-3333-3333-3333-333333333333"), Name = "Hóa học", IsActive = true },
    ];

    private static readonly IReadOnlyList<Province> CatalogProvinces =
    [
        new Province { ProvinceCode = "HN", ProvinceName = "Hà Nội", IsActive = true },
    ];

    private static readonly IReadOnlyList<District> CatalogDistricts =
    [
        new District { DistrictCode = "HN_CG", ProvinceCode = "HN", DistrictName = "Quận Cầu Giấy", IsActive = true },
        new District { DistrictCode = "HN_HBT", ProvinceCode = "HN", DistrictName = "Quận Hai Bà Trưng", IsActive = true },
    ];

    [Fact]
    public async Task ExtractAsync_WhenLlmTimesOutBeyondCircuitBreaker_FallsBackToRegexAndGazetteer()
    {
        var slowLlm = new FakeLlmEntityExtractor(async ct =>
        {
            await Task.Delay(TimeSpan.FromSeconds(10), ct);
            return null;
        });

        var service = new HybridExtractionService(
            new RegexEntityExtractor(),
            new AddressResolutionService(),
            slowLlm,
            llmTimeout: TimeSpan.FromMilliseconds(150));

        var result = await service.ExtractAsync(
            "Cần tìm gia sư dạy Toán ôn thi vào 10 gần ĐH Bách Khoa, học phí 250k/b tuần 2 buổi",
            CatalogSubjects,
            CatalogProvinces,
            CatalogDistricts);

        Assert.False(result.IsRejected);
        Assert.True(result.UsedFallback);
        Assert.Equal(Guid.Parse("11111111-1111-1111-1111-111111111111"), result.SubjectId);
        Assert.Equal("Toán", result.SubjectNameRaw);
        Assert.Equal(9, result.GradeLevel);
        Assert.Equal(250_000, result.TuitionFeeVnd);
        Assert.Equal(2, result.SessionsPerWeek);
        Assert.Equal("HN", result.ProvinceCode);
        Assert.Equal("HN_HBT", result.DistrictCode);
        Assert.False(result.IsLocationAmbiguous);
        Assert.True(result.ConfidenceScore >= 0.70m);
    }

    [Fact]
    public async Task ExtractAsync_WhenLlmReturnsStructuredFields_MergesWithCatalogAndGazetteer()
    {
        var fastLlm = new FakeLlmEntityExtractor(_ => Task.FromResult<LlmExtractionPayload?>(
            new LlmExtractionPayload(
                SubjectName: "Tiếng Anh",
                GradeLevel: 8,
                TuitionFeeVnd: 220_000,
                FeePeriod: "PER_SESSION",
                IsFeeNegotiable: false,
                SessionsPerWeek: 2,
                TeachingMode: "OFFLINE",
                AddressText: "Cầu Giấy, Hà Nội",
                ScheduleNotes: "Tối thứ 2 và thứ 5",
                ConfidenceScore: 0.95m)));

        var service = new HybridExtractionService(
            new RegexEntityExtractor(),
            new AddressResolutionService(),
            fastLlm);

        var result = await service.ExtractAsync(
            "Tìm gia sư Tiếng Anh lớp 8 ở Cầu Giấy Hà Nội 220k/buổi tối thứ 2 và thứ 5",
            CatalogSubjects,
            CatalogProvinces,
            CatalogDistricts);

        Assert.False(result.IsRejected);
        Assert.False(result.UsedFallback);
        Assert.Equal(Guid.Parse("22222222-2222-2222-2222-222222222222"), result.SubjectId);
        Assert.Equal(8, result.GradeLevel);
        Assert.Equal(220_000, result.TuitionFeeVnd);
        Assert.Equal("HN", result.ProvinceCode);
        Assert.Equal("HN_CG", result.DistrictCode);
        Assert.Equal("Tối thứ 2 và thứ 5", result.ScheduleNotes);
        Assert.True(result.ConfidenceScore >= 0.90m);
    }

    [Fact]
    public async Task ExtractAsync_WhenInputIsMeaninglessGibberish_ReturnsLowConfidenceAndRejectedTrue()
    {
        var service = new HybridExtractionService(
            new RegexEntityExtractor(),
            new AddressResolutionService(),
            llmExtractor: null);

        var result = await service.ExtractAsync(
            "asdfghjkl qwertyuiop zxcvbnm 1234567890",
            CatalogSubjects,
            CatalogProvinces,
            CatalogDistricts);

        Assert.True(result.ConfidenceScore < 0.40m);
        Assert.True(result.IsRejected);
    }

    private sealed class FakeLlmEntityExtractor(
        Func<CancellationToken, Task<LlmExtractionPayload?>> handler) : ILlmEntityExtractor
    {
        public Task<LlmExtractionPayload?> TryExtractAsync(
            string rawContent,
            CancellationToken cancellationToken = default) => handler(cancellationToken);
    }
}
