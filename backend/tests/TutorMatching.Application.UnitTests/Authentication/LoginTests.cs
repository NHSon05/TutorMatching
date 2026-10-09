using TutorMatching.Application.Abstractions;
using TutorMatching.Application.Authentication.Sessions;
using TutorMatching.Domain.Users;

namespace TutorMatching.Application.UnitTests.Authentication;

public sealed class LoginTests
{
    [Theory]
    [InlineData("", "password")]
    [InlineData("learner@example.com", "")]
    public async Task InvalidCredentialsDoNotReachIdentity(string email, string password)
    {
        var accounts = new Accounts();
        var result = await new SessionHandler(accounts).LoginAsync(email, password);
        Assert.Equal(AccountFailure.InvalidCredentials, result.Failure);
        Assert.Equal(0, accounts.Attempts);
    }
    [Fact]
    public async Task LoginTrimsEmailAndPreservesPasswordAndFailure()
    {
        var accounts = new Accounts();
        var result = await new SessionHandler(accounts).LoginAsync("  learner@example.com  ", " password ");
        Assert.Equal("learner@example.com", accounts.Email);
        Assert.Equal(" password ", accounts.Password);
        Assert.Equal(AccountFailure.InvalidCredentials, result.Failure);
    }
    private sealed class Accounts : IAccountService
    {
        public int Attempts { get; private set; }
        public string? Email { get; private set; }
        public string? Password { get; private set; }
        public Task<AccountOperationResult> SignInAsync(string email, string password, CancellationToken cancellationToken = default)
        {
            Attempts++; Email = email; Password = password;
            return Task.FromResult(AccountOperationResult.Fail(AccountFailure.InvalidCredentials));
        }
        public Task<AccountOperationResult> RegisterAsync(string fullName, string email, string? phoneNumber, string password, AccountRole role, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task SignOutAsync(CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<AccountProfile?> GetProfileAsync(Guid userId, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<AccountOperationResult> UpdateProfileAsync(Guid userId, ProfileUpdate update, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task RequestPasswordResetAsync(string email, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<AccountOperationResult> ResetPasswordAsync(string email, string token, string newPassword, CancellationToken cancellationToken = default) => throw new NotSupportedException();
    }
}
