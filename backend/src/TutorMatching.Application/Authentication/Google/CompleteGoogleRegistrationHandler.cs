using TutorMatching.Application.Abstractions;
using TutorMatching.Domain.Users;

namespace TutorMatching.Application.Authentication.Google;

/// <summary>
/// Creates the account for a pending Google registration once the visitor has chosen LEARNER or TUTOR.
/// </summary>
public sealed class CompleteGoogleRegistrationHandler(
    IPendingGoogleRegistrationProtector pendingProtector,
    IExternalAccountService accounts)
{
    public const int MaximumPendingTokenLength = 4096;
    public const int MinimumFullNameLength = 2;
    public const int MaximumFullNameLength = 100;
    private const string FallbackFullName = "Người dùng Google";

    public async Task<GoogleSignInResult> HandleAsync(string? pendingToken, string? role,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(pendingToken) || pendingToken.Length > MaximumPendingTokenLength ||
            !TryParseRole(role, out var accountRole))
        {
            return GoogleSignInResult.InvalidInput();
        }

        var identity = pendingProtector.Unprotect(pendingToken);
        if (identity is null || !identity.EmailVerified)
        {
            return GoogleSignInResult.Refused();
        }

        var normalized = identity with { FullName = NormalizeFullName(identity.FullName, identity.Email) };
        var result = await accounts.RegisterExternalAsync(normalized, accountRole, cancellationToken);
        if (result.Succeeded && result.Account is not null)
        {
            return GoogleSignInResult.SignedIn(result.Account);
        }

        return result.Failure == AccountFailure.InvalidInput
            ? GoogleSignInResult.InvalidInput()
            : GoogleSignInResult.Refused();
    }

    /// <summary>Only LEARNER and TUTOR may be self-selected; ADMIN is never accepted.</summary>
    public static bool TryParseRole(string? role, out AccountRole accountRole)
    {
        accountRole = default;
        if (string.IsNullOrWhiteSpace(role)) return false;
        var value = role.Trim();
        if (string.Equals(value, nameof(AccountRole.LEARNER), StringComparison.OrdinalIgnoreCase))
        {
            accountRole = AccountRole.LEARNER;
            return true;
        }

        if (string.Equals(value, nameof(AccountRole.TUTOR), StringComparison.OrdinalIgnoreCase))
        {
            accountRole = AccountRole.TUTOR;
            return true;
        }

        return false;
    }

    /// <summary>Trimmed Google name; falls back to the email local part; truncated to 100 characters.</summary>
    public static string NormalizeFullName(string? fullName, string email)
    {
        var name = fullName?.Trim() ?? string.Empty;
        if (name.Length < MinimumFullNameLength)
        {
            var at = email.IndexOf('@');
            name = (at > 0 ? email[..at] : email).Trim();
        }

        if (name.Length < MinimumFullNameLength)
        {
            name = FallbackFullName;
        }

        return name.Length > MaximumFullNameLength ? name[..MaximumFullNameLength].TrimEnd() : name;
    }
}
