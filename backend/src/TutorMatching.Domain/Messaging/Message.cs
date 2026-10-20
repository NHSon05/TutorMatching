namespace TutorMatching.Domain.Messaging;

public sealed class Message
{
    public Guid Id { get; set; }
    public Guid ConversationId { get; set; }
    public Guid SenderUserId { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTimeOffset SentAt { get; set; }
    public DateTimeOffset? ReadAt { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }

    public Conversation? Conversation { get; set; }
}
