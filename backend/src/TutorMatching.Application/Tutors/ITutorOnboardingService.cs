using TutorMatching.Application.Abstractions;
using TutorMatching.Domain.Tutors;

namespace TutorMatching.Application.Tutors;
public sealed record TutorSubjectSelection(Guid SubjectId, List<string> LevelCodes);
public sealed record TutorDiscoveryData(List<TutorSubjectSelection>? Subjects, List<string>? TeachingModes, string? ProvinceCode, string? DistrictCode);

public sealed record TutorCertificationData(
    string Name,
    string Issuer,
    int? IssueYear,
    string FileUrl);

public sealed record TutorAboutData(
    string? FullName,
    DateOnly? DateOfBirth,
    string? PhoneNumber,
    List<string>? Subjects,
    List<string>? Languages,
    List<string>? TeachingLevels);

public sealed record TutorEducationData(
    string? EducationType,
    string? SchoolName,
    string? Degree,
    string? Specialization,
    int? YearOfStudy);

public sealed record TutorDescriptionData(
    string? Bio,
    int? ExperienceYears,
    string? TeachingMethodology,
    string? AchievementsAndResults);

public sealed record TutorPricingData(
    int? HourlyRateVnd,
    int? SessionRateVnd,
    int? MonthlyRateVnd,
    bool IsNegotiable);

public sealed record TutorOnboardingData(
    TutorProfileStatus Status,
    int CurrentStep,
    TutorAboutData About,
    string? AvatarUrl,
    bool HasCertifications,
    List<TutorCertificationData> Certifications,
    TutorEducationData Education,
    TutorDescriptionData Description,
    TutorPricingData Pricing,
    DateTimeOffset? SubmittedAt,
    DateTimeOffset? ApprovedAt,
    Guid Version, TutorDiscoveryData? Discovery = null);

public sealed record SaveDraftCommand(
    int? CurrentStep,
    TutorAboutData? About,
    string? AvatarUrl,
    bool? HasCertifications,
    List<TutorCertificationData>? Certifications,
    TutorEducationData? Education,
    TutorDescriptionData? Description,
    TutorPricingData? Pricing,
    Guid? ExpectedVersion = null, TutorDiscoveryData? Discovery = null);

public sealed record SubmitResult(
    bool Succeeded,
    TutorProfileStatus? Status = null,
    DateTimeOffset? SubmittedAt = null,
    IReadOnlyDictionary<string, string[]>? Errors = null, bool Conflict = false)
{
    public static SubmitResult Success(TutorProfileStatus status, DateTimeOffset submittedAt) =>
        new(true, status, submittedAt);

    public static SubmitResult Fail(IReadOnlyDictionary<string, string[]> errors) =>
        new(false, Errors: errors);
}

public sealed record SaveDraftResult(
    bool Succeeded,
    TutorOnboardingData? Data = null,
    AccountFailure? Failure = null,
    IReadOnlyDictionary<string, string[]>? Errors = null)
{
    public static SaveDraftResult Success(TutorOnboardingData data) =>
        new(true, data);

    public static SaveDraftResult Fail(AccountFailure failure, IReadOnlyDictionary<string, string[]>? errors = null) =>
        new(false, null, failure, errors);
}

public interface ITutorOnboardingService
{
    Task<TutorOnboardingData?> GetOnboardingAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<SaveDraftResult> SaveDraftAsync(Guid userId, SaveDraftCommand command, CancellationToken cancellationToken = default);
    Task<SubmitResult> SubmitAsync(Guid userId, CancellationToken cancellationToken = default, Guid? expectedVersion = null);
    Task<string> UpdateAvatarAsync(Guid userId, string avatarUrl, CancellationToken cancellationToken = default);
}
