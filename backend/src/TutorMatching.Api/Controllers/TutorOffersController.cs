using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorMatching.Application.Abstractions;
using TutorMatching.Application.Tutors;
namespace TutorMatching.Api.Controllers;

[ApiController, Authorize(Roles = "TUTOR")]
[Consumes("application/json")]
[ProducesResponseType(typeof(ProblemDetails), 400, "application/problem+json")]
[ProducesResponseType(typeof(ProblemDetails), 401, "application/problem+json")]
[ProducesResponseType(typeof(ProblemDetails), 403, "application/problem+json")]
[ProducesResponseType(typeof(ProblemDetails), 404, "application/problem+json")]
[ProducesResponseType(typeof(ProblemDetails), 409, "application/problem+json")]
[ProducesResponseType(typeof(ProblemDetails), 422, "application/problem+json")]
[Route("tutor")]
public sealed class TutorOffersController(ITutorOfferService offers, ICurrentUser currentUser) : ControllerBase
{
    private Guid Owner => currentUser.UserId!.Value;
    [ProducesResponseType(typeof(AvailabilityResponse[]), 200, "application/json")]
    [HttpGet("availability")] public async Task<IActionResult> Slots(CancellationToken token) { Response.Headers.CacheControl = "no-store"; return Ok((await offers.AvailabilityAsync(Owner, token)).Select(SlotResponse)); }
    [ProducesResponseType(typeof(AvailabilityResponse), 200, "application/json")]
    [HttpPost("availability")] public async Task<IActionResult> AddSlot(AvailabilityRequest data, CancellationToken token) => await SaveSlot(null, data, token);
    [ProducesResponseType(typeof(AvailabilityResponse), 200, "application/json")]
    [HttpPut("availability/{id:guid}")] public async Task<IActionResult> EditSlot(Guid id, AvailabilityRequest data, CancellationToken token) => await SaveSlot(id, data, token);
    [ProducesResponseType(204)]
    [HttpDelete("availability/{id:guid}")] public async Task<IActionResult> DeleteSlot(Guid id, CancellationToken token) => Failure(await offers.DeleteAvailabilityAsync(Owner, id, token));
    [ProducesResponseType(typeof(CourseData[]), 200, "application/json")]
    [HttpGet("courses")] public async Task<IActionResult> Courses(CancellationToken token) { Response.Headers.CacheControl = "no-store"; return Ok(await offers.CoursesAsync(Owner, token)); }
    [ProducesResponseType(typeof(CourseData), 200, "application/json")]
    [HttpPost("courses")] public async Task<IActionResult> AddCourse(CourseWrite data, CancellationToken token) => Result(await offers.SaveCourseAsync(Owner, null, data, token));
    [ProducesResponseType(typeof(CourseData), 200, "application/json")]
    [HttpPut("courses/{id:guid}")] public async Task<IActionResult> EditCourse(Guid id, CourseWrite data, CancellationToken token) => Result(await offers.SaveCourseAsync(Owner, id, data, token));
    [ProducesResponseType(204)]
    [HttpDelete("courses/{id:guid}")] public async Task<IActionResult> DeleteCourse(Guid id, CancellationToken token) => Failure(await offers.DeleteCourseAsync(Owner, id, token));
    private static AvailabilityResponse SlotResponse(AvailabilityData slot) => new(slot.Id, slot.DayOfWeek, slot.StartTime.ToString("HH:mm"), slot.EndTime.ToString("HH:mm"), slot.TimeZone);
    private async Task<IActionResult> SaveSlot(Guid? id, AvailabilityRequest data, CancellationToken token)
    {
        if (!TimeOnly.TryParseExact(data.StartTime, "HH:mm", System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out var start)) return InvalidField("startTime", "Giờ bắt đầu phải có dạng HH:mm.");
        if (!TimeOnly.TryParseExact(data.EndTime, "HH:mm", System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out var end)) return InvalidField("endTime", "Giờ kết thúc phải có dạng HH:mm.");
        if (data.DayOfWeek is < 1 or > 7) return InvalidField("dayOfWeek", "Ngày trong tuần phải từ 1 đến 7.");
        if (start >= end) return InvalidField("endTime", "Giờ kết thúc phải sau giờ bắt đầu, trong cùng ngày.");
        return Result(await offers.SaveAvailabilityAsync(Owner, id, new(data.DayOfWeek, start, end), token));
    }
    private IActionResult InvalidField(string field, string message)
    {
        Response.Headers.CacheControl = "no-store";
        var problem = TutorMatching.Api.Errors.ApiProblems.Create(HttpContext, 422, "Dữ liệu không hợp lệ.");
        problem.Extensions["errors"] = new Dictionary<string, string[]> { { field, [message] } };
        return TutorMatching.Api.Errors.ApiProblems.ToResult(problem);
    }
    private IActionResult Result<T>(OfferResult<T> result) { Response.Headers.CacheControl = "no-store"; if (result.Failure == OfferFailure.Invalid && typeof(T) == typeof(CourseData)) return InvalidField("subjectId", "Chọn môn thuộc hồ sơ của bạn và đang hoạt động khi mở khóa học."); return result.Failure is null ? Ok(result.Data is AvailabilityData slot ? SlotResponse(slot) : (object?)result.Data) : Failure(result.Failure); }
    private IActionResult Failure(OfferFailure? failure)
    {
        Response.Headers.CacheControl = "no-store";
        return failure switch { OfferFailure.NotFound => Problem(statusCode: 404, title: "Không tìm thấy dữ liệu thuộc hồ sơ của bạn."), OfferFailure.Conflict => Problem(statusCode: 409, title: "Khung giờ chồng lấn lịch đã có."), OfferFailure.Invalid => Problem(statusCode: 422, title: "Dữ liệu không hợp lệ. Kiểm tra thời gian, môn đang dạy, nội dung, số buổi và giá."), _ => NoContent() };
    }
}

public sealed record AvailabilityRequest(int DayOfWeek, string StartTime, string EndTime);
public sealed record AvailabilityResponse(Guid Id, int DayOfWeek, string StartTime, string EndTime, string TimeZone);
