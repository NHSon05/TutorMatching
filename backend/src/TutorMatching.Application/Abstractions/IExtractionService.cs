using TutorMatching.Domain.Catalog;
using TutorMatching.Domain.Locations;

namespace TutorMatching.Application.Abstractions;

public sealed record LlmExtractionPayload(
    string? SubjectName,
    int? GradeLevel,
    int? TuitionFeeVnd,
    string? FeePeriod,
    bool? IsFeeNegotiable,
    int? SessionsPerWeek,
    string? TeachingMode,
    string? AddressText,
    string? ScheduleNotes,
    decimal ConfidenceScore);

public sealed record ExtractedDemandCriteriaDto(
    Guid? SubjectId,
    string? SubjectNameRaw,
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
    string? ScheduleNotes,
    decimal ConfidenceScore,
    string ExtractedJson,
    bool UsedFallback,
    bool IsRejected);

public interface ILlmEntityExtractor
{
    Task<LlmExtractionPayload?> TryExtractAsync(
        string rawContent,
        CancellationToken cancellationToken = default);
}

public interface IExtractionService
{
    Task<ExtractedDemandCriteriaDto> ExtractAsync(
        string rawContent,
        IReadOnlyList<Subject> catalogSubjects,
        IReadOnlyList<Province> catalogProvinces,
        IReadOnlyList<District> catalogDistricts,
        CancellationToken cancellationToken = default);
}
