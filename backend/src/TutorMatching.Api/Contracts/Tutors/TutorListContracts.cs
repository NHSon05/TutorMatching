using Microsoft.AspNetCore.Mvc;
namespace TutorMatching.Api.Contracts.Tutors;
// Parse numeric/JSON criteria explicitly to preserve the public query's 400 contract.
public sealed class TutorQueryParameters
{
    [FromQuery(Name="name")] public string? Name { get; set; }
    [FromQuery(Name="subjectId")] public string[] SubjectIds { get; set; } = [];
    [FromQuery(Name="levelCode")] public string[] LevelCodes { get; set; } = [];
    [FromQuery(Name="qualification")] public string? Qualification { get; set; }
    [FromQuery(Name="minPrice")] public string? MinPrice { get; set; }
    [FromQuery(Name="maxPrice")] public string? MaxPrice { get; set; }
    [FromQuery(Name="mode")] public string[] Modes { get; set; } = [];
    [FromQuery(Name="provinceCode")] public string? ProvinceCode { get; set; }
    [FromQuery(Name="districtCode")] public string? DistrictCode { get; set; }
    [FromQuery(Name="sessionsPerWeek")] public string? SessionsPerWeek { get; set; }
    [FromQuery(Name="durationMinutes")] public string? DurationMinutes { get; set; }
    [FromQuery(Name="weeklyWindows")] public string? WeeklyWindows { get; set; }
    [FromQuery(Name="sort")] public string? Sort { get; set; } = "newest";
    [FromQuery(Name="page")] public string? Page { get; set; } = "1";
    [FromQuery(Name="pageSize")] public string? PageSize { get; set; } = "20";
}
public sealed record SearchWindowInput(int DayOfWeek, string? StartTime, string? EndTime);
