using TutorMatching.Domain.Tutors;
namespace TutorMatching.Domain.UnitTests.Tutors;

public sealed class BusyWindowTests
{
    [Fact]
    public void MergeJoinsOverlappingAndTouchingWindowsPerDayInOrder()
    {
        WeeklyWindow[] windows =
        [
            new(3, new(18, 0), new(19, 0)),
            new(1, new(19, 0), new(20, 0)),
            new(1, new(18, 0), new(19, 0)),
            new(1, new(18, 30), new(19, 30)),
            new(1, new(20, 30), new(21, 0)),
            new(0, new(18, 0), new(19, 0)) // invalid day is dropped
        ];
        Assert.Equal(
        [
            new WeeklyWindow(1, new(18, 0), new(20, 0)),
            new WeeklyWindow(1, new(20, 30), new(21, 0)),
            new WeeklyWindow(3, new(18, 0), new(19, 0))
        ], WeeklyAvailability.Merge(windows));
    }

    [Fact]
    public void OverlapsAnyTreatsTouchingEdgesAndOtherDaysAsFree()
    {
        WeeklyWindow[] busy = [new(1, new(18, 0), new(19, 0))];
        Assert.True(WeeklyAvailability.OverlapsAny([new(1, new(18, 30), new(19, 30))], busy));
        Assert.False(WeeklyAvailability.OverlapsAny([new(1, new(19, 0), new(20, 0))], busy));
        Assert.False(WeeklyAvailability.OverlapsAny([new(2, new(18, 0), new(19, 0))], busy));
        Assert.False(WeeklyAvailability.OverlapsAny([new(1, new(18, 0), new(19, 0))], []));
    }
}
