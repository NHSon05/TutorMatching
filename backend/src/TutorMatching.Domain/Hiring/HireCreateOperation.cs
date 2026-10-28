namespace TutorMatching.Domain.Hiring;

public sealed class HireCreateOperation
{
    public Guid LearnerId { get; set; }
    public Guid IdempotencyKey { get; set; }
    public Guid RequestId { get; set; }
    public string PayloadFingerprint { get; set; } = string.Empty;
    public HireCreationOutcome Outcome { get; set; } = null!;
    public DateTimeOffset CreatedAt { get; set; }
}

public sealed record HireCreationOutcome(Guid Id, Guid Version, string Status, Guid ConversationId);
