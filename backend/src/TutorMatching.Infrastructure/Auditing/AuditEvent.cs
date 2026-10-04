namespace TutorMatching.Infrastructure.Auditing;

public sealed class AuditEvent
{
    public Guid Id { get; set; }

    public Guid? ActorUserId { get; set; }

    public string Action { get; set; } = string.Empty;

    public string EntityType { get; set; } = string.Empty;

    public string? EntityId { get; set; }

    public string? IpAddress { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
}
