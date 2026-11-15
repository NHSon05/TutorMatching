using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorMatching.Api.Errors;
using TutorMatching.Application.Notifications;

namespace TutorMatching.Api.Controllers;

// Owner-scoped: the service derives the owner from the session, so another user's ID is always 404.
[ApiController, Authorize, Route("notifications")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
[ProducesResponseType(typeof(ProblemDetails), 400, "application/problem+json")]
[ProducesResponseType(typeof(ProblemDetails), 401, "application/problem+json")]
[ProducesResponseType(typeof(ProblemDetails), 403, "application/problem+json")]
[ProducesResponseType(typeof(ProblemDetails), 404, "application/problem+json")]
[ProducesResponseType(typeof(ProblemDetails), 429, "application/problem+json")]
public sealed class NotificationsController(INotificationService notifications) : ControllerBase
{
    [HttpGet(Name = "GetNotifications")]
    [ProducesResponseType(typeof(NotificationPageDto), 200, "application/json")]
    public Task<IActionResult> List([FromQuery] bool unreadOnly = false, [FromQuery] string? cursor = null,
        [FromQuery, Range(1, 100)] int pageSize = 20, CancellationToken ct = default) =>
        Run(() => notifications.ListAsync(unreadOnly, cursor, pageSize, ct));

    [HttpGet("unread-count", Name = "GetUnreadNotificationCount")]
    [ProducesResponseType(typeof(UnreadNotificationCountDto), 200, "application/json")]
    public Task<IActionResult> UnreadCount(CancellationToken ct) =>
        Run(() => notifications.GetUnreadCountAsync(ct));

    [HttpPost("{id:guid}/read", Name = "MarkNotificationRead")]
    [ProducesResponseType(typeof(NotificationDto), 200, "application/json")]
    [ProducesResponseType(typeof(ProblemDetails), 409, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), 422, "application/problem+json")]
    public Task<IActionResult> MarkRead(Guid id, CancellationToken ct) =>
        Run(() => notifications.MarkReadAsync(id, ct));

    [HttpPost("read-all", Name = "MarkAllNotificationsRead")]
    [Consumes("application/json")]
    [ProducesResponseType(typeof(ReadAllNotificationsResultDto), 200, "application/json")]
    [ProducesResponseType(typeof(ProblemDetails), 409, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), 422, "application/problem+json")]
    public Task<IActionResult> MarkAllRead(ReadAllNotificationsRequest request, CancellationToken ct) =>
        Run(() => notifications.MarkAllReadAsync(request.Boundary, ct));

    [HttpPost("{id:guid}/open", Name = "OpenNotification")]
    [ProducesResponseType(typeof(OpenNotificationResultDto), 200, "application/json")]
    [ProducesResponseType(typeof(ProblemDetails), 409, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), 422, "application/problem+json")]
    public Task<IActionResult> Open(Guid id, CancellationToken ct) =>
        Run(() => notifications.OpenAsync(id, ct));

    private async Task<IActionResult> Run<T>(Func<Task<T>> action)
    {
        Response.Headers.CacheControl = "no-store";
        try
        {
            return Ok(await action());
        }
        catch (NotificationException e)
        {
            var status = e.Code switch
            {
                "unauthorized" => 401,
                "not_found" => 404,
                _ => 400
            };
            var problem = ApiProblems.Create(HttpContext, status, status == 404
                ? "Không tìm thấy thông báo."
                : "Không thể thực hiện thao tác. Vui lòng tải lại danh sách thông báo.");
            problem.Extensions["code"] = e.Code;
            return ApiProblems.ToResult(problem);
        }
    }
}
