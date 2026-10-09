using TutorMatching.Application.Abstractions;

namespace TutorMatching.Application.Authentication.Register;

public sealed record RegisterAccountCommand(
    string FullName,
    string Email,
    string? PhoneNumber,
    string Password,
    string PasswordConfirmation,
    string Role);

public sealed record RegisterAccountResult(
    bool Succeeded,
    AccountProfile? Account = null,
    AccountFailure? Failure = null,
    IReadOnlyDictionary<string, string[]>? Errors = null)
{
    public static RegisterAccountResult Success(AccountProfile account) =>
        new(true, Account: account);

    public static RegisterAccountResult Fail(AccountFailure failure, IReadOnlyDictionary<string, string[]>? errors = null) =>
        new(false, Failure: failure, Errors: errors);
}
