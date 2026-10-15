using System.Text.Json.Serialization;
using TutorMatching.Domain.Tutors;

namespace TutorMatching.Api.Contracts.Tutors;

public sealed record TutorCertificationDto(
    string Name,
    string Issuer,
    int? IssueYear,
    string FileUrl);

public sealed record TutorAboutDto(
    string? FullName,
    DateOnly? DateOfBirth,
    string? PhoneNumber,
    List<string>? Subjects,
    List<string>? Languages,
    List<string>? TeachingLevels);

public sealed record TutorEducationDto(
    string? EducationType,
    string? SchoolName,
    string? Degree,
    string? Specialization,
    int? YearOfStudy);

public sealed record TutorDescriptionDto(
    string? Bio,
    int? ExperienceYears,
    string? TeachingMethodology,
    string? AchievementsAndResults);

public sealed record TutorPricingDto(
    int? HourlyRateVnd,
    int? SessionRateVnd,
    int? MonthlyRateVnd,
    bool IsNegotiable);

public sealed record TutorOnboardingResponse(
    [property: JsonConverter(typeof(JsonStringEnumConverter<TutorProfileStatus>))]
    TutorProfileStatus Status,
    int CurrentStep,
    TutorAboutDto About,
    string? AvatarUrl,
    bool HasCertifications,
    List<TutorCertificationDto> Certifications,
    TutorEducationDto Education,
    TutorDescriptionDto Description,
    TutorPricingDto Pricing,
    DateTimeOffset? SubmittedAt,
    DateTimeOffset? ApprovedAt);

public sealed record SaveOnboardingDraftRequest(
    int? CurrentStep,
    TutorAboutDto? About,
    string? AvatarUrl,
    bool? HasCertifications,
    List<TutorCertificationDto>? Certifications,
    TutorEducationDto? Education,
    TutorDescriptionDto? Description,
    TutorPricingDto? Pricing);

public sealed record UploadFileResponse(
    string FileUrl,
    string FileName);

public sealed record SubmitOnboardingResponse(
    [property: JsonConverter(typeof(JsonStringEnumConverter<TutorProfileStatus>))]
    TutorProfileStatus Status,
    DateTimeOffset SubmittedAt,
    string Message);
