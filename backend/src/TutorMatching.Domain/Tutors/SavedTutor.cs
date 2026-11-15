namespace TutorMatching.Domain.Tutors;

/// <summary>A learner's bookmark of a public tutor profile. One row per (user, profile).</summary>
public sealed class SavedTutor
{
    public Guid UserId { get; set; }
    public Guid TutorProfileId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
