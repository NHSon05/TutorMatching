using TutorMatching.Application.Abstractions;
using TutorMatching.Application.Authentication.Google;
using TutorMatching.Domain.Users;

namespace TutorMatching.Application.UnitTests.Authentication;

public sealed class GoogleSignInHandlerTests
{
    private static readonly ExternalIdentity Verified = new("sub-1", "user@gmail.com", true, "Google User", null);

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task MissingCredentialIsInvalidInput(string? credential)
    {
        var (handler, accounts, _) = Create(Verified);
        var result = await handler.HandleAsync(credential);
        Assert.Equal(GoogleSignInOutcome.InvalidInput, result.Outcome);
        Assert.Equal(0, accounts.SignInCalls);
    }

    [Fact]
    public async Task OversizedCredentialIsInvalidInput()
    {
        var (handler, _, _) = Create(Verified);
        var result = await handler.HandleAsync(new string('a', GoogleSignInHandler.MaximumCredentialLength + 1));
        Assert.Equal(GoogleSignInOutcome.InvalidInput, result.Outcome);
    }

    [Fact]
    public async Task UnverifiableCredentialIsRefusedAndAudited()
    {
        var (handler, accounts, audit) = Create(identity: null);
        var result = await handler.HandleAsync("token");
        Assert.Equal(GoogleSignInOutcome.Refused, result.Outcome);
        Assert.Equal(0, accounts.SignInCalls);
        Assert.Contains(audit.Entries, e => e.Action == AccountAuditAction.ExternalSignInFailed);
    }

    [Fact]
    public async Task UnverifiedEmailIsRefused()
    {
        var (handler, accounts, _) = Create(Verified with { EmailVerified = false });
        var result = await handler.HandleAsync("token");
        Assert.Equal(GoogleSignInOutcome.Refused, result.Outcome);
        Assert.Equal(0, accounts.SignInCalls);
    }

    [Fact]
    public async Task LinkedAccountSignsIn()
    {
        var account = new AccountProfile(Guid.NewGuid(), "user@gmail.com", "Google User", AccountRole.LEARNER,
            AccountStatus.ACTIVE, null, null, null);
        var (handler, _, _) = Create(Verified, AccountOperationResult.Success(account));
        var result = await handler.HandleAsync("token");
        Assert.Equal(GoogleSignInOutcome.SignedIn, result.Outcome);
        Assert.Same(account, result.Account);
    }

    [Fact]
    public async Task UnknownEmailReturnsProtectedPendingRegistration()
    {
        var (handler, _, _) = Create(Verified, AccountOperationResult.Fail(AccountFailure.NotFound));
        var result = await handler.HandleAsync("token");
        Assert.Equal(GoogleSignInOutcome.RoleRequired, result.Outcome);
        Assert.Equal("protected:sub-1", result.PendingToken);
        Assert.Equal(Verified, result.Identity);
    }

    [Fact]
    public async Task AccountRefusalIsGeneric()
    {
        var (handler, _, _) = Create(Verified, AccountOperationResult.Fail(AccountFailure.InvalidCredentials));
        var result = await handler.HandleAsync("token");
        Assert.Equal(GoogleSignInOutcome.Refused, result.Outcome);
        Assert.Null(result.PendingToken);
    }

    [Theory]
    [InlineData("LEARNER", AccountRole.LEARNER)]
    [InlineData("tutor", AccountRole.TUTOR)]
    public async Task CompleteAcceptsLearnerAndTutor(string role, AccountRole expected)
    {
        var accounts = new FakeExternalAccounts();
        var handler = new CompleteGoogleRegistrationHandler(new FakeProtector(Verified), accounts);
        var result = await handler.HandleAsync("pending", role);
        Assert.Equal(GoogleSignInOutcome.SignedIn, result.Outcome);
        Assert.Equal(expected, accounts.RegisteredRole);
    }

    [Theory]
    [InlineData("ADMIN")]
    [InlineData("")]
    [InlineData(null)]
    [InlineData("PARENT")]
    public async Task CompleteRejectsOtherRoles(string? role)
    {
        var accounts = new FakeExternalAccounts();
        var handler = new CompleteGoogleRegistrationHandler(new FakeProtector(Verified), accounts);
        var result = await handler.HandleAsync("pending", role);
        Assert.Equal(GoogleSignInOutcome.InvalidInput, result.Outcome);
        Assert.Null(accounts.RegisteredRole);
    }

    [Fact]
    public async Task CompleteRefusesExpiredOrTamperedToken()
    {
        var accounts = new FakeExternalAccounts();
        var handler = new CompleteGoogleRegistrationHandler(new FakeProtector(null), accounts);
        var result = await handler.HandleAsync("pending", "LEARNER");
        Assert.Equal(GoogleSignInOutcome.Refused, result.Outcome);
        Assert.Null(accounts.RegisteredRole);
    }

    [Theory]
    [InlineData("  Nguyễn Văn A  ", "a@gmail.com", "Nguyễn Văn A")]
    [InlineData("A", "john.doe@gmail.com", "john.doe")]
    [InlineData(null, "x@gmail.com", "Người dùng Google")]
    public void FullNameIsNormalized(string? name, string email, string expected) =>
        Assert.Equal(expected, CompleteGoogleRegistrationHandler.NormalizeFullName(name, email));

    [Fact]
    public void LongFullNameIsTruncatedTo100Characters() =>
        Assert.Equal(100, CompleteGoogleRegistrationHandler.NormalizeFullName(new string('n', 150), "a@gmail.com").Length);

    private static (GoogleSignInHandler, FakeExternalAccounts, FakeAudit) Create(ExternalIdentity? identity,
        AccountOperationResult? signIn = null)
    {
        var accounts = new FakeExternalAccounts { SignInResult = signIn ?? AccountOperationResult.Fail(AccountFailure.NotFound) };
        var audit = new FakeAudit();
        return (new GoogleSignInHandler(new FakeVerifier(identity), accounts, new FakeProtector(identity), audit),
            accounts, audit);
    }

    private sealed class FakeVerifier(ExternalIdentity? identity) : IGoogleIdTokenVerifier
    {
        public Task<ExternalIdentity?> VerifyAsync(string credential, CancellationToken cancellationToken = default) =>
            Task.FromResult(identity);
    }

    private sealed class FakeProtector(ExternalIdentity? identity) : IPendingGoogleRegistrationProtector
    {
        public string Protect(ExternalIdentity value) => $"protected:{value.Subject}";
        public ExternalIdentity? Unprotect(string token) => identity;
    }

    private sealed class FakeAudit : IAuditWriter
    {
        public List<AccountAuditEntry> Entries { get; } = [];

        public Task WriteAsync(AccountAuditEntry entry, CancellationToken cancellationToken = default)
        {
            Entries.Add(entry);
            return Task.CompletedTask;
        }
    }

    private sealed class FakeExternalAccounts : IExternalAccountService
    {
        public AccountOperationResult SignInResult { get; init; } = AccountOperationResult.Fail(AccountFailure.NotFound);
        public int SignInCalls { get; private set; }
        public AccountRole? RegisteredRole { get; private set; }

        public Task<AccountOperationResult> SignInWithExternalLoginAsync(ExternalIdentity identity,
            CancellationToken cancellationToken = default)
        {
            SignInCalls++;
            return Task.FromResult(SignInResult);
        }

        public Task<AccountOperationResult> RegisterExternalAsync(ExternalIdentity identity, AccountRole role,
            CancellationToken cancellationToken = default)
        {
            RegisteredRole = role;
            return Task.FromResult(AccountOperationResult.Success(new AccountProfile(Guid.NewGuid(), identity.Email,
                identity.FullName!, role, AccountStatus.ACTIVE, null, null, identity.PictureUrl)));
        }
    }
}
