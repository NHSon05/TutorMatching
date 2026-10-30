using System.Collections.Immutable;
using TutorMatching.Domain.Tutors;

namespace TutorMatching.Domain.Hiring;

/// <summary>A value snapshot: changing a profile, course or caller-owned list cannot change these terms.</summary>
public sealed record HireTerms(DateOnly StartDate, int SessionsPerWeek, int DurationMinutes,
    string TeachingMode, string? ProvinceCode, string? DistrictCode, string? LocationDetail,
    int PriceVnd, ImmutableArray<WeeklyWindow> Schedules)
{
    public static bool ValidNote(string? note) => note is null || note.Length <= 2000;
    public static bool ValidReason(string? reason) => !string.IsNullOrWhiteSpace(reason) && reason.Length <= 1000;

    public IReadOnlyDictionary<string, string[]> Validate(DateTimeOffset now,
        IEnumerable<WeeklyWindow> availability, IEnumerable<string> offeredModes, bool validLocation,
        bool requireFuture = true)
    {
        var errors = new Dictionary<string, string[]>();
        void Error(string field, string message) => errors[field] = [message];
        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(now,
            TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh")).DateTime);
        if (requireFuture && StartDate <= today) Error("startDate", "Choose a future local date.");
        if (SessionsPerWeek is < 1 or > 21) Error("sessionsPerWeek", "Use 1–21 sessions per week.");
        if (DurationMinutes is < 30 or > 240) Error("durationMinutes", "Use 30–240 minutes.");
        if (PriceVnd <= 0) Error("priceVnd", "Use a positive integer VND price.");
        if (TeachingMode is not ("ONLINE" or "OFFLINE" or "HYBRID") || !offeredModes.Contains(TeachingMode))
            Error("teachingMode", "Choose an offered teaching mode.");
        if (TeachingMode is "OFFLINE" or "HYBRID")
        {
            if (string.IsNullOrWhiteSpace(ProvinceCode)) Error("provinceCode", "Province is required.");
            if (string.IsNullOrWhiteSpace(DistrictCode) || !validLocation) Error("districtCode", "Choose an active district in the province.");
        }
        else if ((ProvinceCode is not null || DistrictCode is not null) && !validLocation)
            Error("districtCode", "Choose an active district in the province.");
        if (LocationDetail?.Length > 500) Error("locationDetail", "Maximum 500 characters.");
        if (Schedules.IsDefaultOrEmpty || Schedules.Length > 147 || Schedules.Any(w =>
            !WeeklyAvailability.Valid(w) || w.StartTime.Ticks % TimeSpan.TicksPerMinute != 0 || w.EndTime.Ticks % TimeSpan.TicksPerMinute != 0))
        { Error("schedules", "Use 1–147 valid minute-precision weekly windows."); return errors; }
        var available = availability.Where(WeeklyAvailability.Valid).OrderBy(w => w.StartTime).ToArray();
        for (var i = 0; i < Schedules.Length; i++)
        {
            var window = Schedules[i];
            if (Schedules.Skip(i + 1).Any(w => WeeklyAvailability.Overlaps(window, w)))
                Error("schedules", "Requested windows must not overlap.");
            var coveredUntil = window.StartTime;
            foreach (var slot in available.Where(w => w.DayOfWeek == window.DayOfWeek))
            {
                if (slot.StartTime > coveredUntil) break;
                if (slot.EndTime > coveredUntil) coveredUntil = slot.EndTime;
            }
            if (coveredUntil < window.EndTime) Error("schedules", "Every requested window must be fully available.");
        }
        if (!errors.ContainsKey("durationMinutes") && WeeklyAvailability.Capacity(available, Schedules, DurationMinutes) < SessionsPerWeek)
            Error("schedules", "Available windows do not fit the requested frequency and duration.");
        return errors;
    }
}
