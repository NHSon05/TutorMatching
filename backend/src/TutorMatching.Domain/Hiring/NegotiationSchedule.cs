namespace TutorMatching.Domain.Hiring;

public sealed class NegotiationSchedule
{
    public Guid Id { get; set; }
    public Guid NegotiationId { get; set; }
    public int DayOfWeek { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }

    public Negotiation? Negotiation { get; set; }
}
