using TutorMatching.Application.Abstractions;

namespace TutorMatching.Application.Authentication.Sessions;

public sealed class SessionHandler(IAccountService accounts)
{
    public Task<AccountOperationResult> LoginAsync(string email, string password, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(email) || email.Trim().Length > 256 ||
            string.IsNullOrEmpty(password) || password.Length > 128)
            return Task.FromResult(AccountOperationResult.Fail(AccountFailure.InvalidCredentials));
        return accounts.SignInAsync(email.Trim(), password, cancellationToken);
    }

    public Task LogoutAsync(CancellationToken cancellationToken = default) => accounts.SignOutAsync(cancellationToken);
}
