using TutorMatching.Domain.Locations;
using TutorMatching.Infrastructure.Extraction;

namespace TutorMatching.Application.UnitTests.Extraction;

public sealed class AddressResolutionServiceTests
{
    private static readonly IReadOnlyList<Province> SampleProvinces =
    [
        new Province { ProvinceCode = "HN", ProvinceName = "Hà Nội", IsActive = true },
        new Province { ProvinceCode = "HCM", ProvinceName = "TP. Hồ Chí Minh", IsActive = true },
    ];

    private static readonly IReadOnlyList<District> SampleDistricts =
    [
        new District { DistrictCode = "HN_CG", ProvinceCode = "HN", DistrictName = "Quận Cầu Giấy", IsActive = true },
        new District { DistrictCode = "HN_DD", ProvinceCode = "HN", DistrictName = "Quận Đống Đa", IsActive = true },
        new District { DistrictCode = "HN_HBT", ProvinceCode = "HN", DistrictName = "Quận Hai Bà Trưng", IsActive = true },
        new District { DistrictCode = "HN_NTL", ProvinceCode = "HN", DistrictName = "Quận Nam Từ Liêm", IsActive = true },
        new District { DistrictCode = "HN_TH", ProvinceCode = "HN", DistrictName = "Quận Tây Hồ", IsActive = true },
        new District { DistrictCode = "HCM_Q1", ProvinceCode = "HCM", DistrictName = "Quận 1", IsActive = true },
    ];

    private readonly AddressResolutionService service = new();

    [Fact]
    public void Resolve_Tier1LandmarkGazetteer_ResolvesBachKhoaToHaiBaTrung()
    {
        var resolution = service.Resolve(
            "Tìm gia sư Toán lớp 9 gần ĐH Bách Khoa học phí 250k/buổi",
            teachingMode: "OFFLINE",
            SampleProvinces,
            SampleDistricts);

        Assert.Equal("HN", resolution.ProvinceCode);
        Assert.Equal("HN_HBT", resolution.DistrictCode);
        Assert.False(resolution.IsLocationAmbiguous);
    }

    [Fact]
    public void Resolve_Tier2FuzzyMatchingWithoutDiacritics_ResolvesCauGiay()
    {
        var resolution = service.Resolve(
            "Tim gia su Tieng Anh lop 8 tai quan cau giay ha noi",
            teachingMode: "OFFLINE",
            SampleProvinces,
            SampleDistricts);

        Assert.Equal("HN", resolution.ProvinceCode);
        Assert.Equal("HN_CG", resolution.DistrictCode);
        Assert.False(resolution.IsLocationAmbiguous);
    }

    [Fact]
    public void Resolve_Tier3ProvinceOnlyWithoutDistrict_MarksLocationAmbiguousTrue()
    {
        var resolution = service.Resolve(
            "Cần tìm gia sư Hóa lớp 11 tại Hà Nội gần ngõ nhỏ",
            teachingMode: "OFFLINE",
            SampleProvinces,
            SampleDistricts);

        Assert.Equal("HN", resolution.ProvinceCode);
        Assert.Null(resolution.DistrictCode);
        Assert.True(resolution.IsLocationAmbiguous);
    }

    [Fact]
    public void Resolve_OnlineModeWithoutLocation_IsNotMarkedAmbiguous()
    {
        var resolution = service.Resolve(
            "Cần tìm gia sư Tiếng Anh lớp 10 học online qua Zoom",
            teachingMode: "ONLINE",
            SampleProvinces,
            SampleDistricts);

        Assert.False(resolution.IsLocationAmbiguous);
    }
}
