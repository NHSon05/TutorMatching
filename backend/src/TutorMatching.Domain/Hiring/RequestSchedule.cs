namespace TutorMatching.Domain.Hiring;

public sealed class RequestSchedule
{
    public Guid Id { get; set; }
    public Guid HireRequestId { get; set; }
    public int DayOfWeek { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public HireRequest? HireRequest { get; set; }
}
