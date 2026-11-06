using TutorMatching.Domain.Catalog;
using TutorMatching.Domain.Locations;

namespace TutorMatching.Domain.Content;

public sealed class ExtractedDemandDetail
{
    private static readonly HashSet<string> ValidFeePeriods = new(StringComparer.Ordinal)
    {
        "PER_SESSION",
        "PER_MONTH",
        "TOTAL",
    };

    private static readonly HashSet<string> ValidTeachingModes = new(StringComparer.Ordinal)
    {
        "ONLINE",
        "OFFLINE",
        "HYBRID",
    };

    public Guid Id { get; set; }
    public Guid DemandPostId { get; set; }
    public Guid? SubjectId { get; set; }
    public string? SubjectNameRaw { get; set; }
    public int? GradeLevel { get; set; }
    public int TuitionFeeVnd { get; set; }
    public string FeePeriod { get; set; } = "PER_SESSION";
    public bool IsFeeNegotiable { get; set; }
    public int? SessionsPerWeek { get; set; }
    public string TeachingMode { get; set; } = "OFFLINE";
    public string? ProvinceCode { get; set; }
    public string? DistrictCode { get; set; }
    public string? RawAddress { get; set; }
    public bool IsLocationAmbiguous { get; set; }
    public string? ScheduleNotes { get; set; }
    public decimal ConfidenceScore { get; set; }
    public string ExtractedJson { get; set; } = "{}";
    public List<float>? Embedding { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public DemandPost? DemandPost { get; set; }
    public Subject? Subject { get; set; }
    public Province? Province { get; set; }
    public District? District { get; set; }

    public static ExtractedDemandDetail Create(
        Guid demandPostId,
        Guid? subjectId,
        string? subjectNameRaw,
        int? gradeLevel,
        int tuitionFeeVnd,
        string feePeriod,
        bool isFeeNegotiable,
        int? sessionsPerWeek,
        string teachingMode,
        string? provinceCode,
        string? districtCode,
        string? rawAddress,
        bool isLocationAmbiguous,
        string? scheduleNotes,
        decimal confidenceScore,
        string extractedJson,
        List<float>? embedding = null,
        DateTimeOffset? now = null)
    {
        if (demandPostId == Guid.Empty)
        {
            throw new ArgumentException("DemandPostId cannot be empty.", nameof(demandPostId));
        }

        if (gradeLevel.HasValue && (gradeLevel.Value < 1 || gradeLevel.Value > 12))
        {
            throw new ArgumentOutOfRangeException(nameof(gradeLevel), "Grade level must be between 1 and 12.");
        }

        if (tuitionFeeVnd < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(tuitionFeeVnd), "Tuition fee must be non-negative.");
        }

        if (sessionsPerWeek.HasValue && (sessionsPerWeek.Value < 1 || sessionsPerWeek.Value > 21))
        {
            throw new ArgumentOutOfRangeException(nameof(sessionsPerWeek), "Sessions per week must be between 1 and 21.");
        }

        if (confidenceScore < 0.00m || confidenceScore > 1.00m)
        {
            throw new ArgumentOutOfRangeException(nameof(confidenceScore), "Confidence score must be between 0.00 and 1.00.");
        }

        var normalizedFeePeriod = string.IsNullOrWhiteSpace(feePeriod) ? "PER_SESSION" : feePeriod.Trim().ToUpperInvariant();
        if (!ValidFeePeriods.Contains(normalizedFeePeriod))
        {
            throw new ArgumentException($"Invalid fee period '{feePeriod}'.", nameof(feePeriod));
        }

        var normalizedMode = string.IsNullOrWhiteSpace(teachingMode) ? "OFFLINE" : teachingMode.Trim().ToUpperInvariant();
        if (!ValidTeachingModes.Contains(normalizedMode))
        {
            throw new ArgumentException($"Invalid teaching mode '{teachingMode}'.", nameof(teachingMode));
        }

        var resolvedDistrictCode = string.IsNullOrWhiteSpace(districtCode) ? null : districtCode.Trim();
        var locationAmbiguous = isLocationAmbiguous || (normalizedMode != "ONLINE" && resolvedDistrictCode is null);

        return new ExtractedDemandDetail
        {
            Id = Guid.NewGuid(),
            DemandPostId = demandPostId,
            SubjectId = subjectId,
            SubjectNameRaw = string.IsNullOrWhiteSpace(subjectNameRaw) ? null : subjectNameRaw.Trim(),
            GradeLevel = gradeLevel,
            TuitionFeeVnd = tuitionFeeVnd,
            FeePeriod = normalizedFeePeriod,
            IsFeeNegotiable = isFeeNegotiable,
            SessionsPerWeek = sessionsPerWeek,
            TeachingMode = normalizedMode,
            ProvinceCode = string.IsNullOrWhiteSpace(provinceCode) ? null : provinceCode.Trim(),
            DistrictCode = resolvedDistrictCode,
            RawAddress = string.IsNullOrWhiteSpace(rawAddress) ? null : rawAddress.Trim(),
            IsLocationAmbiguous = locationAmbiguous,
            ScheduleNotes = string.IsNullOrWhiteSpace(scheduleNotes) ? null : scheduleNotes.Trim(),
            ConfidenceScore = decimal.Round(confidenceScore, 2, MidpointRounding.AwayFromZero),
            ExtractedJson = string.IsNullOrWhiteSpace(extractedJson) ? "{}" : extractedJson,
            Embedding = embedding,
            CreatedAt = now ?? DateTimeOffset.UtcNow,
        };
    }
}
