namespace TutorMatching.Domain.Hiring;

public sealed class Negotiation
{
    public Guid Id { get; set; }
    public Guid HireRequestId { get; set; }
    public Guid SenderUserId { get; set; }
    public int? ProposedPriceVnd { get; set; }
    public string? Note { get; set; }
    public string ResponseStatusCode { get; set; } = "PENDING";
    public DateTimeOffset? RespondedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public HireRequest? HireRequest { get; set; }
    public ICollection<NegotiationSchedule> Schedules { get; set; } = [];
}
