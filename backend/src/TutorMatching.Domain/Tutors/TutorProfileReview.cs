namespace TutorMatching.Domain.Tutors;

public sealed class TutorProfileReview
{
    public Guid Id { get; set; }
    public Guid TutorProfileId { get; set; }
    public Guid ReviewerUserId { get; set; }
    public string FromStatusCode { get; set; } = string.Empty;
    public string ToStatusCode { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    // Historical decisions made before versioning have no recoverable version.
    public Guid? ReviewedVersion { get; set; }
    public string? Note { get; set; }
    public DateTimeOffset ReviewedAt { get; set; }

    public TutorProfile? TutorProfile { get; set; }
}
