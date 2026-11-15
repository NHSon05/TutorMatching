using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using TutorMatching.Application.Abstractions;
using TutorMatching.Domain.Tutors;
using TutorMatching.Domain.Users;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Infrastructure.Authentication;

/// <summary>
/// Google sign-in, automatic linking by verified email, and password-less registration on top of
/// ASP.NET Identity's login store (<c>asp_net_user_logins</c>). Never logs or audits personal data.
/// </summary>
public sealed class IdentityExternalAccountService(
    UserManager<ApplicationUser> userManager,
    ApplicationDbContext dbContext,
    IClock clock,
    IAuditWriter auditWriter) : IExternalAccountService
{
    public const string GoogleProvider = "Google";

    public async Task<AccountOperationResult> SignInWithExternalLoginAsync(ExternalIdentity identity,
        CancellationToken cancellationToken = default)
    {
        if (!identity.EmailVerified)
        {
            return await RefuseAsync(null, cancellationToken);
        }

        var linked = await userManager.FindByLoginAsync(GoogleProvider, identity.Subject);
        if (linked is not null)
        {
            return await IsEligibleAsync(linked)
                ? await CompleteSignInAsync(linked, cancellationToken)
                : await RefuseAsync(linked.Id, cancellationToken);
        }

        var byEmail = await userManager.FindByEmailAsync(identity.Email.Trim());
        if (byEmail is null)
        {
            return AccountOperationResult.Fail(AccountFailure.NotFound);
        }

        if (!await IsEligibleAsync(byEmail) ||
            (await userManager.GetLoginsAsync(byEmail)).Any(l => l.LoginProvider == GoogleProvider))
        {
            // Admin, locked/deleted, or already linked to a different Google identity.
            return await RefuseAsync(byEmail.Id, cancellationToken);
        }

        return await LinkAndSignInAsync(byEmail, identity, cancellationToken);
    }

    public async Task<AccountOperationResult> RegisterExternalAsync(ExternalIdentity identity, AccountRole role,
        CancellationToken cancellationToken = default)
    {
        if (role is not (AccountRole.LEARNER or AccountRole.TUTOR))
        {
            return AccountOperationResult.Fail(AccountFailure.InvalidInput);
        }

        if (!identity.EmailVerified)
        {
            return await RefuseAsync(null, cancellationToken);
        }

        // Replayed or concurrent completion, or the email was registered meanwhile: never create a duplicate.
        var existing = await SignInWithExternalLoginAsync(identity, cancellationToken);
        if (existing.Failure != AccountFailure.NotFound)
        {
            return existing;
        }

        var now = clock.UtcNow;
        var email = identity.Email.Trim();
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = email,
            Email = email,
            EmailConfirmed = true,
            FullName = identity.FullName ?? email,
            AvatarUrl = identity.PictureUrl,
            Role = role,
            Status = AccountStatus.ACTIVE,
            LastLoginAt = now,
            CreatedAt = now,
            UpdatedAt = now
        };

        var strategy = dbContext.Database.CreateExecutionStrategy();
        var created = await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                var create = await userManager.CreateAsync(user);
                if (!create.Succeeded)
                {
                    await transaction.RollbackAsync(CancellationToken.None);
                    return create.Errors.Any(e => e.Code is "DuplicateEmail" or "DuplicateUserName")
                        ? (AccountOperationResult?)null
                        : AccountOperationResult.Fail(AccountFailure.InvalidInput);
                }

                var link = await userManager.AddLoginAsync(user,
                    new UserLoginInfo(GoogleProvider, identity.Subject, GoogleProvider));
                if (!link.Succeeded)
                {
                    await transaction.RollbackAsync(CancellationToken.None);
                    return null;
                }

                TutorProfileStatus? tutorStatus = null;
                if (role == AccountRole.TUTOR)
                {
                    dbContext.TutorProfiles.Add(new TutorProfile
                    {
                        Id = Guid.NewGuid(),
                        UserId = user.Id,
                        Status = TutorProfileStatus.DRAFT,
                        CurrentStep = 1,
                        CreatedAt = now,
                        UpdatedAt = now
                    });
                    await dbContext.SaveChangesAsync(cancellationToken);
                    tutorStatus = TutorProfileStatus.DRAFT;
                }

                await auditWriter.WriteAsync(
                    new AccountAuditEntry(AccountAuditAction.ExternalAccountRegistered, user.Id, user.Id),
                    cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                return AccountOperationResult.Success(new AccountProfile(user.Id, user.Email!, user.FullName, role,
                    user.Status, user.PhoneNumber, user.DateOfBirth, user.AvatarUrl, tutorStatus));
            }
            catch (DbUpdateException ex) when (IsUniqueViolation(ex))
            {
                await transaction.RollbackAsync(CancellationToken.None);
                return null;
            }
            catch
            {
                await transaction.RollbackAsync(CancellationToken.None);
                throw;
            }
        });

        if (created is not null)
        {
            return created;
        }

        // Lost a race against a concurrent registration: resolve to the account that won (FR-018).
        dbContext.ChangeTracker.Clear();
        var resolved = await SignInWithExternalLoginAsync(identity, cancellationToken);
        return resolved.Failure == AccountFailure.NotFound
            ? AccountOperationResult.Fail(AccountFailure.InvalidCredentials)
            : resolved;
    }

    private async Task<AccountOperationResult> LinkAndSignInAsync(ApplicationUser user, ExternalIdentity identity,
        CancellationToken cancellationToken)
    {
        var strategy = dbContext.Database.CreateExecutionStrategy();
        var linked = await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                // Linking never changes the existing name, avatar, role or password (FR-009).
                var link = await userManager.AddLoginAsync(user,
                    new UserLoginInfo(GoogleProvider, identity.Subject, GoogleProvider));
                if (!link.Succeeded)
                {
                    await transaction.RollbackAsync(CancellationToken.None);
                    return false;
                }

                await auditWriter.WriteAsync(
                    new AccountAuditEntry(AccountAuditAction.ExternalLoginLinked, user.Id, user.Id), cancellationToken);
                await transaction.CommitAsync(cancellationToken);
                return true;
            }
            catch (DbUpdateException ex) when (IsUniqueViolation(ex))
            {
                await transaction.RollbackAsync(CancellationToken.None);
                return false;
            }
            catch
            {
                await transaction.RollbackAsync(CancellationToken.None);
                throw;
            }
        });

        if (linked)
        {
            return await CompleteSignInAsync(user, cancellationToken);
        }

        // A concurrent request linked first: only the same Google identity may proceed.
        dbContext.ChangeTracker.Clear();
        var winner = await userManager.FindByLoginAsync(GoogleProvider, identity.Subject);
        return winner is not null && winner.Id == user.Id && await IsEligibleAsync(winner)
            ? await CompleteSignInAsync(winner, cancellationToken)
            : await RefuseAsync(user.Id, cancellationToken);
    }

    private async Task<AccountOperationResult> CompleteSignInAsync(ApplicationUser user,
        CancellationToken cancellationToken)
    {
        user.LastLoginAt = clock.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        await auditWriter.WriteAsync(
            new AccountAuditEntry(AccountAuditAction.ExternalSignInSucceeded, user.Id, user.Id), cancellationToken);

        TutorProfileStatus? tutorStatus = null;
        if (user.Role == AccountRole.TUTOR)
        {
            tutorStatus = await dbContext.TutorProfiles
                .Where(t => t.UserId == user.Id)
                .Select(t => (TutorProfileStatus?)t.Status)
                .FirstOrDefaultAsync(cancellationToken) ?? TutorProfileStatus.DRAFT;
        }

        return AccountOperationResult.Success(new AccountProfile(user.Id, user.Email!, user.FullName, user.Role,
            user.Status, user.PhoneNumber, user.DateOfBirth, user.AvatarUrl, tutorStatus));
    }

    /// <summary>Administrators, inactive/locked/deleted and locked-out accounts cannot use Google sign-in.</summary>
    private async Task<bool> IsEligibleAsync(ApplicationUser user) =>
        user.Role is AccountRole.LEARNER or AccountRole.TUTOR &&
        user.Status == AccountStatus.ACTIVE &&
        user.DeletedAt is null &&
        !await userManager.IsLockedOutAsync(user);

    private async Task<AccountOperationResult> RefuseAsync(Guid? userId, CancellationToken cancellationToken)
    {
        await auditWriter.WriteAsync(
            new AccountAuditEntry(AccountAuditAction.ExternalSignInFailed, null, userId), cancellationToken);
        return AccountOperationResult.Fail(AccountFailure.InvalidCredentials);
    }

    private static bool IsUniqueViolation(DbUpdateException ex) =>
        ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation };
}
