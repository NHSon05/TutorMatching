using System.Globalization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorMatching.Application.Abstractions;
using TutorMatching.Application.Tutors;

namespace TutorMatching.Api.Controllers;

public sealed record SubmitTutorDemandRequest(string QueryText);

[ApiController]
[AllowAnonymous]
[Route("public/tutor-demands")]
public sealed class PublicTutorDemandsController(
    SubmitPublicTutorDemandHandler handler,
    ICurrentUser currentUser) : ControllerBase
{
    [HttpPost("match")]
    [ProducesResponseType<SubmitTutorDemandResponseDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> Match(
        [FromBody] SubmitTutorDemandRequest? request,
        CancellationToken cancellationToken)
    {
        Response.Headers.CacheControl = "no-store";

        if (request is null || string.IsNullOrWhiteSpace(request.QueryText))
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Vui lòng nhập nội dung yêu cầu tìm gia sư.");
        }

        var requesterUserId = currentUser.IsAuthenticated ? currentUser.UserId : null;
        var remoteIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var actorFingerprint = requesterUserId.HasValue
            ? $"user:{requesterUserId.Value:D}"
            : $"ip:{remoteIp}";

        try
        {
            var result = await handler.HandleAsync(
                actorFingerprint,
                request.QueryText,
                requesterUserId,
                cancellationToken);

            return Ok(result);
        }
        catch (DemandRejectedException ex)
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: ex.Message);
        }
        catch (DemandRateLimitExceededException ex)
        {
            Response.Headers.RetryAfter = Math.Ceiling(ex.RetryAfter.TotalSeconds).ToString(CultureInfo.InvariantCulture);
            return Problem(
                statusCode: StatusCodes.Status429TooManyRequests,
                title: "Bạn đã gửi quá nhiều yêu cầu trong thời gian ngắn. Vui lòng thử lại sau.");
        }
    }
}
