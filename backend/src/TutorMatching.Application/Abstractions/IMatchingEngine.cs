using TutorMatching.Domain.Catalog;
using TutorMatching.Domain.Content;
using TutorMatching.Domain.Locations;
using TutorMatching.Domain.Notifications;
using TutorMatching.Domain.Tutors;
using TutorMatching.Domain.Users;

namespace TutorMatching.Application.Abstractions;

public sealed record PublicTutorCandidate(
    Guid TutorProfileId,
    string DisplayName,
    string? AvatarUrl,
    string? Headline,
    TutorProfileStatus ProfileStatus,
    AccountStatus AccountStatus,
    IReadOnlyList<Guid> SubjectIds,
    IReadOnlyList<string> SubjectNames,
    IReadOnlyList<string> TeachingLevels,
    int ListedPriceVnd,
    bool IsNegotiable,
    IReadOnlyList<string> TeachingModes,
    string? ProvinceCode,
    string? ProvinceName,
    string? DistrictCode,
    string? DistrictName,
    string? SchoolName = null,
    string? Degree = null,
    string? Specialization = null,
    string? EducationType = null,
    string? Bio = null,
    int? ExperienceYears = null,
    string? TeachingMethodology = null,
    string? AchievementsAndResults = null,
    int? HourlyRateVnd = null,
    int? SessionRateVnd = null,
    int? MonthlyRateVnd = null);

public sealed record MatchedTutorCardDto(
    Guid TutorProfileId,
    string DisplayName,
    string? AvatarUrl,
    string? Headline,
    int ListedPriceVnd,
    bool IsNegotiable,
    string TeachingModeCode,
    string? ProvinceName,
    string? DistrictName,
    IReadOnlyList<string> Subjects,
    decimal MatchScore,
    IReadOnlyList<string> MatchHighlights,
    string? SchoolName = null,
    string? Degree = null,
    string? Specialization = null,
    string? EducationType = null,
    string? Bio = null,
    int? ExperienceYears = null,
    string? TeachingMethodology = null,
    string? AchievementsAndResults = null,
    int? HourlyRateVnd = null,
    int? SessionRateVnd = null,
    int? MonthlyRateVnd = null,
    IReadOnlyList<string>? TeachingModes = null);

public sealed record MatchedTutorSubscriptionDto(
    Guid TutorProfileId,
    decimal MatchScore);

public interface IMatchingEngine
{
    IReadOnlyList<MatchedTutorCardDto> MatchPublicTutors(
        ExtractedDemandCriteriaDto criteria,
        IReadOnlyList<PublicTutorCandidate> candidates,
        int maxResults = 12);

    IReadOnlyList<MatchedTutorSubscriptionDto> MatchTutorProfiles(
        ExtractedDemandCriteriaDto criteria,
        IReadOnlyList<TutorMatchingProfile> profiles);
}

public sealed record SubmitTutorDemandResponseDto(
    Guid DemandPostId,
    bool IsDeduplicatedHit,
    ExtractedDemandSummaryDto ExtractedCriteria,
    IReadOnlyList<MatchedTutorCardDto> MatchedTutors);

public sealed record ExtractedDemandSummaryDto(
    Guid? SubjectId,
    string? SubjectName,
    int? GradeLevel,
    int TuitionFeeVnd,
    string FeePeriod,
    bool IsFeeNegotiable,
    int? SessionsPerWeek,
    string TeachingMode,
    string? ProvinceCode,
    string? ProvinceName,
    string? DistrictCode,
    string? DistrictName,
    string? RawAddress,
    bool IsLocationAmbiguous,
    decimal ConfidenceScore);

public sealed record TutorMatchingProfileDto(
    Guid Id,
    IReadOnlyList<Guid> PreferredSubjects,
    IReadOnlyList<int> PreferredGrades,
    int MinTuitionFeeVnd,
    int? MaxTuitionFeeVnd,
    string? PreferredProvinceCode,
    IReadOnlyList<string> PreferredDistrictCodes,
    bool ReceiveAllDistricts,
    IReadOnlyList<string> TeachingModes,
    bool IsActive);

public sealed record UpdateTutorMatchingProfileCommand(
    IReadOnlyList<Guid> PreferredSubjects,
    IReadOnlyList<int> PreferredGrades,
    int MinTuitionFeeVnd,
    int? MaxTuitionFeeVnd,
    string? PreferredProvinceCode,
    IReadOnlyList<string> PreferredDistrictCodes,
    bool ReceiveAllDistricts,
    IReadOnlyList<string> TeachingModes,
    bool IsActive);

public sealed record MatchedPostNotificationItemDto(
    Guid NotificationId,
    Guid DemandPostId,
    string SubjectName,
    int GradeLevel,
    int TuitionFeeVnd,
    string FeePeriod,
    string TeachingMode,
    string ProvinceName,
    string? DistrictName,
    string? RawAddress,
    string RawContent,
    bool IsLocationAmbiguous,
    decimal MatchScore,
    DateTimeOffset CreatedAt,
    bool IsRead);

public sealed record PaginatedMatchedPostsDto(
    IReadOnlyList<MatchedPostNotificationItemDto> Items,
    int TotalCount,
    int Page,
    int PageSize);

public interface IDemandMatchingStore
{
    Task<(IReadOnlyList<Subject> Subjects, IReadOnlyList<Province> Provinces, IReadOnlyList<District> Districts)> LoadCatalogAsync(
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<PublicTutorCandidate>> LoadPublicTutorCandidatesAsync(
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<TutorMatchingProfile>> LoadActiveTutorMatchingProfilesAsync(
        CancellationToken cancellationToken = default);

    Task SaveDemandAndNotificationsAsync(
        DemandPost post,
        ExtractedDemandDetail? detail,
        IReadOnlyList<PostMatchNotification> notifications,
        CancellationToken cancellationToken = default);

    Task<Guid?> GetApprovedTutorProfileIdForUserAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<TutorMatchingProfileDto> GetOrCreateTutorMatchingProfileAsync(
        Guid tutorProfileId,
        CancellationToken cancellationToken = default);

    Task<TutorMatchingProfileDto> UpsertTutorMatchingProfileAsync(
        Guid tutorProfileId,
        UpdateTutorMatchingProfileCommand command,
        CancellationToken cancellationToken = default);

    Task<PaginatedMatchedPostsDto> GetMatchedPostsForTutorAsync(
        Guid tutorProfileId,
        int page,
        int pageSize,
        bool unreadOnly,
        CancellationToken cancellationToken = default);

    /// <summary>Ranks non-expired demand details by cosine similarity of their stored embedding.</summary>
    Task<IReadOnlyList<SimilarDemandDetailDto>> FindSimilarDemandDetailsAsync(
        float[] queryVector,
        int topK,
        CancellationToken cancellationToken = default);
}
