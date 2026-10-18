using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorMatching.Application.Abstractions;
using TutorMatching.Api.Contracts.Auth;
using TutorMatching.Api.Contracts.Users;
using TutorMatching.Api.Errors;
using TutorMatching.Application.Users.Profile;

namespace TutorMatching.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/users")]
public sealed class UsersController(ICurrentUser currentUser, IAccountService accounts,
    CurrentProfileHandler profiles) : ControllerBase
{
    [HttpGet("me/access/{role}", Name = "checkRoleAccess")]
    [ProducesResponseType(204)]
    [ProducesResponseType(typeof(ProblemDetails), 401, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), 403, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), 429, "application/problem+json")]
    public async Task<IActionResult> Access(string role, CancellationToken cancellationToken)
    {
        Response.Headers.CacheControl = "no-store";
        if (currentUser.UserId is not { } id) return Unauthorized();
        var account = await accounts.GetProfileAsync(id, cancellationToken);
        if (account is null) return Unauthorized();
        if (!Enum.TryParse<TutorMatching.Domain.Users.AccountRole>(role, out var required) ||
            !TutorMatching.Application.Authorization.AccountPolicy.Allows(account.Status, account.Role, required))
            return Forbid();
        return NoContent();
    }
    [HttpGet("me", Name = "getCurrentProfile")]
    [ProducesResponseType(typeof(PersonalProfileResponse), 200, "application/json")]
    [ProducesResponseType(typeof(ProblemDetails), 401, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), 429, "application/problem+json")]
    public async Task<IActionResult> Me(CancellationToken cancellationToken)
    {
        Response.Headers.CacheControl = "no-store";
        var result = await profiles.GetAsync(cancellationToken);
        return ProfileResponse(result);
    }

    [HttpPut("me", Name = "updateCurrentProfile")]
    [Authorize(Roles = "TUTOR,LEARNER")]
    [Consumes("application/json")]
    [ProducesResponseType(typeof(PersonalProfileResponse), 200, "application/json")]
    [ProducesResponseType(typeof(ProblemDetails), 400, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), 401, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), 403, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), 409, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), 422, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), 429, "application/problem+json")]
    public async Task<IActionResult> Update(UpdateProfileRequest request, CancellationToken cancellationToken)
    {
        Response.Headers.CacheControl = "no-store";
        var result = await profiles.UpdateAsync(new(request.FullName, request.PhoneNumber,
            request.DateOfBirth, request.AvatarUrl), cancellationToken);
        return ProfileResponse(result);
    }

    private IActionResult ProfileResponse(ProfileResult result)
    {
        if (result.Failure is { } failure)
            return ApiProblems.FromFailure(HttpContext, failure, result.Errors);
        var account = result.Account!;
        return Ok(new PersonalProfileResponse(account.Id, account.Email, account.FullName, account.Role,
            account.Status, account.PhoneNumber, account.DateOfBirth, account.AvatarUrl, account.TutorProfileStatus));
    }
}
