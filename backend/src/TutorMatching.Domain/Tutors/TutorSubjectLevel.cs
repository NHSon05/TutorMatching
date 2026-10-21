namespace TutorMatching.Domain.Tutors;
public sealed class TutorSubjectLevel
{
    public Guid TutorProfileId { get; set; }
    public Guid SubjectId { get; set; }
    public string LevelCode { get; set; } = string.Empty;
}
