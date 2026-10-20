using TutorMatching.Domain.Catalog;

namespace TutorMatching.Domain.Tutors;

public sealed class TutorSubject
{
    public Guid TutorProfileId { get; set; }
    public Guid SubjectId { get; set; }
    public string? LevelDescription { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public TutorProfile? TutorProfile { get; set; }
    public Subject? Subject { get; set; }
}
