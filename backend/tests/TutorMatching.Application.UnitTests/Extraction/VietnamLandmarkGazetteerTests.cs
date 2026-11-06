using TutorMatching.Infrastructure.Extraction;

namespace TutorMatching.Application.UnitTests.Extraction;

public sealed class VietnamLandmarkGazetteerTests
{
    [Theory]
    [InlineData("Cần tìm gia sư Toán lớp 9 gần ĐH Bách Khoa", "HN", "HN_HBT", "Quận Hai Bà Trưng")]
    [InlineData("Tìm gia sư Tiếng Anh khu vực tòa nhà Keangnam Mỹ Đình", "HN", "HN_NTL", "Quận Nam Từ Liêm")]
    [InlineData("Cần cô giáo dạy kèm lớp 3 tại khu đô thị Ciputra", "HN", "HN_TH", "Quận Tây Hồ")]
    [InlineData("Tìm gia sư Lý lớp 11 gần ĐHQG Xuân Thủy", "HN", "HN_CG", "Quận Cầu Giấy")]
    public void TryResolve_WithKnownLandmarkPoi_ReturnsExpectedProvinceAndDistrict(
        string rawText,
        string expectedProvinceCode,
        string expectedDistrictCode,
        string expectedDistrictName)
    {
        var found = VietnamLandmarkGazetteer.TryResolve(rawText, out var match);

        Assert.True(found);
        Assert.NotNull(match);
        Assert.Equal(expectedProvinceCode, match!.ProvinceCode);
        Assert.Equal(expectedDistrictCode, match.DistrictCode);
        Assert.Equal(expectedDistrictName, match.DistrictName);
    }

    [Fact]
    public void TryResolve_WithoutKnownLandmark_ReturnsFalse()
    {
        var found = VietnamLandmarkGazetteer.TryResolve(
            "Tìm gia sư dạy Toán lớp 9 học phí 250k/buổi tuần 2 buổi",
            out var match);

        Assert.False(found);
        Assert.Null(match);
    }
}
