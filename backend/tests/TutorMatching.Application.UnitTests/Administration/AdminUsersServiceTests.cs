using TutorMatching.Application.Administration;
using TutorMatching.Application.Administration.Users;
using TutorMatching.Domain.Users;

namespace TutorMatching.Application.UnitTests.Administration;

public sealed class AdminUsersServiceTests
{
    private static readonly Guid Admin = Guid.NewGuid();
    private static readonly Guid Target = Guid.NewGuid();
    private static readonly Guid Version = Guid.NewGuid();

    [Fact]
    public async Task SelfLockIsRejectedBeforeTouchingPersistence()
    {
        var store = new FakeStore();
        var result = await new AdminUsersService(store).UpdateStatusAsync(
            new(Admin, Admin, Version, true, AccountStatus.LOCKED), default);
        Assert.Equal(UserStatusFailure.SelfLock, result.Failure);
        Assert.Equal(0, store.ChangeCalls);
    }

    [Theory]
    [InlineData(false, AccountStatus.LOCKED, false)]
    [InlineData(true, AccountStatus.INACTIVE, false)]
    [InlineData(true, AccountStatus.LOCKED, true)]
    public async Task UnconfirmedEmptyVersionOrUnsupportedTargetIsInvalid(bool confirmed, AccountStatus status, bool emptyVersion)
    {
        var store = new FakeStore();
        var result = await new AdminUsersService(store).UpdateStatusAsync(
            new(Admin, Target, emptyVersion ? Guid.Empty : Version, confirmed, status), default);
        Assert.Equal(UserStatusFailure.Invalid, result.Failure);
        Assert.Equal(0, store.ChangeCalls);
    }

    [Theory]
    [InlineData(AccountStatus.LOCKED)]
    [InlineData(AccountStatus.ACTIVE)]
    public async Task ValidCommandDelegatesActorTargetVersionAndStatus(AccountStatus status)
    {
        var store = new FakeStore();
        var result = await new AdminUsersService(store).UpdateStatusAsync(new(Admin, Target, Version, true, status), default);
        Assert.Null(result.Failure);
        Assert.Equal((Admin, Target, Version, status), store.LastChange);
    }

    [Fact]
    public async Task StoreConflictIsPropagated()
    {
        var store = new FakeStore { NextResult = UpdateUserStatusResult.Fail(UserStatusFailure.Conflict) };
        var result = await new AdminUsersService(store).UpdateStatusAsync(new(Admin, Target, Version, true, AccountStatus.LOCKED), default);
        Assert.Equal(UserStatusFailure.Conflict, result.Failure);
    }

    [Fact]
    public async Task SearchTrimsBlankQueryAndRejectsOverlongQuery()
    {
        var store = new FakeStore();
        var service = new AdminUsersService(store);
        await service.SearchAsync(new("   ", AccountRole.TUTOR, AccountStatus.LOCKED, 1, 20), default);
        Assert.Null(store.LastSearch!.Q);
        await service.SearchAsync(new("  an  ", null, null, 1, 20), default);
        Assert.Equal("an", store.LastSearch!.Q);
        await Assert.ThrowsAsync<ArgumentOutOfRangeException>(() =>
            service.SearchAsync(new(new string('a', 101), null, null, 1, 20), default));
    }

    private sealed class FakeStore : IAdminUserStore
    {
        public int ChangeCalls { get; private set; }
        public (Guid, Guid, Guid, AccountStatus)? LastChange { get; private set; }
        public SearchAdminUsersQuery? LastSearch { get; private set; }
        public UpdateUserStatusResult NextResult { get; init; } =
            new(new AdminUser(Target, "Target", "t@example.test", "TUTOR", "LOCKED", null, null, Guid.NewGuid()));

        public Task<AdminUsersPage> SearchAsync(SearchAdminUsersQuery query, CancellationToken cancellationToken)
        {
            LastSearch = query;
            return Task.FromResult(new AdminUsersPage([], 0, query.Page, query.PageSize));
        }

        public Task<AdminUser?> GetAsync(Guid userId, CancellationToken cancellationToken) => Task.FromResult<AdminUser?>(null);

        public Task<UpdateUserStatusResult> ChangeStatusAsync(Guid actorUserId, Guid targetUserId, Guid expectedVersion,
            AccountStatus status, CancellationToken cancellationToken)
        {
            ChangeCalls++;
            LastChange = (actorUserId, targetUserId, expectedVersion, status);
            return Task.FromResult(NextResult);
        }
    }
}
