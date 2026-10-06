namespace TutorMatching.Application.Abstractions;

public interface IAuditWriter
{
    /// <summary>Writes identifiers and an allowlisted action only; no free-form payload or secrets.</summary>
    Task WriteAsync(AccountAuditEntry entry, CancellationToken cancellationToken = default);
}

public enum AccountAuditAction
{
    AccountRegistered = 1,
    SignInSucceeded,
    SignInFailed,
    SignOut,
    AccessDenied,
    ProfileUpdated,
    PasswordResetRequested,
    PasswordResetSucceeded,
    PasswordResetFailed
}

public sealed record AccountAuditEntry(
    AccountAuditAction Action,
    Guid? ActorUserId,
    Guid? TargetUserId);
