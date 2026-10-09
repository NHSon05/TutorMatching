using System.Net.Mail;
using TutorMatching.Application.Abstractions;
using TutorMatching.Domain.Users;

namespace TutorMatching.Application.Authentication.Register;

public sealed class RegisterAccountHandler(IAccountService accountService)
{
    public const int MaximumPasswordLength = 128;

    private static readonly HashSet<string> AllowedRoles = new(StringComparer.OrdinalIgnoreCase)
    {
        AccountRole.LEARNER.ToString(),
        AccountRole.TUTOR.ToString()
    };

    public async Task<RegisterAccountResult> HandleAsync(
        RegisterAccountCommand command,
        CancellationToken cancellationToken = default)
    {
        var errors = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);

        // 1. Validate FullName
        var trimmedFullName = command.FullName?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(trimmedFullName) || trimmedFullName.Length < 2 || trimmedFullName.Length > 100)
        {
            AddError(errors, "fullName", "Full name must be between 2 and 100 characters.");
        }

        // 2. Validate Email
        var rawEmail = command.Email?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(rawEmail) || rawEmail.Length > 256 ||
            !MailAddress.TryCreate(rawEmail, out var address) ||
            !string.Equals(address.Address, rawEmail, StringComparison.Ordinal))
        {
            AddError(errors, "email", "A valid email address is required.");
        }

        var phoneNumber = string.IsNullOrWhiteSpace(command.PhoneNumber)
            ? null
            : command.PhoneNumber.Trim();
        if (phoneNumber is { Length: > 32 })
        {
            AddError(errors, "phoneNumber", "Phone number must not exceed 32 characters.");
        }

        // 3. Validate Role
        if (string.IsNullOrWhiteSpace(command.Role) ||
            !AllowedRoles.Contains(command.Role) ||
            !Enum.TryParse<AccountRole>(command.Role, true, out var parsedRole) ||
            parsedRole is AccountRole.ADMIN)
        {
            AddError(errors, "role", "Only LEARNER and TUTOR roles are permitted for public registration.");
        }

        // 4. Validate Password
        if (string.IsNullOrEmpty(command.Password) || command.Password.Length < 8)
        {
            AddError(errors, "password", "Password must be at least 8 characters long.");
        }
        else if (command.Password.Length > MaximumPasswordLength)
        {
            AddError(errors, "password", $"Password must not exceed {MaximumPasswordLength} characters.");
        }

        // 5. Validate PasswordConfirmation
        if (!string.Equals(command.Password, command.PasswordConfirmation, StringComparison.Ordinal))
        {
            AddError(errors, "passwordConfirmation", "Password confirmation does not match password.");
        }

        if (errors.Count > 0)
        {
            return RegisterAccountResult.Fail(
                AccountFailure.InvalidInput,
                errors.ToDictionary(k => k.Key, v => v.Value.ToArray()));
        }

        Enum.TryParse<AccountRole>(command.Role, true, out var role);
        var result = await accountService.RegisterAsync(
            trimmedFullName,
            rawEmail,
            phoneNumber,
            command.Password,
            role,
            cancellationToken);

        if (!result.Succeeded)
        {
            return RegisterAccountResult.Fail(result.Failure ?? AccountFailure.InvalidInput);
        }

        return RegisterAccountResult.Success(result.Account!);
    }

    private static void AddError(Dictionary<string, List<string>> errors, string key, string message)
    {
        if (!errors.TryGetValue(key, out var list))
        {
            list = new List<string>();
            errors[key] = list;
        }
        list.Add(message);
    }
}
