using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorMatching.Api.Contracts.Auth;
using TutorMatching.Api.Errors;
using TutorMatching.Application.Authentication.Register;

namespace TutorMatching.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public sealed class AuthController(RegisterAccountHandler registerHandler,
    TutorMatching.Application.Authentication.Sessions.SessionHandler sessions,
    TutorMatching.Application.Abstractions.ITokenSessionService tokens,
    TutorMatching.Api.Security.JwtCookieTokens cookies) : ControllerBase
{
    [HttpPost("login", Name = "login")]
    [AllowAnonymous]
    [Consumes("application/json")]
    [ProducesResponseType(typeof(AccountResponse), 200, "application/json")]
    [ProducesResponseType(typeof(ProblemDetails), 400, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), 401, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), 403, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), 422, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), 429, "application/problem+json")]
    public async Task<IActionResult> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        Response.Headers.CacheControl = "no-store";
        var result = await sessions.LoginAsync(request.Email, request.Password, cancellationToken);
        if (!result.Succeeded) return ApiProblems.FromFailure(HttpContext, result.Failure!.Value);
        var account = result.Account!;
        var grant = await tokens.CreateAsync(account.Id, cancellationToken);
        if (grant is null) return InvalidSession();
        cookies.Issue(HttpContext, grant);
        return Ok(new AccountResponse(account.Id, account.Email, account.FullName, account.Role, account.Status));
    }

    [HttpPost("refresh", Name = "refreshSession")]
    [AllowAnonymous] // The access JWT may be expired; the refresh credential is validated explicitly.
    [ProducesResponseType(204)]
    [ProducesResponseType(typeof(ProblemDetails), 400, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), 401, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), 429, "application/problem+json")]
    public async Task<IActionResult> Refresh(CancellationToken cancellationToken)
    {
        var grant = await tokens.RefreshAsync(Request.Cookies[TutorMatching.Api.Security.JwtCookieTokens.RefreshCookie] ?? string.Empty, cancellationToken);
        if (grant is null) return InvalidSession();
        cookies.Issue(HttpContext, grant);
        return NoContent();
    }

    [HttpPost("logout", Name = "logout")]
    [AllowAnonymous] // Logout also works after access expiry using the refresh cookie.
    [ProducesResponseType(204)]
    [ProducesResponseType(typeof(ProblemDetails), 400, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), 401, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), 429, "application/problem+json")]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        var revoked = await tokens.LogoutAsync(Request.Cookies[TutorMatching.Api.Security.JwtCookieTokens.RefreshCookie] ?? string.Empty, cancellationToken);
        if (!revoked) return InvalidSession();
        cookies.Clear(HttpContext);
        return NoContent();
    }

    private IActionResult InvalidSession()
    {
        cookies.Clear(HttpContext);
        return Problem(statusCode: 401, title: "Authentication required.");
    }

    [HttpPost("register", Name = "registerAccount")]
    [AllowAnonymous]
    [Consumes("application/json")]
    [ProducesResponseType(typeof(AccountResponse), StatusCodes.Status201Created, "application/json")]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status422UnprocessableEntity, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status429TooManyRequests, "application/problem+json")]
    public async Task<IActionResult> RegisterAsync(
        [FromBody] RegisterRequest request,
        CancellationToken cancellationToken)
    {
        var command = new RegisterAccountCommand(
            request.FullName,
            request.Email,
            request.PhoneNumber,
            request.Password,
            request.PasswordConfirmation,
            request.Role);

        var result = await registerHandler.HandleAsync(command, cancellationToken);

        if (!result.Succeeded)
        {
            return ApiProblems.FromFailure(HttpContext, result.Failure!.Value, result.Errors);
        }

        var account = result.Account!;
        var response = new AccountResponse(
            account.Id,
            account.Email,
            account.FullName,
            account.Role,
            account.Status);

        return StatusCode(StatusCodes.Status201Created, response);
    }
}
