using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorMatching.Api.Contracts.Auth;
using TutorMatching.Api.Errors;
using TutorMatching.Application.Abstractions;
using TutorMatching.Application.Authentication.Google;
using TutorMatching.Application.Authentication.Register;

namespace TutorMatching.Api.Controllers;

[ApiController]
[Route("auth")]
public sealed class AuthController(RegisterAccountHandler registerHandler,
    TutorMatching.Application.Authentication.Sessions.SessionHandler sessions,
    TutorMatching.Application.Abstractions.ITokenSessionService tokens,
    TutorMatching.Api.Security.JwtCookieTokens cookies,
    GoogleSignInHandler googleSignIn,
    CompleteGoogleRegistrationHandler completeGoogleRegistration) : ControllerBase
{
    private const string GoogleSignInFailedTitle = "Google sign-in failed.";

    /// <summary>Signs in with a Google ID token, auto-linking a same-email account, or asks for a role (202).</summary>
    [HttpPost("google", Name = "googleSignIn")]
    [AllowAnonymous]
    [Consumes("application/json")]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK, "application/json")]
    [ProducesResponseType(typeof(GoogleRegistrationRequired), StatusCodes.Status202Accepted, "application/json")]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status429TooManyRequests, "application/problem+json")]
    public async Task<IActionResult> GoogleSignIn(GoogleSignInRequest request, CancellationToken cancellationToken)
    {
        Response.Headers.CacheControl = "no-store";
        var result = await googleSignIn.HandleAsync(request.Credential, cancellationToken);
        return result.Outcome switch
        {
            GoogleSignInOutcome.SignedIn => await IssueSessionAsync(result.Account!, StatusCodes.Status200OK, cancellationToken),
            GoogleSignInOutcome.RoleRequired => StatusCode(StatusCodes.Status202Accepted, new GoogleRegistrationRequired(
                GoogleRegistrationRequired.RoleRequiredStatus,
                result.PendingToken!,
                result.Identity!.Email,
                CompleteGoogleRegistrationHandler.NormalizeFullName(result.Identity.FullName, result.Identity.Email),
                result.Identity.PictureUrl)),
            GoogleSignInOutcome.InvalidInput => Problem(statusCode: StatusCodes.Status400BadRequest, title: "Invalid request."),
            _ => GoogleSignInFailed()
        };
    }

    /// <summary>Creates the account for a pending Google registration with role LEARNER or TUTOR and signs in.</summary>
    [HttpPost("google/complete", Name = "completeGoogleRegistration")]
    [AllowAnonymous]
    [Consumes("application/json")]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status201Created, "application/json")]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status429TooManyRequests, "application/problem+json")]
    public async Task<IActionResult> CompleteGoogleRegistration(CompleteGoogleRegistrationRequest request,
        CancellationToken cancellationToken)
    {
        Response.Headers.CacheControl = "no-store";
        var result = await completeGoogleRegistration.HandleAsync(request.PendingToken, request.Role, cancellationToken);
        return result.Outcome switch
        {
            GoogleSignInOutcome.SignedIn => await IssueSessionAsync(result.Account!, StatusCodes.Status201Created, cancellationToken),
            GoogleSignInOutcome.InvalidInput => Problem(statusCode: StatusCodes.Status400BadRequest, title: "Invalid request."),
            _ => GoogleSignInFailed()
        };
    }

    private async Task<IActionResult> IssueSessionAsync(AccountProfile account, int statusCode,
        CancellationToken cancellationToken)
    {
        var grant = await tokens.CreateAsync(account.Id, cancellationToken);
        if (grant is null) return GoogleSignInFailed();
        var accessToken = cookies.Issue(HttpContext, grant);
        return StatusCode(statusCode, new LoginResponse(account.Id, account.Email, account.FullName, account.Role,
            account.Status, accessToken, grant.RefreshToken, account.AvatarUrl, account.TutorProfileStatus));
    }

    private IActionResult GoogleSignInFailed()
    {
        cookies.Clear(HttpContext);
        return Problem(statusCode: StatusCodes.Status401Unauthorized, title: GoogleSignInFailedTitle);
    }

    [HttpPost("login", Name = "login")]
    [AllowAnonymous]
    [Consumes("application/json")]
    [ProducesResponseType(typeof(LoginResponse), 200, "application/json")]
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
        var accessToken = cookies.Issue(HttpContext, grant);
        return Ok(new LoginResponse(account.Id, account.Email, account.FullName, account.Role, account.Status,
            accessToken, grant.RefreshToken, account.AvatarUrl, account.TutorProfileStatus));
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
            account.Status,
            account.TutorProfileStatus);

        return StatusCode(StatusCodes.Status201Created, response);
    }
}
