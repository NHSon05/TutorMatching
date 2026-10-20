using TutorMatching.Domain.Hiring;

namespace TutorMatching.Domain.Messaging;

public sealed class Conversation
{
    public Guid Id { get; set; }
    public Guid HireRequestId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? ClosedAt { get; set; }

    public HireRequest? HireRequest { get; set; }
    public ICollection<Message> Messages { get; set; } = [];
}
