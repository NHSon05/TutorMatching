using System.Collections.Immutable;
using TutorMatching.Domain.Hiring;
using TutorMatching.Domain.Tutors;

namespace TutorMatching.Domain.UnitTests.Hiring;

public sealed class HireTermsTests
{
    private static readonly DateTimeOffset Now = new(2026, 10, 28, 18, 0, 0, TimeSpan.Zero);
    private static readonly WeeklyWindow Window = new(1, new(18, 0), new(21, 0));
    private static HireTerms Valid => new(new(2026, 10, 30), 2, 60, "ONLINE", null, null, null, 150000, [Window]);
    private static IReadOnlyDictionary<string, string[]> Errors(HireTerms terms) => terms.Validate(Now, [Window], ["ONLINE", "OFFLINE", "HYBRID"], true);

    [Theory]
    [InlineData(0, 60, 1, "sessionsPerWeek")]
    [InlineData(22, 60, 1, "sessionsPerWeek")]
    [InlineData(1, 29, 1, "durationMinutes")]
    [InlineData(1, 241, 1, "durationMinutes")]
    [InlineData(1, 60, 0, "priceVnd")]
    [InlineData(1, 60, -1, "priceVnd")]
    public void RejectsNumericBounds(int frequency, int duration, int price, string field) =>
        Assert.Contains(field, Errors(Valid with { SessionsPerWeek = frequency, DurationMinutes = duration, PriceVnd = price }));

    [Theory]
    [InlineData(1, 30)] [InlineData(21, 240)]
    public void AcceptsInclusiveBoundsWithSufficientCapacity(int frequency, int duration)
    {
        var windows = Enumerable.Range(1, 7).Select(d => new WeeklyWindow(d, new(8, 0), new(20, 0))).ToImmutableArray();
        var terms = Valid with { SessionsPerWeek = frequency, DurationMinutes = duration, PriceVnd = int.MaxValue, Schedules = windows };
        Assert.Empty(terms.Validate(Now, windows, ["ONLINE"], true));
    }

    [Fact] public void UsesVietnamDateRatherThanUtcDate()
    {
        Assert.Contains("startDate", Errors(Valid with { StartDate = new(2026, 10, 29) }));
        Assert.Empty(Errors(Valid));
    }

    [Fact] public void RequiresFullCoverageAndCapacityAndRejectsOverlap()
    {
        Assert.Contains("schedules", Errors(Valid with { Schedules = [new(1, new(17, 0), new(19, 0))] }));
        Assert.Contains("schedules", Errors(Valid with { Schedules = [new(1, new(18, 0), new(19, 0))] }));
        Assert.Contains("schedules", Errors(Valid with { Schedules = [Window, Window] }));
        Assert.Contains("schedules", Errors(Valid with { Schedules = [] }));
        Assert.Contains("schedules", Errors(Valid with { Schedules = Enumerable.Repeat(Window, 148).ToImmutableArray() }));
        Assert.Contains("schedules", Errors(Valid with { Schedules = [new(0, new(18, 0), new(19, 0))] }));
        Assert.Contains("schedules", Errors(Valid with { Schedules = [new(8, new(18, 0), new(19, 0))] }));
        Assert.Contains("schedules", Errors(Valid with { Schedules = [new(1, new(20, 0), new(18, 0))] }));
        Assert.Contains("schedules", Errors(Valid with { Schedules = [new(1, new(18, 0), new(18, 0))] }));
        Assert.Contains("schedules", Errors(Valid with { Schedules = [new(1, new(18, 0, 1), new(20, 0))] }));
        Assert.Empty(Valid.Validate(Now, [new(1, new(18, 0), new(19, 0)), new(1, new(19, 0), new(21, 0))], ["ONLINE"], true));
    }

    [Fact] public void ValidatesModeLocationAndTextLengths()
    {
        Assert.Contains("teachingMode", Errors(Valid with { TeachingMode = "UNKNOWN" }));
        Assert.Contains("teachingMode", Valid.Validate(Now, [Window], ["OFFLINE"], true));
        foreach (var mode in new[] { "OFFLINE", "HYBRID" })
        {
            Assert.Contains("provinceCode", Errors(Valid with { TeachingMode = mode }));
            var located = Valid with { TeachingMode = mode, ProvinceCode = "P", DistrictCode = "D" };
            Assert.Empty(Errors(located));
            Assert.Contains("districtCode", located.Validate(Now, [Window], [mode], false));
        }
        Assert.Contains("locationDetail", Errors(Valid with { LocationDetail = new('x', 501) }));
        Assert.Empty(Errors(Valid with { LocationDetail = new('x', 500) }));
        Assert.True(HireTerms.ValidNote(new('x', 2000)));
        Assert.False(HireTerms.ValidNote(new('x', 2001)));
        Assert.True(HireTerms.ValidReason(new('x', 1000)));
        Assert.False(HireTerms.ValidReason(new('x', 1001)));
        Assert.False(HireTerms.ValidReason(" "));
    }
}
