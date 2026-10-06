namespace TutorMatching.Application.Abstractions;

/// <summary>Expected failure codes, independent of HTTP status codes and Identity errors.</summary>
public enum AccountFailure
{
    InvalidInput = 1,
    DuplicateEmail,
    DuplicatePhoneNumber,
    InvalidCredentials,
    Forbidden,
    NotFound,
    InvalidResetCredential
}

public sealed class AccountOperationResult
{
    private AccountOperationResult(AccountProfile? account, AccountFailure? failure)
    {
        Account = account;
        Failure = failure;
    }

    public bool Succeeded => Failure is null;
    public AccountProfile? Account { get; }
    public AccountFailure? Failure { get; }

    /// <summary>Registration, sign-in and profile update return a profile; reset returns none.</summary>
    public static AccountOperationResult Success(AccountProfile? account = null) => new(account, null);

    public static AccountOperationResult Fail(AccountFailure failure) => new(null, failure);
}
