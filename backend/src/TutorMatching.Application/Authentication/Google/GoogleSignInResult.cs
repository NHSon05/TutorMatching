using TutorMatching.Application.Abstractions;

namespace TutorMatching.Application.Authentication.Google;

public enum GoogleSignInOutcome
{
    /// <summary>A session may be issued for <see cref="GoogleSignInResult.Account"/>.</summary>
    SignedIn = 1,
    /// <summary>Verified identity without an account; the client must choose a role.</summary>
    RoleRequired,
    /// <summary>Generic refusal (invalid credential, unverified email, admin, locked, conflict, expired).</summary>
    Refused,
    /// <summary>Malformed request (missing/oversized credential or token, unsupported role).</summary>
    InvalidInput
}

public sealed record GoogleSignInResult(
    GoogleSignInOutcome Outcome,
    AccountProfile? Account = null,
    string? PendingToken = null,
    ExternalIdentity? Identity = null)
{
    public static GoogleSignInResult SignedIn(AccountProfile account) => new(GoogleSignInOutcome.SignedIn, account);

    public static GoogleSignInResult RoleRequired(string pendingToken, ExternalIdentity identity) =>
        new(GoogleSignInOutcome.RoleRequired, PendingToken: pendingToken, Identity: identity);

    public static GoogleSignInResult Refused() => new(GoogleSignInOutcome.Refused);

    public static GoogleSignInResult InvalidInput() => new(GoogleSignInOutcome.InvalidInput);
}
