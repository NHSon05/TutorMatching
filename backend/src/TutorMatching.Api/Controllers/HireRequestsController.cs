using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorMatching.Api.Errors;
using TutorMatching.Application.Hiring;

namespace TutorMatching.Api.Controllers;

[ApiController, Authorize, Route("hire-requests")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
[ProducesResponseType(typeof(ProblemDetails), 400, "application/problem+json")]
[ProducesResponseType(typeof(ProblemDetails), 401, "application/problem+json")]
[ProducesResponseType(typeof(ProblemDetails), 403, "application/problem+json")]
[ProducesResponseType(typeof(ProblemDetails), 404, "application/problem+json")]
[ProducesResponseType(typeof(ProblemDetails), 409, "application/problem+json")]
[ProducesResponseType(typeof(ProblemDetails), 500, "application/problem+json")]
public sealed class HireRequestsController(CreateHireRequest create, RespondToHireRequest respond, NegotiateHireRequest negotiate, CloseHireRequest close, IHireRequestQueries queries) : ControllerBase
{
    [HttpGet, Authorize(Roles = "LEARNER,TUTOR")]
    [ProducesResponseType(typeof(HirePage), 200, "application/json")]
    public Task<IActionResult> List([FromQuery] string? status, [FromQuery] string? cursor, CancellationToken ct,
        [FromQuery, Range(1, 100)] int pageSize = 20) => Run(() => queries.ListAsync(status, cursor, pageSize, ct));

    [HttpGet("{id:guid}"), Authorize(Roles = "LEARNER,TUTOR")]
    [ProducesResponseType(typeof(HireDetail), 200, "application/json")]
    public Task<IActionResult> Detail(Guid id, CancellationToken ct) => Run(() => queries.DetailAsync(id, ct));

    [HttpPost("{id:guid}/accept"), Authorize(Roles = "LEARNER,TUTOR")]
    [Consumes("application/json")]
    [ProducesResponseType(typeof(HireResult), 200, "application/json")]
    public Task<IActionResult> Accept(Guid id, AcceptHireRequestCommand command, CancellationToken ct) => Run(() => respond.AcceptAsync(id, command, ct));

    [HttpPost("{id:guid}/reject"), Authorize(Roles = "TUTOR")]
    [Consumes("application/json")]
    [ProducesResponseType(typeof(HireResult), 200, "application/json")]
    public Task<IActionResult> Reject(Guid id, RejectHireRequestCommand command, CancellationToken ct) => Run(() => respond.RejectAsync(id, command, ct));

    [HttpPost("{id:guid}/proposals"), Authorize(Roles = "LEARNER,TUTOR")]
    [Consumes("application/json")]
    [ProducesResponseType(typeof(HireResult), 200, "application/json")]
    public Task<IActionResult> Propose(Guid id, ProposeHireRequestCommand command, CancellationToken ct) => Run(() => negotiate.ExecuteAsync(id, command, ct));

    [HttpPost("{id:guid}/cancel"), Authorize(Roles = "LEARNER,TUTOR")]
    [Consumes("application/json")]
    [ProducesResponseType(typeof(HireResult), 200, "application/json")]
    public Task<IActionResult> Cancel(Guid id, CloseHireRequestCommand command, CancellationToken ct) => Run(() => close.CancelAsync(id, command, ct));

    [HttpPost("{id:guid}/complete"), Authorize(Roles = "LEARNER,TUTOR")]
    [Consumes("application/json")]
    [ProducesResponseType(typeof(HireResult), 200, "application/json")]
    public Task<IActionResult> Complete(Guid id, CloseHireRequestCommand command, CancellationToken ct) => Run(() => close.CompleteAsync(id, command, ct));

    private async Task<IActionResult> Run<T>(Func<Task<T>> action)
    {
        Response.Headers.CacheControl = "no-store";
        try { return Ok(await action()); }
        catch (HireValidationException e) { return Failure(400, "validation_failed", e.Errors); }
        catch (HireStoreException e)
        {
            return Failure(e.Code switch { "unauthorized" => 401, "forbidden" => 403, "not_found" => 404, _ => 409 }, e.Code);
        }
    }

    [HttpPost, Authorize(Roles = "LEARNER")]
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
            ? "Yêu cầu, giá hoặc lịch đã thay đổi, hoặc mã gửi đã được dùng. Vui lòng tải lại và kiểm tra trước khi tiếp tục."
            : "Không thể thực hiện thao tác. Vui lòng kiểm tra dữ liệu và quyền truy cập.");
        problem.Extensions["code"] = code;
        if (errors is not null) problem.Extensions["errors"] = errors;
        return ApiProblems.ToResult(problem);
    }
}
