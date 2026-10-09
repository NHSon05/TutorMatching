using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorMatching.Application.Abstractions;
using TutorMatching.Api.Contracts.Auth;

namespace TutorMatching.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/users")]
public sealed class UsersController(ICurrentUser currentUser, IAccountService accounts) : ControllerBase
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
        if (currentUser.UserId is not { } id) return Unauthorized();
        var account = await accounts.GetProfileAsync(id, cancellationToken);
        return account is null ? Unauthorized() : Ok(new PersonalProfileResponse(
            account.Id, account.Email, account.FullName, account.Role, account.Status,
            account.PhoneNumber, account.DateOfBirth, account.AvatarUrl));
    }
}
