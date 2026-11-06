using System.Globalization;
using System.Text;

namespace TutorMatching.Infrastructure.Extraction;

public sealed record LandmarkResolution(
    string Keyword,
    string ProvinceCode,
    string ProvinceName,
    string DistrictCode,
    string DistrictName);

public static class VietnamLandmarkGazetteer
{
    private static readonly LandmarkResolution[] Landmarks =
    [
        // Hà Nội - Hai Bà Trưng
        new("đh bách khoa", "HN", "Hà Nội", "HN_HBT", "Quận Hai Bà Trưng"),
        new("đại học bách khoa", "HN", "Hà Nội", "HN_HBT", "Quận Hai Bà Trưng"),
        new("bách khoa", "HN", "Hà Nội", "HN_HBT", "Quận Hai Bà Trưng"),
        new("kinh tế quốc dân", "HN", "Hà Nội", "HN_HBT", "Quận Hai Bà Trưng"),
        new("đh xây dựng", "HN", "Hà Nội", "HN_HBT", "Quận Hai Bà Trưng"),
        new("bạch mai", "HN", "Hà Nội", "HN_HBT", "Quận Hai Bà Trưng"),
        new("times city", "HN", "Hà Nội", "HN_HBT", "Quận Hai Bà Trưng"),

        // Hà Nội - Cầu Giấy
        new("đhqg", "HN", "Hà Nội", "HN_CG", "Quận Cầu Giấy"),
        new("đại học quốc gia", "HN", "Hà Nội", "HN_CG", "Quận Cầu Giấy"),
        new("đh sư phạm", "HN", "Hà Nội", "HN_CG", "Quận Cầu Giấy"),
        new("xuân thủy", "HN", "Hà Nội", "HN_CG", "Quận Cầu Giấy"),
        new("duy tân", "HN", "Hà Nội", "HN_CG", "Quận Cầu Giấy"),
        new("trung hòa nhân chính", "HN", "Hà Nội", "HN_CG", "Quận Cầu Giấy"),

        // Hà Nội - Nam Từ Liêm
        new("keangnam", "HN", "Hà Nội", "HN_NTL", "Quận Nam Từ Liêm"),
        new("mỹ đình", "HN", "Hà Nội", "HN_NTL", "Quận Nam Từ Liêm"),
        new("vinhomes smart city", "HN", "Hà Nội", "HN_NTL", "Quận Nam Từ Liêm"),
        new("phùng khoang", "HN", "Hà Nội", "HN_NTL", "Quận Nam Từ Liêm"),

        // Hà Nội - Tây Hồ
        new("ciputra", "HN", "Hà Nội", "HN_TH", "Quận Tây Hồ"),
        new("hồ tây", "HN", "Hà Nội", "HN_TH", "Quận Tây Hồ"),

        // Hà Nội - Đống Đa
        new("chùa láng", "HN", "Hà Nội", "HN_DD", "Quận Đống Đa"),
        new("ngã tư sở", "HN", "Hà Nội", "HN_DD", "Quận Đống Đa"),
        new("đh ngoại thương", "HN", "Hà Nội", "HN_DD", "Quận Đống Đa"),
        new("học viện ngân hàng", "HN", "Hà Nội", "HN_DD", "Quận Đống Đa"),

        // Hà Nội - Thanh Xuân
        new("royal city", "HN", "Hà Nội", "HN_TX", "Quận Thanh Xuân"),
        new("nguyễn trãi", "HN", "Hà Nội", "HN_TX", "Quận Thanh Xuân"),

        // TP. Hồ Chí Minh
        new("vinhomes central park", "HCM", "TP. Hồ Chí Minh", "HCM_BT", "Quận Bình Thạnh"),
        new("landmark 81", "HCM", "TP. Hồ Chí Minh", "HCM_BT", "Quận Bình Thạnh"),
        new("làng đại học thủ đức", "HCM", "TP. Hồ Chí Minh", "HCM_TD", "TP. Thủ Đức"),
        new("thảo điền", "HCM", "TP. Hồ Chí Minh", "HCM_TD", "TP. Thủ Đức"),
        new("phú mỹ hưng", "HCM", "TP. Hồ Chí Minh", "HCM_Q7", "Quận 7"),
    ];

    public static bool TryResolve(string? rawText, out LandmarkResolution? resolution)
    {
        resolution = null;
        if (string.IsNullOrWhiteSpace(rawText))
        {
            return false;
        }

        var normalizedInput = RemoveDiacritics(rawText);

        foreach (var landmark in Landmarks)
        {
            var normalizedKeyword = RemoveDiacritics(landmark.Keyword);
            if (normalizedInput.Contains(normalizedKeyword, StringComparison.Ordinal))
            {
                resolution = landmark;
                return true;
            }
        }

        return false;
    }

    internal static string RemoveDiacritics(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return string.Empty;
        }

        var decomposed = text
            .Trim()
            .ToLowerInvariant()
            .Replace('đ', 'd')
            .Normalize(NormalizationForm.FormD);

        var sb = new StringBuilder(decomposed.Length);
        foreach (var ch in decomposed)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(ch) != UnicodeCategory.NonSpacingMark)
            {
                sb.Append(ch);
            }
        }

        return sb.ToString().Normalize(NormalizationForm.FormC);
    }
}
