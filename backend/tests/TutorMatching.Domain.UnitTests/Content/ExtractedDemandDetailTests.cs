using TutorMatching.Domain.Content;

namespace TutorMatching.Domain.UnitTests.Content;

public sealed class ExtractedDemandDetailTests
{
    [Fact]
    public void Create_WithValidInputs_InitializesPropertiesCorrectly()
    {
        var postId = Guid.NewGuid();
        var subjectId = Guid.NewGuid();
        var now = new DateTimeOffset(2026, 11, 6, 4, 0, 0, TimeSpan.Zero);

        var detail = ExtractedDemandDetail.Create(
            demandPostId: postId,
            subjectId: subjectId,
            subjectNameRaw: "Toán",
            gradeLevel: 9,
            tuitionFeeVnd: 250_000,
            feePeriod: "PER_SESSION",
            isFeeNegotiable: false,
            sessionsPerWeek: 2,
            teachingMode: "OFFLINE",
            provinceCode: "01",
            districtCode: "005",
            rawAddress: "Cầu Giấy, Hà Nội",
            isLocationAmbiguous: false,
            scheduleNotes: "Tối thứ 3, thứ 5",
            confidenceScore: 0.92m,
            extractedJson: """{"subject":"Toán","grade":9}""",
            embedding: [0.12f, -0.34f, 0.56f],
            now: now);

        Assert.NotEqual(Guid.Empty, detail.Id);
        Assert.Equal(postId, detail.DemandPostId);
        Assert.Equal(subjectId, detail.SubjectId);
        Assert.Equal("Toán", detail.SubjectNameRaw);
        Assert.Equal(9, detail.GradeLevel);
        Assert.Equal(250_000, detail.TuitionFeeVnd);
        Assert.Equal("PER_SESSION", detail.FeePeriod);
        Assert.False(detail.IsFeeNegotiable);
        Assert.Equal(2, detail.SessionsPerWeek);
        Assert.Equal("OFFLINE", detail.TeachingMode);
        Assert.Equal("01", detail.ProvinceCode);
        Assert.Equal("005", detail.DistrictCode);
        Assert.False(detail.IsLocationAmbiguous);
        Assert.Equal(0.92m, detail.ConfidenceScore);
        Assert.Equal(now, detail.CreatedAt);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(13)]
    public void Create_WhenGradeLevelOutOfRange_ThrowsArgumentOutOfRangeException(int invalidGrade)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            ExtractedDemandDetail.Create(
                demandPostId: Guid.NewGuid(),
                subjectId: Guid.NewGuid(),
                subjectNameRaw: "Toán",
                gradeLevel: invalidGrade,
                tuitionFeeVnd: 200_000,
                feePeriod: "PER_SESSION",
                isFeeNegotiable: false,
                sessionsPerWeek: 2,
                teachingMode: "OFFLINE",
                provinceCode: "01",
                districtCode: "005",
                rawAddress: "Cầu Giấy",
                isLocationAmbiguous: false,
                scheduleNotes: null,
                confidenceScore: 0.85m,
                extractedJson: "{}"));
    }

    [Fact]
    public void Create_WhenTuitionFeeIsNegative_ThrowsArgumentOutOfRangeException()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            ExtractedDemandDetail.Create(
                demandPostId: Guid.NewGuid(),
                subjectId: Guid.NewGuid(),
                subjectNameRaw: "Toán",
                gradeLevel: 10,
                tuitionFeeVnd: -50_000,
                feePeriod: "PER_SESSION",
                isFeeNegotiable: false,
                sessionsPerWeek: 2,
                teachingMode: "OFFLINE",
                provinceCode: "01",
                districtCode: "005",
                rawAddress: "Cầu Giấy",
                isLocationAmbiguous: false,
                scheduleNotes: null,
                confidenceScore: 0.85m,
                extractedJson: "{}"));
    }

    [Theory]
    [InlineData(-0.01)]
    [InlineData(1.01)]
    public void Create_WhenConfidenceScoreOutOfRange_ThrowsArgumentOutOfRangeException(double score)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            ExtractedDemandDetail.Create(
                demandPostId: Guid.NewGuid(),
                subjectId: Guid.NewGuid(),
                subjectNameRaw: "Toán",
                gradeLevel: 10,
                tuitionFeeVnd: 200_000,
                feePeriod: "PER_SESSION",
                isFeeNegotiable: false,
                sessionsPerWeek: 2,
                teachingMode: "OFFLINE",
                provinceCode: "01",
                districtCode: "005",
                rawAddress: "Cầu Giấy",
                isLocationAmbiguous: false,
                scheduleNotes: null,
                confidenceScore: (decimal)score,
                extractedJson: "{}"));
    }

    [Fact]
    public void Create_WhenOfflineAndDistrictCodeMissing_MarksLocationAmbiguousTrue()
    {
        var detail = ExtractedDemandDetail.Create(
            demandPostId: Guid.NewGuid(),
            subjectId: Guid.NewGuid(),
            subjectNameRaw: "Hóa",
            gradeLevel: 11,
            tuitionFeeVnd: 300_000,
            feePeriod: "PER_SESSION",
            isFeeNegotiable: false,
            sessionsPerWeek: 2,
            teachingMode: "OFFLINE",
            provinceCode: "01",
            districtCode: null,
            rawAddress: "Gần ngã tư sở",
            isLocationAmbiguous: false,
            scheduleNotes: null,
            confidenceScore: 0.75m,
            extractedJson: "{}");

        Assert.True(detail.IsLocationAmbiguous);
    }
}
