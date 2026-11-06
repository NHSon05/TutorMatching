using TutorMatching.Infrastructure.Extraction;

namespace TutorMatching.Application.UnitTests.Extraction;

public sealed class RegexEntityExtractorTests
{
    private readonly RegexEntityExtractor extractor = new();

    [Theory]
    [InlineData("Cần tìm gia sư dạy Toán lớp 9 khu vực Cầu Giấy", "Toán", 9)]
    [InlineData("Tìm gia sư ôn thi vào 10 môn Ngữ Văn tại Đống Đa", "Ngữ Văn", 9)]
    [InlineData("Cần tìm gia sư Vật Lý ôn thi ĐH tại Hai Bà Trưng", "Vật Lý", 12)]
    [InlineData("Tìm gia sư luyện thi THPTQG môn Hóa học cấp tốc", "Hóa học", 12)]
    [InlineData("Cần cô giáo dạy Tiếng Anh lớp 5 tại nhà", "Tiếng Anh", 5)]
    public void Extract_SubjectAndGradeLevel_NormalizesSpecialExamPhrases(
        string rawText,
        string expectedSubject,
        int expectedGrade)
    {
        var result = extractor.Extract(rawText);

        Assert.Equal(expectedSubject, result.SubjectNameRaw);
        Assert.Equal(expectedGrade, result.GradeLevel);
    }

    [Theory]
    [InlineData("Tìm gia sư Toán lớp 8 học phí 250k/b tuần 2 buổi", 250_000, "PER_SESSION", false, 2)]
    [InlineData("Cần gia sư Tiếng Anh lớp 10 giá 300.000đ/buổi, 3b/tuần", 300_000, "PER_SESSION", false, 3)]
    [InlineData("Tìm gia sư Toán lớp 6 học phí 1tr6/8b tuần 2 buổi", 200_000, "PER_SESSION", false, 2)]
    [InlineData("Tìm gia sư Hóa lớp 11 học phí thỏa thuận tuần 2 buổi", 0, "PER_SESSION", true, 2)]
    public void Extract_TuitionFeeAndSessionsPerWeek_NormalizesToVndPerSession(
        string rawText,
        int expectedFeeVnd,
        string expectedPeriod,
        bool expectedNegotiable,
        int expectedSessions)
    {
        var result = extractor.Extract(rawText);

        Assert.Equal(expectedFeeVnd, result.TuitionFeeVnd);
        Assert.Equal(expectedPeriod, result.FeePeriod);
        Assert.Equal(expectedNegotiable, result.IsFeeNegotiable);
        Assert.Equal(expectedSessions, result.SessionsPerWeek);
    }

    [Theory]
    [InlineData("Tìm gia sư Tiếng Anh dạy online qua Zoom tuần 2 buổi", "ONLINE")]
    [InlineData("Tìm gia sư Toán lớp 9 dạy tại nhà ở Cầu Giấy", "OFFLINE")]
    [InlineData("Cần gia sư Hóa lớp 11 kết hợp online và offline", "HYBRID")]
    public void Extract_TeachingMode_DetectsOnlineOfflineAndHybrid(
        string rawText,
        string expectedMode)
    {
        var result = extractor.Extract(rawText);

        Assert.Equal(expectedMode, result.TeachingMode);
    }
}
