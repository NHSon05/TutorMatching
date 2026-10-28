using TutorMatching.Domain.Catalog;
using TutorMatching.Domain.Courses;
using TutorMatching.Domain.Locations;
using TutorMatching.Domain.Tutors;

namespace TutorMatching.Domain.Hiring;

public sealed class HireRequest
{
    public Guid Id { get; set; }
    public Guid Version { get; set; } = Guid.NewGuid();
    public bool IsLegacy { get; set; }
    public int? ListedPriceVnd { get; set; }
    public int LatestProposalSequence { get; set; }
    public int NextEventSequence { get; set; } = 1;
    public HireTerms InitialTerms { get; set; } = null!;
    public FinalAgreement? FinalAgreement { get; set; }
    public Guid RequesterUserId { get; set; }
    public Guid TutorProfileId { get; set; }
    public Guid SubjectId { get; set; }
    public Guid? CourseId { get; set; }
    public DateOnly StartDate { get; set; }
    public int SessionsPerWeek { get; set; }
    public int DurationMinutes { get; set; }
    public string TeachingModeCode { get; set; } = "ONLINE";
    public string? ProvinceCode { get; set; }
    public string? DistrictCode { get; set; }
    public string? LocationDetail { get; set; }
    public int ProposedPriceVnd { get; set; }
    public int? AgreedPriceVnd { get; set; }
    public string StatusCode { get; set; } = "PENDING";
    public string? Note { get; set; }
    public string? CancelReason { get; set; }
    public DateTimeOffset? AcceptedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public TutorProfile? TutorProfile { get; set; }
    public Subject? Subject { get; set; }
    public Course? Course { get; set; }
    public Province? Province { get; set; }
    public District? District { get; set; }

    public ICollection<RequestSchedule> Schedules { get; set; } = [];
    public ICollection<Negotiation> Negotiations { get; set; } = [];
    public ICollection<RequestStatusHistory> StatusHistories { get; set; } = [];
}
