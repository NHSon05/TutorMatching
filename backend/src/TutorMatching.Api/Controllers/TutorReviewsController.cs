using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorMatching.Application.Abstractions;
using TutorMatching.Application.Tutors;
namespace TutorMatching.Api.Controllers;

[ProducesResponseType<ProblemDetails>(401), ProducesResponseType<ProblemDetails>(403)]
[ApiController, Authorize(Roles = "TUTOR"), Route("tutor/reviews")]
public sealed class TutorReviewsController(ITutorReviewService reviews, ICurrentUser currentUser) : ControllerBase
{
    [HttpGet, ProducesResponseType<IReadOnlyList<ReviewHistory>>(200)]
    public async Task<IActionResult> History(CancellationToken cancellationToken)
    {
        Response.Headers.CacheControl = "no-store";
        if (currentUser.UserId is not { } owner) return Unauthorized();
        return Ok(await reviews.HistoryAsync(owner, cancellationToken));
    }
}
