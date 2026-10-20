using TutorMatching.Domain.Catalog;
using TutorMatching.Domain.Tutors;

namespace TutorMatching.Domain.Courses;

public sealed class Course
{
    public Guid Id { get; set; }
    public Guid TutorProfileId { get; set; }
    public Guid SubjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? SessionCount { get; set; }
    public int? PricePerSessionVnd { get; set; }
    public string StatusCode { get; set; } = "ACTIVE";
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }

    public TutorProfile? TutorProfile { get; set; }
    public Subject? Subject { get; set; }
}
