using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorMatching.Api.Contracts.Tutors;
using TutorMatching.Application.Tutors;
using TutorMatching.Domain.Tutors;
namespace TutorMatching.Api.Controllers;

[ApiController, AllowAnonymous, Route("tutors")]
public sealed class TutorsController(IPublicTutorService tutors) : ControllerBase
{
    private static readonly HashSet<string> QueryKeys = new(StringComparer.OrdinalIgnoreCase) {
        "name","subjectId","levelCode","qualification","minPrice","maxPrice","mode","provinceCode","districtCode","sessionsPerWeek","durationMinutes","weeklyWindows","sort","page","pageSize" };
    [HttpGet, ProducesResponseType<PublicTutorPage>(200), ProducesResponseType<ProblemDetails>(400)]
    public async Task<IActionResult> Search([FromQuery] TutorQueryParameters p, CancellationToken cancellationToken)
    {
        Response.Headers.CacheControl = "no-store";
        IActionResult Invalid()
        {
            var problem = new ValidationProblemDetails(new Dictionary<string, string[]> { ["filters"] = ["Kiểm tra giá, khu vực, phân trang và đủ bộ ba số buổi/thời lượng/khung giờ."] })
            { Status = 400, Title = "Bộ lọc không hợp lệ.", Type = "about:blank" };
            problem.Extensions["traceId"] = HttpContext.TraceIdentifier;
            return BadRequest(problem);
        }
        if (Request.Query.Keys.Any(k => !QueryKeys.Contains(k)) || Request.Query.Any(k => k.Value.Count > 1 && k.Key.ToLowerInvariant() is not ("subjectid" or "levelcode" or "mode"))) return Invalid();
        if (!Integer(p.MinPrice, "minPrice", out var min) || !Integer(p.MaxPrice, "maxPrice", out var max) ||
            !Integer(p.SessionsPerWeek, "sessionsPerWeek", out var frequency) || !Integer(p.DurationMinutes, "durationMinutes", out var duration) ||
            !int.TryParse(p.Page, NumberStyles.None, CultureInfo.InvariantCulture, out var page) || !int.TryParse(p.PageSize, NumberStyles.None, CultureInfo.InvariantCulture, out var size)) return Invalid();
        var subjects = new List<Guid>();
        foreach (var value in p.SubjectIds) { if (!Guid.TryParse(value, out var id)) return Invalid(); subjects.Add(id); }
        var windows = new List<WeeklyWindow>();
        if (Request.Query.ContainsKey("weeklyWindows"))
        {
            if (string.IsNullOrEmpty(p.WeeklyWindows) || p.WeeklyWindows.Length > 12000) return Invalid();
            try
            {
                var values = JsonSerializer.Deserialize<List<SearchWindowInput?>>(p.WeeklyWindows, new JsonSerializerOptions(JsonSerializerDefaults.Web) { UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow });
                if (values is null || values.Count is < 1 or > 50) return Invalid();
                foreach (var value in values)
                {
                    if (value is null || !TimeOnly.TryParseExact(value.StartTime, "HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out var start) ||
                        !TimeOnly.TryParseExact(value.EndTime, "HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out var end)) return Invalid();
                    windows.Add(new(value.DayOfWeek, start, end));
                }
            }
            catch (JsonException) { return Invalid(); }
        }
        var criteria = new TutorSearchCriteria(p.Name?.Trim(), subjects.ToArray(), p.LevelCodes, p.Qualification?.Trim(), min, max, p.Modes,
            p.ProvinceCode, p.DistrictCode, frequency, duration, windows, p.Sort ?? "", page, size);
        if (!criteria.IsValid) return Invalid();
        return Ok(await tutors.SearchAsync(criteria, cancellationToken));
    }
    private bool Integer(string? value, string key, out int? number)
    {
        number = null;
        if (!Request.Query.ContainsKey(key)) return true;
        if (!int.TryParse(value, NumberStyles.None, CultureInfo.InvariantCulture, out var result)) return false;
        number = result; return true;
    }
    [HttpGet("{id:guid}"), ProducesResponseType<PublicTutorDetail>(200), ProducesResponseType<ProblemDetails>(404)]
    public async Task<IActionResult> Detail(Guid id, CancellationToken cancellationToken)
    {
        Response.Headers.CacheControl = "no-store";
        var result = await tutors.FindAsync(id, cancellationToken);
        return result is null ? Problem(statusCode: 404, title: "Hồ sơ gia sư không còn khả dụng.") : Ok(result);
    }
}
