using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorMatching.Api.Contracts.Tutors;
using TutorMatching.Application.Abstractions;
using TutorMatching.Application.Tutors;

namespace TutorMatching.Api.Controllers;

[ApiController, Authorize(Roles = "ADMIN"), Route("admin/tutor-reviews")]
[ProducesResponseType<ProblemDetails>(401), ProducesResponseType<ProblemDetails>(403), ProducesResponseType<ProblemDetails>(422)]
public sealed class AdminTutorReviewsController(ITutorReviewService reviews, ICurrentUser currentUser) : ControllerBase
{
    [HttpGet, ProducesResponseType<ReviewQueuePage>(200)]
    public async Task<IActionResult> Queue([FromQuery, Range(1, 1000000)] int page = 1,
        [FromQuery, Range(1, 100)] int pageSize = 20, CancellationToken cancellationToken = default)
    {
        Response.Headers.CacheControl = "no-store";
        return Ok(await reviews.QueueAsync(page, pageSize, cancellationToken));
    }
    [HttpGet("{id:guid}"), ProducesResponseType<AdminTutorReviewResponse>(200), ProducesResponseType<ProblemDetails>(404)]
    public async Task<IActionResult> Detail(Guid id, CancellationToken cancellationToken)
    {
        Response.Headers.CacheControl = "no-store";
        var result = await reviews.DetailAsync(id, cancellationToken);
        return result is null ? Problem(statusCode: 404, title: "Không tìm thấy hồ sơ.") : Ok(new AdminTutorReviewResponse(result.Id, result.AccountStatus, TutorOnboardingController.MapToResponse(result.Profile), result.History, result.Subjects, result.ProvinceName, result.DistrictName));
    }
    [HttpPost("{id:guid}"), Consumes("application/json"), ProducesResponseType<TutorReviewDecisionResponse>(200), ProducesResponseType<ProblemDetails>(404), ProducesResponseType<ProblemDetails>(409)]
    public async Task<IActionResult> Decide(Guid id, TutorReviewRequest request, CancellationToken cancellationToken)
    {
        Response.Headers.CacheControl = "no-store";
        if (currentUser.UserId is not { } actor) return Unauthorized();
        if (request.ExpectedVersion is null || request.ExpectedVersion == Guid.Empty ||
            (request.Action != "APPROVE" && string.IsNullOrWhiteSpace(request.Note)))
            return Problem(statusCode: 422, title: "Cần phiên bản hồ sơ và lý do khi yêu cầu sửa hoặc từ chối.");
        var result = await reviews.DecideAsync(id, actor, request.ExpectedVersion.Value, request.Action, request.Note, cancellationToken);
        return result.Failure switch
        {
            ReviewFailure.NotFound => Problem(statusCode: 404, title: "Không tìm thấy hồ sơ."),
            ReviewFailure.Conflict => Problem(statusCode: 409, title: "Hồ sơ đã thay đổi, không còn chờ duyệt hoặc tài khoản không hoạt động. Vui lòng tải lại."),
            ReviewFailure.Invalid => Problem(statusCode: 422, title: "Quyết định hoặc lý do không hợp lệ."),
            _ => Ok(new TutorReviewDecisionResponse(result.Status!, result.Version!.Value))
        };
    }
}
public sealed record TutorReviewRequest([Required] Guid? ExpectedVersion,
    [Required, RegularExpression("^(APPROVE|REQUEST_CHANGES|REJECT)$")] string Action, [MaxLength(4000)] string? Note = null);

public sealed record AdminTutorReviewResponse(Guid Id, string AccountStatus, TutorOnboardingResponse Profile, IReadOnlyList<ReviewHistory> History, IReadOnlyList<ReviewSubject> Subjects, string? ProvinceName, string? DistrictName);

public sealed record TutorReviewDecisionResponse(string Status, Guid Version);
