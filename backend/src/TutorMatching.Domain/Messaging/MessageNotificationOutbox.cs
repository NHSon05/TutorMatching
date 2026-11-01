namespace TutorMatching.Domain.Messaging;

public sealed class MessageNotificationOutbox
{
    public Guid Id { get; set; }
    public Guid MessageId { get; set; }
    public Guid RecipientUserId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public int AttemptCount { get; set; }
    public DateTimeOffset? NextAttemptAt { get; set; }
    public DateTimeOffset? DeliveredAt { get; set; }

    public Message? Message { get; set; }
}
