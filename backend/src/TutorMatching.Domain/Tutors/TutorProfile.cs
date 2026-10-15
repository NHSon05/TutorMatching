namespace TutorMatching.Domain.Tutors;

public sealed class TutorProfile
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    public TutorProfileStatus Status { get; set; } = TutorProfileStatus.DRAFT;
    public int CurrentStep { get; set; } = 1;

    // Step 1: About (Subjects, Languages, Levels)
    public List<string> Subjects { get; set; } = [];
    public List<string> Languages { get; set; } = [];
    public List<string> TeachingLevels { get; set; } = [];

    // Step 2: Profile photo
    public string? AvatarUrl { get; set; }

    // Step 3: Certifications
    public bool HasCertifications { get; set; }
    public List<TutorCertification> Certifications { get; set; } = [];

    // Step 4: Education
    public string? EducationType { get; set; } // "GRADUATED", "STUDYING", "NO_DEGREE"
    public string? SchoolName { get; set; }
    public string? Degree { get; set; }
    public string? Specialization { get; set; }
    public int? YearOfStudy { get; set; }

    // Step 5: Description
    public string? Bio { get; set; }
    public int? ExperienceYears { get; set; }
    public string? TeachingMethodology { get; set; }
    public string? AchievementsAndResults { get; set; }

    // Step 6: Pricing
    public int? HourlyRateVnd { get; set; }
    public int? SessionRateVnd { get; set; }
    public int? MonthlyRateVnd { get; set; }
    public bool IsNegotiable { get; set; } = true;

    // Timestamps
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset? SubmittedAt { get; set; }
    public DateTimeOffset? ApprovedAt { get; set; }
}
