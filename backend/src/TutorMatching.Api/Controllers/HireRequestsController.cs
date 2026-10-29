using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorMatching.Api.Errors;
using TutorMatching.Application.Hiring;

namespace TutorMatching.Api.Controllers;

[ApiController, Authorize(Roles = "LEARNER"), Route("hire-requests")]
public sealed class HireRequestsController(CreateHireRequest create) : ControllerBase
{
    [HttpPost]
    [Consumes("application/json")]
    [ProducesResponseType(typeof(HireCreated), 201, "application/json")]
    [ProducesResponseType(typeof(ProblemDetails), 400, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), 401, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), 403, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), 404, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), 409, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), 500, "application/problem+json")]
    public async Task<IActionResult> Post(CreateHireRequestCommand command, [FromHeader(Name = "Idempotency-Key"), Required] string? idempotencyKey, CancellationToken ct)
    {
        Response.Headers.CacheControl = "no-store";
        if (!Guid.TryParse(idempotencyKey, out var key) || key == Guid.Empty)
            return Failure(400, "invalid_idempotency_key", new Dictionary<string, string[]> { ["idempotencyKey"] = ["Cần mã UUID hợp lệ."] });
        try
        {
            var result = await create.ExecuteAsync(command, key, ct);
            return StatusCode(201, new HireCreated { Id = result.Id, Version = result.Version,
                Status = result.Status, ConversationId = result.ConversationId });
        }
        catch (HireValidationException e) { return Failure(400, "validation_failed", e.Errors); }
        catch (HireStoreException e)
        {
            return Failure(e.Code switch { "unauthorized" => 401, "forbidden" => 403, "not_found" => 404, _ => 409 }, e.Code);
        }
    }
    private IActionResult Failure(int status, string code, IReadOnlyDictionary<string, string[]>? errors = null)
    {
        var problem = ApiProblems.Create(HttpContext, status, status == 409
            ? "Giá hoặc lịch của gia sư đã thay đổi, hoặc mã gửi đã được dùng cho nội dung khác. Vui lòng kiểm tra và gửi lại."
            : "Không thể gửi yêu cầu. Vui lòng kiểm tra dữ liệu và quyền truy cập.");
        problem.Extensions["code"] = code;
        if (errors is not null) problem.Extensions["errors"] = errors;
        return ApiProblems.ToResult(problem);
    }
}
