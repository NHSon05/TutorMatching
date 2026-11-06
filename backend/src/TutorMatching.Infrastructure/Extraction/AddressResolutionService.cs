using TutorMatching.Domain.Locations;

namespace TutorMatching.Infrastructure.Extraction;

public sealed record AddressResolutionResult(
    string? ProvinceCode,
    string? ProvinceName,
    string? DistrictCode,
    string? DistrictName,
    string? RawAddress,
    bool IsLocationAmbiguous);

public sealed class AddressResolutionService
{
    private static readonly (string ProvinceCode, string ProvinceName, string[] Aliases)[] ProvinceAliases =
    [
        ("HN", "Hà Nội", ["ha noi", "tp ha noi", "hanoi"]),
        ("HCM", "TP. Hồ Chí Minh", ["ho chi minh", "tp ho chi minh", "tphcm", "tp hcm", "sai gon", "saigon"]),
        ("DN", "Đà Nẵng", ["da nang", "tp da nang"]),
        ("HP", "Hải Phòng", ["hai phong", "tp hai phong"]),
        ("CT", "Cần Thơ", ["can tho", "tp can tho"]),
    ];

    public AddressResolutionResult Resolve(
        string? rawText,
        string teachingMode,
        IReadOnlyList<Province> provinces,
        IReadOnlyList<District> districts)
    {
        var isOnline = string.Equals(teachingMode, "ONLINE", StringComparison.OrdinalIgnoreCase);
        if (string.IsNullOrWhiteSpace(rawText))
        {
            return new AddressResolutionResult(
                ProvinceCode: null,
                ProvinceName: null,
                DistrictCode: null,
                DistrictName: null,
                RawAddress: null,
                IsLocationAmbiguous: !isOnline);
        }

        // Tier 1: Vietnam Landmark Gazetteer Lookup
        if (VietnamLandmarkGazetteer.TryResolve(rawText, out var landmark) && landmark is not null)
        {
            var matchedDistrict = districts.FirstOrDefault(d =>
                string.Equals(d.DistrictCode, landmark.DistrictCode, StringComparison.OrdinalIgnoreCase) ||
                NormalizeAdminPrefix(d.DistrictName) == NormalizeAdminPrefix(landmark.DistrictName));

            var matchedProvince = provinces.FirstOrDefault(p =>
                string.Equals(p.ProvinceCode, matchedDistrict?.ProvinceCode ?? landmark.ProvinceCode, StringComparison.OrdinalIgnoreCase));

            return new AddressResolutionResult(
                ProvinceCode: matchedProvince?.ProvinceCode ?? matchedDistrict?.ProvinceCode ?? landmark.ProvinceCode,
                ProvinceName: matchedProvince?.ProvinceName ?? landmark.ProvinceName,
                DistrictCode: matchedDistrict?.DistrictCode ?? landmark.DistrictCode,
                DistrictName: matchedDistrict?.DistrictName ?? landmark.DistrictName,
                RawAddress: landmark.Keyword,
                IsLocationAmbiguous: false);
        }

        var normalizedInput = VietnamLandmarkGazetteer.RemoveDiacritics(rawText);

        // Tier 2: Direct & Fuzzy District Matching against catalog Districts
        District? resolvedDistrict = null;
        foreach (var district in districts)
        {
            var bareDistrictName = NormalizeAdminPrefix(district.DistrictName);
            if (string.IsNullOrEmpty(bareDistrictName))
            {
                continue;
            }

            var fullNormalized = VietnamLandmarkGazetteer.RemoveDiacritics(district.DistrictName);
            if (normalizedInput.Contains(fullNormalized, StringComparison.Ordinal) ||
                (bareDistrictName.Length >= 4 && normalizedInput.Contains(bareDistrictName, StringComparison.Ordinal)))
            {
                resolvedDistrict = district;
                break;
            }
        }

        // Resolve Province from District or from text aliases
        Province? resolvedProvince = null;
        if (resolvedDistrict is not null)
        {
            resolvedProvince = provinces.FirstOrDefault(p =>
                string.Equals(p.ProvinceCode, resolvedDistrict.ProvinceCode, StringComparison.OrdinalIgnoreCase));
        }

        if (resolvedProvince is null)
        {
            foreach (var province in provinces)
            {
                var bareProvince = NormalizeAdminPrefix(province.ProvinceName);
                if (!string.IsNullOrEmpty(bareProvince) &&
                    normalizedInput.Contains(bareProvince, StringComparison.Ordinal))
                {
                    resolvedProvince = province;
                    break;
                }
            }
        }

        string? fallbackProvinceCode = resolvedProvince?.ProvinceCode ?? resolvedDistrict?.ProvinceCode;
        string? fallbackProvinceName = resolvedProvince?.ProvinceName;

        if (fallbackProvinceCode is null)
        {
            foreach (var (code, name, aliases) in ProvinceAliases)
            {
                if (aliases.Any(a => normalizedInput.Contains(a, StringComparison.Ordinal)))
                {
                    var catProvince = provinces.FirstOrDefault(p =>
                        string.Equals(p.ProvinceCode, code, StringComparison.OrdinalIgnoreCase) ||
                        NormalizeAdminPrefix(p.ProvinceName) == NormalizeAdminPrefix(name));
                    fallbackProvinceCode = catProvince?.ProvinceCode ?? code;
                    fallbackProvinceName = catProvince?.ProvinceName ?? name;
                    break;
                }
            }
        }

        // Tier 3: Fallback & Ambiguity Flagging
        var isAmbiguous = !isOnline && resolvedDistrict is null;

        return new AddressResolutionResult(
            ProvinceCode: fallbackProvinceCode,
            ProvinceName: fallbackProvinceName,
            DistrictCode: resolvedDistrict?.DistrictCode,
            DistrictName: resolvedDistrict?.DistrictName,
            RawAddress: rawText.Trim(),
            IsLocationAmbiguous: isAmbiguous);
    }

    private static string NormalizeAdminPrefix(string name)
    {
        var normalized = VietnamLandmarkGazetteer.RemoveDiacritics(name);
        string[] prefixes = ["quan ", "huyen ", "thi xa ", "tp. ", "tp ", "thanh pho ", "tinh "];
        foreach (var prefix in prefixes)
        {
            if (normalized.StartsWith(prefix, StringComparison.Ordinal))
            {
                return normalized[prefix.Length..].Trim();
            }
        }

        return normalized;
    }
}
