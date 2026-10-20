using TutorMatching.Domain.Hiring;
using TutorMatching.Domain.Messaging;
using TutorMatching.Domain.Tutors;

namespace TutorMatching.Domain.Notifications;

public sealed class Notification
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string TypeCode { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Body { get; set; }
    public Guid? HireRequestId { get; set; }
    public Guid? MessageId { get; set; }
    public Guid? TutorProfileId { get; set; }
    public bool IsRead { get; set; }
    public DateTimeOffset? ReadAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public HireRequest? HireRequest { get; set; }
    public Message? Message { get; set; }
    public TutorProfile? TutorProfile { get; set; }
}
