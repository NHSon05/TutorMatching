using TutorMatching.Domain.Users;

namespace TutorMatching.Application.Abstractions;

/// <summary>
/// Account operations driven by a verified external identity (Google). Kept separate from
/// <see cref="IAccountService"/> so password-based account flows and their test doubles stay unchanged.
/// </summary>
public interface IExternalAccountService
{
    /// <summary>
    /// Signs in the account linked to the identity, or links and signs in an eligible account with the
    /// same email. Returns <see cref="AccountFailure.NotFound"/> only when no account uses the email
    /// (registration required). Every refusal (administrator, locked or deleted account, unverified email,
    /// email linked to another identity) returns <see cref="AccountFailure.InvalidCredentials"/>.
    /// </summary>
    Task<AccountOperationResult> SignInWithExternalLoginAsync(ExternalIdentity identity,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Atomically creates an active, password-less account linked to the identity (plus a draft tutor
    /// profile for <see cref="AccountRole.TUTOR"/>). Only <see cref="AccountRole.LEARNER"/> and
    /// <see cref="AccountRole.TUTOR"/> are accepted. If the identity was registered concurrently, signs
    /// into that account instead.
    /// </summary>
    Task<AccountOperationResult> RegisterExternalAsync(ExternalIdentity identity, AccountRole role,
        CancellationToken cancellationToken = default);
}
