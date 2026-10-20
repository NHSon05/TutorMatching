namespace TutorMatching.Domain.Hiring;

public sealed class RequestStatusHistory
{
    public Guid Id { get; set; }
    public Guid HireRequestId { get; set; }
    public Guid? ActorUserId { get; set; }
    public string? FromStatusCode { get; set; }
    public string ToStatusCode { get; set; } = string.Empty;
    public string? Reason { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public HireRequest? HireRequest { get; set; }
}
