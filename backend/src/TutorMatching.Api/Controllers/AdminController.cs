using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorMatching.Api.Routing;
using TutorMatching.Application.Administration;
using TutorMatching.Application.Abstractions;
using TutorMatching.Application.Administration.Dashboard;
using TutorMatching.Application.Administration.Users;
using TutorMatching.Domain.Users;

namespace TutorMatching.Api.Controllers;

[ApiController]
[Authorize(Roles = "ADMIN")]
[Route("admin")]
public sealed class AdminController(IAdminService admin, AdminUsersService users, IAdminDashboardQuery dashboard,
    ICurrentUser currentUser) : ControllerBase
{
    [HttpGet("dashboard", Name = "GetAdminDashboard")]
    [ProducesResponseType(typeof(DashboardSnapshot), 200, "application/json")]
    [ProducesResponseType(typeof(ProblemDetails), 400, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), 401, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), 403, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), 404, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), 429, "application/problem+json")]
    public async Task<IActionResult> Dashboard(CancellationToken cancellationToken)
    {
        Response.Headers.CacheControl = "no-store";
        return Ok(await dashboard.GetAsync(cancellationToken));
    }

    [HttpGet("users")]
    [HttpGet("/" + ApiRoutes.Prefix + "/users")]
    [ProducesResponseType<AdminUsersPage>(200)]
    public async Task<IActionResult> Users([FromQuery, Range(1, 1000000)] int page = 1,
        [FromQuery, Range(1, 100)] int pageSize = 20, [FromQuery, MaxLength(AdminUsersService.MaxQueryLength)] string? q = null,
        [FromQuery] string? role = null, [FromQuery] string? status = null, CancellationToken cancellationToken = default)
    {
        Response.Headers.CacheControl = "no-store";
        AccountRole? roleFilter = null;
        AccountStatus? statusFilter = null;
        if (role is not null)
        {
            if (!Enum.TryParse<AccountRole>(role, false, out var parsed) || !Enum.IsDefined(parsed))
                return Problem(statusCode: 400, title: "Vai trò không hợp lệ.");
            roleFilter = parsed;
        }
        if (status is not null)
        {
            if (status is not ("ACTIVE" or "LOCKED")) return Problem(statusCode: 400, title: "Trạng thái không hợp lệ.");
            statusFilter = Enum.Parse<AccountStatus>(status);
        }
        return Ok(await users.SearchAsync(new(q, roleFilter, statusFilter, page, pageSize), cancellationToken));
    }

    [HttpGet("users/{id:guid}", Name = "GetAdminUser")]
    [ProducesResponseType(typeof(AdminUser), 200, "application/json")]
    [ProducesResponseType(typeof(ProblemDetails), 400, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), 401, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), 403, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), 404, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), 429, "application/problem+json")]
    public async Task<IActionResult> UserDetail(Guid id, CancellationToken cancellationToken)
    {
        Response.Headers.CacheControl = "no-store";
        var user = await users.GetAsync(new(id), cancellationToken);
        return user is null ? Problem(statusCode: 404, title: "Không tìm thấy tài khoản.") : Ok(user);
    }

    [HttpPost("users/{id:guid}/status", Name = "UpdateUserStatus")]
    [Consumes("application/json")]
    [ProducesResponseType(typeof(AdminUser), 200, "application/json")]
    [ProducesResponseType(typeof(ProblemDetails), 400, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), 401, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), 403, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), 404, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), 429, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), 409, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), 422, "application/problem+json")]
    public async Task<IActionResult> UpdateUserStatus(Guid id, UpdateUserStatusRequest request, CancellationToken cancellationToken)
    {
        Response.Headers.CacheControl = "no-store";
        if (currentUser.UserId is not { } actor) return Unauthorized();
        if (request.ExpectedVersion is not { } version || version == Guid.Empty)
            return Problem(statusCode: 422, title: "Cần phiên bản tài khoản hiện tại.");
        if (request.Confirmed != true)
            return Problem(statusCode: 422, title: "Cần xác nhận thao tác.");
        if (request.Status is not ("ACTIVE" or "LOCKED"))
            return Problem(statusCode: 422, title: "Trạng thái đích phải là ACTIVE hoặc LOCKED.");
        var result = await users.UpdateStatusAsync(new(actor, id, version, true, Enum.Parse<AccountStatus>(request.Status)),
            cancellationToken);
        return result.Failure switch
        {
            null => Ok(result.User),
            UserStatusFailure.SelfLock => Problem(statusCode: 422, title: "Không thể thay đổi trạng thái tài khoản của chính bạn."),
            UserStatusFailure.NotFound => Problem(statusCode: 404, title: "Không tìm thấy tài khoản."),
            UserStatusFailure.Conflict => Problem(statusCode: 409, title: "Tài khoản đã thay đổi. Vui lòng tải lại trước khi thao tác."),
            _ => Problem(statusCode: 422, title: "Yêu cầu không hợp lệ.")
        };
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
public sealed record UpdateUserStatusRequest(Guid? ExpectedVersion, bool? Confirmed, string? Status);
