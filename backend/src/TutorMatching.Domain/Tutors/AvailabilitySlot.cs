namespace TutorMatching.Domain.Tutors;

public sealed class AvailabilitySlot
{
    public Guid Id { get; set; }
    public Guid TutorProfileId { get; set; }
    public string AvailabilityType { get; set; } = "WEEKLY";
    public int? DayOfWeek { get; set; }
    public DateOnly? SpecificDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public TutorProfile? TutorProfile { get; set; }
}
