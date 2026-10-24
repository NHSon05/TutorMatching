using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorMatching.Api.Routing;
using TutorMatching.Application.Administration;
using TutorMatching.Application.Abstractions;

namespace TutorMatching.Api.Controllers;

[ApiController]
[Authorize(Roles = "ADMIN")]
[Route("admin")]
public sealed class AdminController(IAdminService admin, ICurrentUser currentUser) : ControllerBase
{
    [HttpGet("users")]
    [HttpGet("/" + ApiRoutes.Prefix + "/users")]
    [ProducesResponseType<AdminUsersPage>(200)]
    public async Task<IActionResult> Users([FromQuery, Range(1, 1000000)] int page = 1,
        [FromQuery, Range(1, 100)] int pageSize = 20, CancellationToken cancellationToken = default)
    {
        Response.Headers.CacheControl = "no-store";
        return Ok(await admin.GetUsersAsync(page, pageSize, cancellationToken));
    }

    [HttpPost("tutors/{id:guid}/approve")]
    public Task<IActionResult> Approve(Guid id, ReviewRequest request, CancellationToken cancellationToken) => Review(id, request, true, cancellationToken);

    [HttpPost("tutors/{id:guid}/reject")]
    public Task<IActionResult> Reject(Guid id, ReviewRequest request, CancellationToken cancellationToken) => Review(id, request, false, cancellationToken);

    private async Task<IActionResult> Review(Guid id, ReviewRequest request, bool approve, CancellationToken cancellationToken)
    {
        Response.Headers.CacheControl = "no-store";
        if (currentUser.UserId is not { } actor) return Unauthorized();
        if (request.ExpectedVersion is null || request.ExpectedVersion == Guid.Empty)
            return Problem(statusCode: 422, title: "Cần phiên bản hồ sơ đang duyệt.");
        if (!approve && string.IsNullOrWhiteSpace(request.Note))
            return Problem(statusCode: 422, title: "Cần nhập lý do từ chối.");
        var result = await admin.ReviewAsync(id, actor, approve, request.ExpectedVersion.Value, request.Note?.Trim(), cancellationToken);
        return result switch
        {
            ReviewOutcome.NotFound => Problem(statusCode: 404, title: "Không tìm thấy hồ sơ gia sư."),
            ReviewOutcome.Conflict => Problem(statusCode: 409, title: "Hồ sơ không còn chờ duyệt hoặc tài khoản không hoạt động."),
            _ => Ok(new { id, status = approve ? "APPROVED" : "REJECTED" })
        };
    }
}
public sealed record ReviewRequest([Required] Guid? ExpectedVersion, [MaxLength(4000)] string? Note = null);
