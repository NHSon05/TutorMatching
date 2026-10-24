using TutorMatching.Domain.Tutors;
namespace TutorMatching.Application.Tutors;

public sealed record TutorSearchCriteria(string? Name, Guid[] SubjectIds, string[] LevelCodes, string? Qualification,
    int? MinPrice, int? MaxPrice, string[] Modes, string? ProvinceCode, string? DistrictCode,
    int? SessionsPerWeek, int? DurationMinutes, IReadOnlyList<WeeklyWindow> Windows, string Sort, int Page, int PageSize)
{
    public bool IsValid => Page >= 1 && PageSize is >= 1 and <= 100 && (long)(Page - 1) * PageSize <= int.MaxValue &&
        Sort is "newest" or "priceAsc" or "priceDesc" && MinPrice is not <= 0 && MaxPrice is not <= 0 &&
        !(MinPrice.HasValue && MaxPrice.HasValue && MinPrice > MaxPrice) &&
        Modes.All(x => x is "ONLINE" or "OFFLINE" or "HYBRID") &&
        (!Modes.Any(x => x is "OFFLINE" or "HYBRID") || (!string.IsNullOrWhiteSpace(ProvinceCode) && !string.IsNullOrWhiteSpace(DistrictCode))) &&
        (DistrictCode is null || ProvinceCode is not null) &&
        (Name?.Length ?? 0) <= 100 && (Qualification?.Length ?? 0) <= 200 &&
        SubjectIds.Length <= 50 && !SubjectIds.Contains(Guid.Empty) && LevelCodes.Length <= 50 && Modes.Length <= 3 &&
        LevelCodes.All(x => !string.IsNullOrWhiteSpace(x) && x.Length <= 32) &&
        (ProvinceCode?.Length ?? 0) <= 32 && (DistrictCode?.Length ?? 0) <= 32 &&
        ((SessionsPerWeek is null && DurationMinutes is null && Windows.Count == 0) ||
         (SessionsPerWeek is >= 1 and <= 21 && DurationMinutes is >= 30 and <= 240 && Windows.Count is >= 1 and <= 50 && Windows.All(WeeklyAvailability.Valid)));
}
public sealed record PublicSubject(Guid SubjectId, string Name, IReadOnlyList<string> LevelCodes, IReadOnlyList<string> LevelNames);
public sealed record PublicTutorSummary(Guid Id, string DisplayName, string? AvatarUrl, string? Bio, string? Qualification,
    string? SchoolName, string? Specialization, int? ExperienceYears, string? TeachingMethodology, string? Achievements,
    int SessionRateVnd, IReadOnlyList<string> TeachingModes, string? ProvinceCode, string? ProvinceName,
    string? DistrictCode, string? DistrictName, IReadOnlyList<PublicSubject> Subjects, DateTimeOffset? ApprovedAt);
public sealed record PublicTutorPage(IReadOnlyList<PublicTutorSummary> Items, int TotalCount, int Page, int PageSize);
public sealed record PublicAvailability(Guid Id, int DayOfWeek, string StartTime, string EndTime, string TimeZone);
public sealed record PublicCourse(Guid Id, Guid SubjectId, string SubjectName, string Name, string? Content, int SessionCount, int PricePerSessionVnd);
public sealed record PublicTutorDetail(Guid Id, string DisplayName, string? AvatarUrl, string? Bio, string? Qualification,
    string? SchoolName, string? Specialization, int? ExperienceYears, string? TeachingMethodology, string? Achievements,
    int SessionRateVnd, IReadOnlyList<string> TeachingModes, string? ProvinceCode, string? ProvinceName,
    string? DistrictCode, string? DistrictName, IReadOnlyList<PublicSubject> Subjects, DateTimeOffset? ApprovedAt,
    IReadOnlyList<PublicAvailability> Availability, IReadOnlyList<PublicCourse> Courses);
public interface IPublicTutorService
{
    Task<PublicTutorDetail?> FindAsync(Guid profileId, CancellationToken ct);
    Task<PublicTutorPage> SearchAsync(TutorSearchCriteria criteria, CancellationToken ct);
}
