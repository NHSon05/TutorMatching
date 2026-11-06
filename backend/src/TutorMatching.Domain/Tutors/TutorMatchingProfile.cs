using TutorMatching.Domain.Locations;

namespace TutorMatching.Domain.Tutors;

public sealed class TutorMatchingProfile
{
    private static readonly HashSet<string> ValidTeachingModes = new(StringComparer.Ordinal)
    {
        "ONLINE",
        "OFFLINE",
        "HYBRID",
    };

    public Guid Id { get; set; }
    public Guid TutorProfileId { get; set; }
    public List<Guid> PreferredSubjects { get; set; } = [];
    public List<int> PreferredGrades { get; set; } = [];
    public int MinTuitionFeeVnd { get; set; }
    public int? MaxTuitionFeeVnd { get; set; }
    public string? PreferredProvinceCode { get; set; }
    public List<string> PreferredDistrictCodes { get; set; } = [];
    public bool ReceiveAllDistricts { get; set; }
    public List<string> TeachingModes { get; set; } = ["OFFLINE", "ONLINE"];
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public TutorProfile? TutorProfile { get; set; }
    public Province? PreferredProvince { get; set; }

    public static TutorMatchingProfile Create(
        Guid tutorProfileId,
        IEnumerable<Guid>? preferredSubjects,
        IEnumerable<int>? preferredGrades,
        int minTuitionFeeVnd,
        int? maxTuitionFeeVnd,
        string? preferredProvinceCode,
        IEnumerable<string>? preferredDistrictCodes,
        bool receiveAllDistricts,
        IEnumerable<string>? teachingModes,
        bool isActive = true,
        DateTimeOffset? now = null)
    {
        if (tutorProfileId == Guid.Empty)
        {
            throw new ArgumentException("TutorProfileId cannot be empty.", nameof(tutorProfileId));
        }

        var profile = new TutorMatchingProfile
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfileId,
            CreatedAt = now ?? DateTimeOffset.UtcNow,
        };

        profile.Update(
            preferredSubjects,
            preferredGrades,
            minTuitionFeeVnd,
            maxTuitionFeeVnd,
            preferredProvinceCode,
            preferredDistrictCodes,
            receiveAllDistricts,
            teachingModes,
            isActive,
            now);

        return profile;
    }

    public void Update(
        IEnumerable<Guid>? preferredSubjects,
        IEnumerable<int>? preferredGrades,
        int minTuitionFeeVnd,
        int? maxTuitionFeeVnd,
        string? preferredProvinceCode,
        IEnumerable<string>? preferredDistrictCodes,
        bool receiveAllDistricts,
        IEnumerable<string>? teachingModes,
        bool isActive,
        DateTimeOffset? now = null)
    {
        if (minTuitionFeeVnd < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(minTuitionFeeVnd), "Minimum tuition fee cannot be negative.");
        }

        if (maxTuitionFeeVnd.HasValue && maxTuitionFeeVnd.Value < minTuitionFeeVnd)
        {
            throw new ArgumentOutOfRangeException(
                nameof(maxTuitionFeeVnd),
                "Maximum tuition fee must be greater than or equal to minimum tuition fee.");
        }

        var gradesList = (preferredGrades ?? []).Distinct().OrderBy(x => x).ToList();
        if (gradesList.Any(g => g < 1 || g > 12))
        {
            throw new ArgumentOutOfRangeException(nameof(preferredGrades), "All preferred grades must be between 1 and 12.");
        }

        var modesList = (teachingModes ?? ["OFFLINE", "ONLINE"])
            .Select(m => m?.Trim().ToUpperInvariant() ?? string.Empty)
            .Where(m => !string.IsNullOrEmpty(m))
            .Distinct(StringComparer.Ordinal)
            .ToList();

        if (modesList.Count == 0 || modesList.Any(m => !ValidTeachingModes.Contains(m)))
        {
            throw new ArgumentException("Teaching modes must only contain ONLINE, OFFLINE, or HYBRID.", nameof(teachingModes));
        }

        PreferredSubjects = (preferredSubjects ?? []).Where(id => id != Guid.Empty).Distinct().ToList();
        PreferredGrades = gradesList;
        MinTuitionFeeVnd = minTuitionFeeVnd;
        MaxTuitionFeeVnd = maxTuitionFeeVnd;
        PreferredProvinceCode = string.IsNullOrWhiteSpace(preferredProvinceCode) ? null : preferredProvinceCode.Trim();
        PreferredDistrictCodes = (preferredDistrictCodes ?? [])
            .Where(d => !string.IsNullOrWhiteSpace(d))
            .Select(d => d.Trim())
            .Distinct(StringComparer.Ordinal)
            .ToList();
        ReceiveAllDistricts = receiveAllDistricts;
        TeachingModes = modesList;
        IsActive = isActive;
        UpdatedAt = now ?? DateTimeOffset.UtcNow;
    }
}
