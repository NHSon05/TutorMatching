using TutorMatching.Application.Abstractions;
using TutorMatching.Application.Authentication.Register;
using TutorMatching.Domain.Users;

namespace TutorMatching.Application.UnitTests.Authentication;

public sealed class RegisterAccountTests
{
    [Theory]
    [InlineData("LEARNER", AccountRole.LEARNER)]
    [InlineData("TUTOR", AccountRole.TUTOR)]
    public async Task AllowedRolesArePassedToTheAccountService(string role, AccountRole expected)
    {
        var service = new FakeAccountService();
        var handler = new RegisterAccountHandler(service);

        var result = await handler.HandleAsync(ValidCommand(role));

        Assert.True(result.Succeeded);
        Assert.Equal(expected, service.LastRole);
    }

    [Theory]
    [InlineData("ADMIN")]
    [InlineData("MODERATOR")]
    public async Task PublicRegistrationRejectsDisallowedRoles(string role)
    {
        var service = new FakeAccountService();
        var handler = new RegisterAccountHandler(service);

        var result = await handler.HandleAsync(ValidCommand(role));

        Assert.Equal(AccountFailure.InvalidInput, result.Failure);
        Assert.Contains("role", result.Errors!);
        Assert.Equal(0, service.RegistrationAttempts);
    }

    [Fact]
    public async Task PasswordConfirmationMustMatch()
    {
        var service = new FakeAccountService();
        var handler = new RegisterAccountHandler(service);
        var command = ValidCommand() with { PasswordConfirmation = "different" };

        var result = await handler.HandleAsync(command);

        Assert.Equal(AccountFailure.InvalidInput, result.Failure);
        Assert.Contains("passwordConfirmation", result.Errors!);
        Assert.Equal(0, service.RegistrationAttempts);
    }

    [Fact]
    public async Task PasswordMustContainAtLeastEightCharacters()
    {
        var service = new FakeAccountService();
        var handler = new RegisterAccountHandler(service);
        var command = ValidCommand() with { Password = "short", PasswordConfirmation = "short" };

        var result = await handler.HandleAsync(command);

        Assert.Equal(AccountFailure.InvalidInput, result.Failure);
        Assert.Contains("password", result.Errors!);
        Assert.Equal(0, service.RegistrationAttempts);
    }

    [Fact]
    public async Task PasswordLongerThanTheMaximumIsRejectedBeforePersistence()
    {
        var service = new FakeAccountService();
        var handler = new RegisterAccountHandler(service);
        var oversizedPassword = new string('a', RegisterAccountHandler.MaximumPasswordLength + 1);
        var command = ValidCommand() with
        {
            Password = oversizedPassword,
            PasswordConfirmation = oversizedPassword
        };

        var result = await handler.HandleAsync(command);

        Assert.Equal(AccountFailure.InvalidInput, result.Failure);
        Assert.Contains("password", result.Errors!);
        Assert.Equal(0, service.RegistrationAttempts);
    }

    [Fact]
    public async Task NormalizedDuplicateEmailIsReturnedAsAConflict()
    {
        var service = new FakeAccountService("learner@example.com");
        var handler = new RegisterAccountHandler(service);

        var result = await handler.HandleAsync(ValidCommand() with
        {
            Email = "  LEARNER@example.com "
        });

        Assert.Equal(AccountFailure.DuplicateEmail, result.Failure);
        Assert.Equal("LEARNER@example.com", service.LastEmail);
    }

    [Fact]
    public async Task EmailLongerThanTheStorageLimitIsRejectedBeforePersistence()
    {
        var service = new FakeAccountService();
        var handler = new RegisterAccountHandler(service);
        var email = new string('a', 250) + "@example.com";

        var result = await handler.HandleAsync(ValidCommand() with { Email = email });

        Assert.Equal(AccountFailure.InvalidInput, result.Failure);
        Assert.Contains("email", result.Errors!);
        Assert.Equal(0, service.RegistrationAttempts);
    }

    [Fact]
    public async Task DisplayNameEmailSyntaxIsRejectedBeforePersistence()
    {
        var service = new FakeAccountService();
        var handler = new RegisterAccountHandler(service);

        var result = await handler.HandleAsync(ValidCommand() with
        {
            Email = "Learner <learner@example.com>"
        });

        Assert.Equal(AccountFailure.InvalidInput, result.Failure);
        Assert.Contains("email", result.Errors!);
        Assert.Equal(0, service.RegistrationAttempts);
    }

    [Fact]
    public async Task PhoneNumberIsTrimmedBeforePersistence()
    {
        var service = new FakeAccountService();
        var handler = new RegisterAccountHandler(service);

        var result = await handler.HandleAsync(ValidCommand() with { PhoneNumber = "  +84 912 345 678  " });

        Assert.True(result.Succeeded);
        Assert.Equal("+84 912 345 678", service.LastPhoneNumber);
    }

    [Fact]
    public async Task PhoneNumberLongerThanStorageLimitIsRejectedBeforePersistence()
    {
        var service = new FakeAccountService();
        var handler = new RegisterAccountHandler(service);

        var result = await handler.HandleAsync(ValidCommand() with { PhoneNumber = new string('1', 33) });

        Assert.Equal(AccountFailure.InvalidInput, result.Failure);
        Assert.Contains("phoneNumber", result.Errors!);
        Assert.Equal(0, service.RegistrationAttempts);
    }

    private static RegisterAccountCommand ValidCommand(string role = "LEARNER") => new(
        "Nguyen Van A", "learner@example.com", null, "password", "password", role);

    private sealed class FakeAccountService(params string[] existingEmails) : IAccountService
    {
        private readonly HashSet<string> normalizedEmails = existingEmails
            .Select(email => email.Trim().ToUpperInvariant())
            .ToHashSet(StringComparer.Ordinal);

        public int RegistrationAttempts { get; private set; }
        public string? LastEmail { get; private set; }
        public string? LastPhoneNumber { get; private set; }
        public AccountRole? LastRole { get; private set; }

        public Task<AccountOperationResult> RegisterAsync(string fullName, string email, string? phoneNumber, string password,
            AccountRole role, CancellationToken cancellationToken = default)
        {
            RegistrationAttempts++;
            LastEmail = email;
            LastPhoneNumber = phoneNumber;
            LastRole = role;
            if (normalizedEmails.Contains(email.ToUpperInvariant()))
                return Task.FromResult(AccountOperationResult.Fail(AccountFailure.DuplicateEmail));

            return Task.FromResult(AccountOperationResult.Success(new AccountProfile(
                Guid.NewGuid(), email, fullName, role, AccountStatus.ACTIVE, phoneNumber, null, null)));
        }

        public Task<AccountOperationResult> SignInAsync(string email, string password, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task SignOutAsync(CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<AccountProfile?> GetProfileAsync(Guid userId, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<AccountOperationResult> UpdateProfileAsync(Guid userId, ProfileUpdate update, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task RequestPasswordResetAsync(string email, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<AccountOperationResult> ResetPasswordAsync(string email, string token, string newPassword, CancellationToken cancellationToken = default) => throw new NotSupportedException();
    }
}
