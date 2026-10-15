using TutorMatching.Domain.Tutors;

namespace TutorMatching.Api.Contracts.Tutors;

public sealed record TutorListItemResponse(
    Guid Id,
    Guid UserId,
    string FullName,
    string Email,
    string? PhoneNumber,
    string? AvatarUrl,
    string Status,
    List<string> Subjects,
    List<string> Languages,
    List<string> TeachingLevels,
    string? EducationType,
    string? SchoolName,
    string? Degree,
    string? Specialization,
    int? YearOfStudy,
    string? Bio,
    int ExperienceYears,
    string? TeachingMethodology,
    string? AchievementsAndResults,
    int HourlyRateVnd,
    int? SessionRateVnd,
    int? MonthlyRateVnd,
    bool IsNegotiable,
    double Rating,
    List<TutorCertificationDto> Certifications,
    DateTimeOffset CreatedAt,
    DateTimeOffset? ApprovedAt);

public sealed record TutorQueryParameters(
    string? Search = null,
    string? Subject = null,
    string? City = null,
    string? Status = null,
    int? MinPrice = null,
    int? MaxPrice = null,
    int? Page = 1,
    int? PageSize = 50);

public sealed record PagedTutorsResponse(
    List<TutorListItemResponse> Items,
    int TotalCount,
    int Page,
    int PageSize);
