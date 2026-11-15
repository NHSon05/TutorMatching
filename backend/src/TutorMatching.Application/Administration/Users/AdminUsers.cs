using TutorMatching.Domain.Users;

namespace TutorMatching.Application.Administration.Users;

public sealed record SearchAdminUsersQuery(string? Q, AccountRole? Role, AccountStatus? Status, int Page, int PageSize);

public sealed record GetAdminUserByIdQuery(Guid UserId);

/// <summary>Lock (LOCKED) or unlock (ACTIVE) a target account; only those two targets are accepted.</summary>
public sealed record UpdateUserStatusCommand(Guid ActorUserId, Guid TargetUserId, Guid ExpectedVersion,
    bool Confirmed, AccountStatus Status);

public enum UserStatusFailure { Invalid, SelfLock, NotFound, Conflict }

public sealed record UpdateUserStatusResult(AdminUser? User, UserStatusFailure? Failure = null)
{
    public static UpdateUserStatusResult Fail(UserStatusFailure failure) => new(null, failure);
}

/// <summary>Persistence port: the status change, session revocation and audit row commit atomically.</summary>
public interface IAdminUserStore
{
    Task<AdminUsersPage> SearchAsync(SearchAdminUsersQuery query, CancellationToken cancellationToken);
    Task<AdminUser?> GetAsync(Guid userId, CancellationToken cancellationToken);
    Task<UpdateUserStatusResult> ChangeStatusAsync(Guid actorUserId, Guid targetUserId, Guid expectedVersion,
        AccountStatus status, CancellationToken cancellationToken);
}

public sealed class AdminUsersService(IAdminUserStore store)
{
    public const int MaxQueryLength = 100;

    public Task<AdminUsersPage> SearchAsync(SearchAdminUsersQuery query, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(query);
        var q = string.IsNullOrWhiteSpace(query.Q) ? null : query.Q.Trim();
        if (q?.Length > MaxQueryLength) throw new ArgumentOutOfRangeException(nameof(query), "q exceeds 100 characters.");
        return store.SearchAsync(query with { Q = q }, cancellationToken);
    }

    public Task<AdminUser?> GetAsync(GetAdminUserByIdQuery query, CancellationToken cancellationToken) =>
        store.GetAsync(query.UserId, cancellationToken);

    public async Task<UpdateUserStatusResult> UpdateStatusAsync(UpdateUserStatusCommand command, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);
        if (!command.Confirmed || command.ExpectedVersion == Guid.Empty ||
            command.Status is not (AccountStatus.ACTIVE or AccountStatus.LOCKED))
            return UpdateUserStatusResult.Fail(UserStatusFailure.Invalid);
        // An administrator can never change their own account state: this also keeps the
        // acting administrator as a usable administrative path.
        if (command.ActorUserId == command.TargetUserId)
            return UpdateUserStatusResult.Fail(UserStatusFailure.SelfLock);
        return await store.ChangeStatusAsync(command.ActorUserId, command.TargetUserId, command.ExpectedVersion,
            command.Status, cancellationToken);
    }
}
