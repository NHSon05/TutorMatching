using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorMatching.Application.Abstractions;
using TutorMatching.Application.Tutors;

namespace TutorMatching.Api.Controllers;

public sealed record SavedTutorPage(IReadOnlyList<SavedTutorDto> Items);

/// <summary>Learner bookmarks of tutor profiles; the owner is always the signed-in learner.</summary>
[ApiController, Authorize(Roles = "LEARNER"), Route("saved-tutors")]
[ProducesResponseType(typeof(ProblemDetails), 401, "application/problem+json")]
[ProducesResponseType(typeof(ProblemDetails), 403, "application/problem+json")]
public sealed class SavedTutorsController(ISavedTutorService saved, ICurrentUser currentUser) : ControllerBase
{
    [HttpGet(Name = "GetSavedTutors")]
    [ProducesResponseType(typeof(SavedTutorPage), 200, "application/json")]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        Response.Headers.CacheControl = "no-store";
        if (currentUser.UserId is not { } owner) return Unauthorized();
        return Ok(new SavedTutorPage(await saved.ListAsync(owner, cancellationToken)));
    }

    [HttpPut("{tutorProfileId:guid}", Name = "SaveTutor")]
    [ProducesResponseType(204)]
    [ProducesResponseType(typeof(ProblemDetails), 404, "application/problem+json")]
    public async Task<IActionResult> Save(Guid tutorProfileId, CancellationToken cancellationToken)
    {
        Response.Headers.CacheControl = "no-store";
        if (currentUser.UserId is not { } owner) return Unauthorized();
        return await saved.SaveAsync(owner, tutorProfileId, cancellationToken) == SaveTutorOutcome.NotFound
            ? Problem(statusCode: 404, title: "Không tìm thấy hồ sơ gia sư.")
            : NoContent();
    }

    [HttpDelete("{tutorProfileId:guid}", Name = "UnsaveTutor")]
    [ProducesResponseType(204)]
    public async Task<IActionResult> Remove(Guid tutorProfileId, CancellationToken cancellationToken)
    {
        Response.Headers.CacheControl = "no-store";
        if (currentUser.UserId is not { } owner) return Unauthorized();
        await saved.RemoveAsync(owner, tutorProfileId, cancellationToken);
        return NoContent();
    }
}
