using TutorMatching.Domain.Tutors;
namespace TutorMatching.Domain.UnitTests.Tutors;

public sealed class CapacityTests
{
    private static WeeklyWindow W(int day, int start, int end) => new(day, new TimeOnly(start, 0), new TimeOnly(end, 0));
    [Fact]
    public void MergesAdjacentAndDuplicateIntersectionsBeforeCounting()
    { Assert.Equal(2, WeeklyAvailability.Capacity([W(1, 18, 19), W(1, 19, 20)], [W(1, 18, 20), W(1, 18, 20)], 60)); }
    [Fact]
    public void DoesNotCombineSeparateFragmentsOrDifferentDays()
    { Assert.Equal(0, WeeklyAvailability.Capacity([W(1, 18, 19), W(1, 20, 21), W(2, 18, 19)], [W(1, 18, 21), W(2, 18, 19)], 90)); }
    [Fact]
    public void CountsPerDayAndHonorsHalfOpenBoundary()
    { Assert.Equal(4, WeeklyAvailability.Capacity([W(1, 18, 20), W(2, 18, 20), W(3, 17, 18)], [W(1, 18, 20), W(2, 18, 20), W(3, 18, 20)], 60)); }
    [Theory]
    [InlineData(29)]
    [InlineData(241)]
    public void RejectsInvalidDuration(int duration)
    { Assert.Throws<ArgumentOutOfRangeException>(() => WeeklyAvailability.Capacity([], [], duration)); }
}
