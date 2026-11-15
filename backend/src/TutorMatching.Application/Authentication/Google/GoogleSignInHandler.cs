using TutorMatching.Application.Abstractions;

namespace TutorMatching.Application.Authentication.Google;

/// <summary>
/// Verifies a Google ID token and resolves it to a linked account, an auto-linked same-email account,
/// or a pending registration that needs a role. All refusals collapse into one generic outcome.
/// </summary>
public sealed class GoogleSignInHandler(
    IGoogleIdTokenVerifier verifier,
    IExternalAccountService accounts,
    IPendingGoogleRegistrationProtector pendingProtector,
    IAuditWriter auditWriter)
{
    public const int MaximumCredentialLength = 4096;

    public async Task<GoogleSignInResult> HandleAsync(string? credential, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(credential) || credential.Length > MaximumCredentialLength)
        {
            return GoogleSignInResult.InvalidInput();
        }

        var identity = await verifier.VerifyAsync(credential, cancellationToken);
        if (identity is null || !identity.EmailVerified)
        {
            await auditWriter.WriteAsync(
                new AccountAuditEntry(AccountAuditAction.ExternalSignInFailed, null, null), cancellationToken);
            return GoogleSignInResult.Refused();
        }

        var result = await accounts.SignInWithExternalLoginAsync(identity, cancellationToken);
        if (result.Succeeded && result.Account is not null)
        {
            return GoogleSignInResult.SignedIn(result.Account);
        }

        return result.Failure == AccountFailure.NotFound
            ? GoogleSignInResult.RoleRequired(pendingProtector.Protect(identity), identity)
            : GoogleSignInResult.Refused();
    }
}
