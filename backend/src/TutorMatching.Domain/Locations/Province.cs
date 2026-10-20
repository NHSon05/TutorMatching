namespace TutorMatching.Domain.Locations;

public sealed class Province
{
    public string ProvinceCode { get; set; } = string.Empty;
    public string ProvinceName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public ICollection<District> Districts { get; set; } = [];
}
