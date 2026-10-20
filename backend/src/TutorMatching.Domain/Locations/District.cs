namespace TutorMatching.Domain.Locations;

public sealed class District
{
    public string DistrictCode { get; set; } = string.Empty;
    public string ProvinceCode { get; set; } = string.Empty;
    public string DistrictName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public Province? Province { get; set; }
}
