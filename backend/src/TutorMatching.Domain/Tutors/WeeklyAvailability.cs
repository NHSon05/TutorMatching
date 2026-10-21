namespace TutorMatching.Domain.Tutors;
public sealed record WeeklyWindow(int DayOfWeek, TimeOnly StartTime, TimeOnly EndTime);
public static class WeeklyAvailability
{
    public static bool Valid(WeeklyWindow window) => window.DayOfWeek is >= 1 and <= 7 && window.StartTime < window.EndTime;
    public static bool Overlaps(WeeklyWindow first, WeeklyWindow second) => first.DayOfWeek == second.DayOfWeek && first.StartTime < second.EndTime && second.StartTime < first.EndTime;
    public static int Capacity(IEnumerable<WeeklyWindow> availability, IEnumerable<WeeklyWindow> requested, int durationMinutes)
    {
        if (durationMinutes is < 30 or > 240) throw new ArgumentOutOfRangeException(nameof(durationMinutes));
        var available = availability.ToList(); var desired = requested.ToList();
        if (available.Concat(desired).Any(x => !Valid(x))) throw new ArgumentException("Invalid weekly window.");
        var total = 0;
        for (var day = 1; day <= 7; day++)
        {
            var intersections = (from a in available where a.DayOfWeek == day
                from r in desired where r.DayOfWeek == day
                let start = a.StartTime > r.StartTime ? a.StartTime : r.StartTime
                let end = a.EndTime < r.EndTime ? a.EndTime : r.EndTime
                where start < end orderby start select (start, end)).ToList();
            TimeOnly? currentStart = null; TimeOnly currentEnd = default;
            foreach (var (start, end) in intersections)
            {
                if (currentStart is null) { currentStart = start; currentEnd = end; }
                else if (start <= currentEnd) { if (end > currentEnd) currentEnd = end; }
                else { total += (int)(currentEnd - currentStart.Value).TotalMinutes / durationMinutes; currentStart = start; currentEnd = end; }
            }
            if (currentStart.HasValue) total += (int)(currentEnd - currentStart.Value).TotalMinutes / durationMinutes;
        }
        return total;
    }
}
