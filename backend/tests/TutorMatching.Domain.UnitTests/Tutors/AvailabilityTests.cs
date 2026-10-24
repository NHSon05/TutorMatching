using TutorMatching.Domain.Tutors;
namespace TutorMatching.Domain.UnitTests.Tutors;

public sealed class AvailabilityTests
{
    [Fact]
    public void TouchingIntervalsAreLegalButIntersectionsOverlap()
    {
        var a = new WeeklyWindow(1, new(18, 0), new(19, 0));
        Assert.False(WeeklyAvailability.Overlaps(a, new(1, new(19, 0), new(20, 0))));
        Assert.True(WeeklyAvailability.Overlaps(a, new(1, new(18, 30), new(20, 0))));
        Assert.False(WeeklyAvailability.Valid(new(0, new(18, 0), new(19, 0))));
        Assert.False(WeeklyAvailability.Valid(new(1, new(20, 0), new(19, 0))));
    }
    [Fact]
    public void CapacityUnionsDuplicateWindowsAndAdjacentAvailability()
    {
        WeeklyWindow[] available = [new(1, new(18, 0), new(19, 0)), new(1, new(19, 0), new(20, 0))];
        WeeklyWindow[] requested = [new(1, new(18, 0), new(20, 0)), new(1, new(18, 30), new(20, 0))];
        Assert.Equal(2, WeeklyAvailability.Capacity(available, requested, 60));
        Assert.Equal(1, WeeklyAvailability.Capacity(available, requested, 90));
    }
}
