using TutorMatching.Application.Abstractions;
using TutorMatching.Application.Users.Profile;
using TutorMatching.Domain.Users;

namespace TutorMatching.Application.UnitTests.Users;

public sealed class UpdateProfileTests
{
    private static readonly DateTimeOffset Now = new(2026, 10, 16, 0, 0, 0, TimeSpan.Zero);

    [Theory]
    [InlineData(AccountRole.LEARNER)]
    [InlineData(AccountRole.TUTOR)]
    public async Task UpdatesOnlyCurrentOwnerAndNormalizesFields(AccountRole role)
    {
        var accounts = new Accounts(role);
        var result = await Handler(accounts).UpdateAsync(new("  New Name  ", "  +841234  ",
            new DateOnly(2000, 1, 1), "  /uploads/avatars/photo.jpg  "));
        Assert.Null(result.Failure);
        Assert.Equal(accounts.Profile!.Id, accounts.UpdatedId);
        Assert.Equal(new ProfileUpdate("New Name", "+841234", new(2000, 1, 1), "/uploads/avatars/photo.jpg"), accounts.Update);
        Assert.Equal("current@example.com", result.Account!.Email);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("  ")]
    [InlineData(" x ")]
    public async Task RejectsMissingOrShortName(string? name)
    {
        var accounts = new Accounts();
        var result = await Handler(accounts).UpdateAsync(new(name));
        Assert.Equal(AccountFailure.InvalidInput, result.Failure);
        Assert.Contains("fullName", result.Errors!.Keys);
        Assert.Null(accounts.Update);
    }

    [Theory]
    [InlineData(2, true)]
    [InlineData(100, true)]
    [InlineData(101, false)]
    public async Task ValidatesTrimmedNameBoundary(int length, bool valid)
    {
        var accounts = new Accounts();
        var result = await Handler(accounts).UpdateAsync(new($"  {new string('x', length)}  "));
        Assert.Equal(valid, result.Failure is null);
        Assert.Equal(valid, accounts.Update is not null);
    }

    [Theory]
    [InlineData(-1, true)]
    [InlineData(0, false)]
    [InlineData(1, false)]
    public async Task BirthDateMustBeStrictlyBeforeToday(int days, bool valid)
    {
        var accounts = new Accounts();
        var result = await Handler(accounts).UpdateAsync(new("Valid Name", DateOfBirth:
            DateOnly.FromDateTime(Now.UtcDateTime).AddDays(days)));
        Assert.Equal(valid, result.Failure is null);
        Assert.Equal(valid, accounts.Update is not null);
    }

    [Theory]
    [InlineData(32, true)]
    [InlineData(33, false)]
    public async Task PhoneLengthMatchesPersistenceLimit(int length, bool valid)
    {
        var accounts = new Accounts();
        var result = await Handler(accounts).UpdateAsync(new("Valid Name", new string('1', length)));
        Assert.Equal(valid, result.Failure is null);
    }

    [Fact]
    public async Task BlankOptionalFieldsAreCleared()
    {
        var accounts = new Accounts();
        var result = await Handler(accounts).UpdateAsync(new("Valid Name", "  ", null, "  "));
        Assert.Null(result.Failure);
        Assert.Equal(new ProfileUpdate("Valid Name", null, null, null), accounts.Update);
    }

    [Theory]
    [InlineData(2048, true)]
    [InlineData(2049, false)]
    public async Task AvatarUrlLengthBoundary(int length, bool valid)
    {
        const string prefix = "https://example.com/";
        var accounts = new Accounts();
        var result = await Handler(accounts).UpdateAsync(new("Valid Name", AvatarUrl:
            prefix + new string('a', length - prefix.Length)));
        Assert.Equal(valid, result.Failure is null);
    }

    [Theory]
    [InlineData("javascript:alert(1)")]
    [InlineData("data:image/svg+xml,test")]
    [InlineData("//example.com/avatar.jpg")]
    [InlineData("/uploads/avatars/../private")]
    [InlineData("/uploads/avatars/%2e%2e/private")]
    [InlineData("https://user:secret@example.com/a")]
    public async Task RejectsUnsafeAvatarReferences(string avatar)
    {
        var accounts = new Accounts();
        var result = await Handler(accounts).UpdateAsync(new("Valid Name", AvatarUrl: avatar));
        Assert.Equal(AccountFailure.InvalidInput, result.Failure);
        Assert.Contains("avatarUrl", result.Errors!.Keys);
        Assert.Null(accounts.Update);
    }

    [Fact]
    public async Task DuplicatePhoneFailureIsPropagatedWithoutProfile()
    {
        var accounts = new Accounts { Failure = AccountFailure.DuplicatePhoneNumber };
        var result = await Handler(accounts).UpdateAsync(new("New Name", "+841234"));
        Assert.Equal(AccountFailure.DuplicatePhoneNumber, result.Failure);
        Assert.Null(result.Account);
        Assert.Equal("Original Name", accounts.Profile!.FullName);
    }

    [Fact]
    public async Task AdminCannotUpdateButExistingSessionProbeStillWorks()
    {
        var accounts = new Accounts(AccountRole.ADMIN);
        var handler = Handler(accounts);
        Assert.NotNull((await handler.GetAsync()).Account);
        Assert.Equal(AccountFailure.Forbidden, (await handler.UpdateAsync(new("New Name"))).Failure);
        Assert.Null(accounts.Update);
    }

    [Fact]
    public async Task AnonymousCannotReadOrUpdate()
    {
        var accounts = new Accounts();
        var handler = new CurrentProfileHandler(accounts, new Current(null), new Clock());
        Assert.Equal(AccountFailure.InvalidCredentials, (await handler.GetAsync()).Failure);
        Assert.Equal(AccountFailure.InvalidCredentials, (await handler.UpdateAsync(new("New Name"))).Failure);
        Assert.Equal(0, accounts.Reads);
        Assert.Null(accounts.Update);
    }

    [Theory]
    [InlineData(AccountStatus.LOCKED)]
    [InlineData(AccountStatus.INACTIVE)]
    public async Task InactiveAccountCannotUpdate(AccountStatus status)
    {
        var accounts = new Accounts();
        accounts.Profile = accounts.Profile! with { Status = status };
        Assert.Equal(AccountFailure.InvalidCredentials, (await Handler(accounts).UpdateAsync(new("New Name"))).Failure);
        Assert.Null(accounts.Update);
    }

    [Fact]
    public async Task MissingAccountCannotUpdate()
    {
        var accounts = new Accounts();
        var handler = Handler(accounts);
        accounts.Profile = null;
        Assert.Equal(AccountFailure.InvalidCredentials, (await handler.UpdateAsync(new("New Name"))).Failure);
        Assert.Null(accounts.Update);
    }

    private static CurrentProfileHandler Handler(Accounts accounts) =>
        new(accounts, new Current(accounts.Profile!.Id), new Clock());

    private sealed class Clock : IClock { public DateTimeOffset UtcNow => Now; }
    private sealed class Current(Guid? id) : ICurrentUser
    {
        public bool IsAuthenticated => id is not null;
        public Guid? UserId => id;
        public AccountRole? Role => AccountRole.LEARNER;
    }

    private sealed class Accounts(AccountRole role = AccountRole.LEARNER) : IAccountService
    {
        public AccountProfile? Profile { get; set; } = new(Guid.NewGuid(), "current@example.com", "Original Name",
            role, AccountStatus.ACTIVE, null, null, null);
        public ProfileUpdate? Update { get; private set; }
        public Guid? UpdatedId { get; private set; }
        public int Reads { get; private set; }
        public AccountFailure? Failure { get; init; }
        public Task<AccountProfile?> GetProfileAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            Reads++;
            if (Profile is not null) Assert.Equal(Profile.Id, userId);
            return Task.FromResult(Profile);
        }
        public Task<AccountOperationResult> UpdateProfileAsync(Guid userId, ProfileUpdate update, CancellationToken cancellationToken = default)
        {
            UpdatedId = userId;
            Update = update;
            return Task.FromResult(Failure is { } failure ? AccountOperationResult.Fail(failure) :
                AccountOperationResult.Success(Profile! with { FullName = update.FullName, PhoneNumber = update.PhoneNumber,
                    DateOfBirth = update.DateOfBirth, AvatarUrl = update.AvatarUrl }));
        }
        public Task<AccountOperationResult> RegisterAsync(string fullName, string email, string? phoneNumber, string password, AccountRole role, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<AccountOperationResult> SignInAsync(string email, string password, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task SignOutAsync(CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task RequestPasswordResetAsync(string email, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<AccountOperationResult> ResetPasswordAsync(string email, string token, string newPassword, CancellationToken cancellationToken = default) => throw new NotSupportedException();
    }
}
