using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using TutorMatching.Application.Abstractions;
using TutorMatching.Domain.Tutors;
using TutorMatching.Domain.Users;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Infrastructure.Authentication;

public sealed class IdentityAccountService(
    UserManager<ApplicationUser> userManager,
    ApplicationDbContext dbContext,
    IClock clock,
    IAuditWriter auditWriter,
    SignInManager<ApplicationUser>? signInManager = null,
    IHttpContextAccessor? httpContextAccessor = null) : IAccountService
{
    public async Task<AccountOperationResult> RegisterAsync(
        string fullName,
        string email,
        string? phoneNumber,
        string password,
        AccountRole role,
        CancellationToken cancellationToken = default)
    {
        var trimmedEmail = email.Trim();
        var normalizedEmail = userManager.NormalizeEmail(trimmedEmail);

        // Pre-check normalized uniqueness
        var existingUser = await dbContext.Users
            .AnyAsync(u => u.NormalizedEmail == normalizedEmail, cancellationToken);

        if (existingUser)
        {
            return AccountOperationResult.Fail(AccountFailure.DuplicateEmail);
        }

        var normalizedPhoneNumber = string.IsNullOrWhiteSpace(phoneNumber) ? null : phoneNumber.Trim();
        if (normalizedPhoneNumber is not null && await dbContext.Users
                .AnyAsync(u => u.PhoneNumber == normalizedPhoneNumber, cancellationToken))
        {
            return AccountOperationResult.Fail(AccountFailure.DuplicatePhoneNumber);
        }

        var now = clock.UtcNow;
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = trimmedEmail,
            Email = trimmedEmail,
            PhoneNumber = normalizedPhoneNumber,
            FullName = fullName.Trim(),
            Role = role,
            Status = AccountStatus.ACTIVE,
            CreatedAt = now,
            UpdatedAt = now
        };

        var strategy = dbContext.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                var createResult = await userManager.CreateAsync(user, password);
                if (!createResult.Succeeded)
                {
                    if (createResult.Errors.Any(e => e.Code == "DuplicateEmail" || e.Code == "DuplicateUserName"))
                    {
                        return AccountOperationResult.Fail(AccountFailure.DuplicateEmail);
                    }

                    return AccountOperationResult.Fail(AccountFailure.InvalidInput);
                }

                // Role is persisted directly on the newly created account by ApplicationUserStore.
                TutorProfileStatus? tutorStatus = null;
                if (role == AccountRole.TUTOR)
                {
                    var tutorProfile = new TutorProfile
                    {
                        Id = Guid.NewGuid(),
                        UserId = user.Id,
                        Status = TutorProfileStatus.DRAFT,
                        CurrentStep = 1,
                        CreatedAt = now,
                        UpdatedAt = now
                    };
                    dbContext.TutorProfiles.Add(tutorProfile);
                    await dbContext.SaveChangesAsync(cancellationToken);
                    tutorStatus = TutorProfileStatus.DRAFT;
                }

                await auditWriter.WriteAsync(
                    new AccountAuditEntry(AccountAuditAction.AccountRegistered, user.Id, user.Id),
                    cancellationToken);

                await transaction.CommitAsync(cancellationToken);

                var profile = new AccountProfile(
                    user.Id,
                    user.Email!,
                    user.FullName,
                    role,
                    user.Status,
                    user.PhoneNumber,
                    user.DateOfBirth,
                    user.AvatarUrl,
                    tutorStatus);

                return AccountOperationResult.Success(profile);
            }
            catch (DbUpdateException ex) when (GetUniqueFailure(ex) is { } failure)
            {
                await transaction.RollbackAsync(CancellationToken.None);
                return AccountOperationResult.Fail(failure);
            }
            catch
            {
                await transaction.RollbackAsync(CancellationToken.None);
                throw;
            }
        });
    }

    public async Task<AccountOperationResult> SignInAsync(string email, string password, CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByEmailAsync(email.Trim());
        if (user is null)
        {
            // Perform a password hash operation on unknown users too.
            userManager.PasswordHasher.HashPassword(new ApplicationUser(), password);
            return AccountOperationResult.Fail(AccountFailure.InvalidCredentials);
        }
        if (user.Status != AccountStatus.ACTIVE || user.DeletedAt is not null)
            return AccountOperationResult.Fail(AccountFailure.InvalidCredentials);
        var result = await signInManager!.CheckPasswordSignInAsync(user, password, lockoutOnFailure: true);
        if (!result.Succeeded)
        {
            await auditWriter.WriteAsync(new(AccountAuditAction.SignInFailed, null, user.Id), cancellationToken);
            return AccountOperationResult.Fail(AccountFailure.InvalidCredentials);
        }
        var profile = await GetProfileAsync(user.Id, cancellationToken);
        if (profile is null) return AccountOperationResult.Fail(AccountFailure.InvalidCredentials);
        user.LastLoginAt = clock.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        await auditWriter.WriteAsync(new(AccountAuditAction.SignInSucceeded, user.Id, user.Id), cancellationToken);
        return AccountOperationResult.Success(profile);
    }

    public async Task SignOutAsync(CancellationToken cancellationToken = default)
    {
        var user = await userManager.GetUserAsync(httpContextAccessor!.HttpContext!.User);
        if (user is not null)
        {
            var result = await userManager.UpdateSecurityStampAsync(user);
            if (!result.Succeeded) throw new InvalidOperationException("Unable to revoke session.");
            await auditWriter.WriteAsync(new(AccountAuditAction.SignOut, user.Id, user.Id), cancellationToken);
        }
        // HTTP cookie deletion is owned by the API; stamp rotation invalidates JWT sessions.
    }

    public async Task<AccountProfile?> GetProfileAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null || user.Status != AccountStatus.ACTIVE || user.DeletedAt is not null) return null;
        var role = user.Role;
        if (!Enum.IsDefined(role)) return null;

        TutorProfileStatus? tutorStatus = null;
        if (role == AccountRole.TUTOR)
        {
            tutorStatus = await dbContext.TutorProfiles
                .Where(t => t.UserId == user.Id)
                .Select(t => (TutorProfileStatus?)t.Status)
                .FirstOrDefaultAsync(cancellationToken);
            tutorStatus ??= TutorProfileStatus.DRAFT;
        }

        return new(user.Id, user.Email!, user.FullName, role, user.Status, user.PhoneNumber, user.DateOfBirth, user.AvatarUrl, tutorStatus);
    }

    public async Task<AccountOperationResult> UpdateProfileAsync(Guid userId, ProfileUpdate update,
        CancellationToken cancellationToken = default)
    {
        var strategy = dbContext.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                var account = await GetProfileAsync(userId, cancellationToken);
                if (account is null) return AccountOperationResult.Fail(AccountFailure.InvalidCredentials);
                if (account.Role is not (AccountRole.LEARNER or AccountRole.TUTOR))
                    return AccountOperationResult.Fail(AccountFailure.Forbidden);

                if (update.PhoneNumber is not null && await dbContext.Users.AnyAsync(
                        user => user.Id != userId && user.PhoneNumber == update.PhoneNumber, cancellationToken))
                    return AccountOperationResult.Fail(AccountFailure.DuplicatePhoneNumber);

                TutorProfile? professional = null;
                if (account.Role == AccountRole.TUTOR && account.FullName != update.FullName)
                {
                    await dbContext.Database.ExecuteSqlInterpolatedAsync($"SELECT id FROM tutor_profiles WHERE user_id={userId} FOR UPDATE", cancellationToken);
                    professional = await dbContext.TutorProfiles.SingleOrDefaultAsync(p=>p.UserId==userId,cancellationToken);
                    if (professional?.Status == TutorProfileStatus.PENDING_REVIEW) return AccountOperationResult.Fail(AccountFailure.Conflict);
                    if (professional?.Status == TutorProfileStatus.APPROVED)
                    {
                        professional.ReconsiderApproval(true, clock.UtcNow);
                    }
                    if(professional is not null) professional.NormalizedDisplayName=ApplicationDbContext.NormalizeSearchName(update.FullName);
                }
                // Update only the allowed fields; do not overwrite Identity credentials or session state.
                var updated = await dbContext.Users.Where(user => user.Id == userId &&
                        user.Status == AccountStatus.ACTIVE && user.DeletedAt == null)
                    .ExecuteUpdateAsync(setters => setters
                        .SetProperty(user => user.FullName, update.FullName)
                        .SetProperty(user => user.PhoneNumber, update.PhoneNumber)
                        .SetProperty(user => user.PhoneNumberConfirmed,
                            user => user.PhoneNumber == update.PhoneNumber && user.PhoneNumberConfirmed)
                        .SetProperty(user => user.DateOfBirth, update.DateOfBirth)
                        .SetProperty(user => user.AvatarUrl, update.AvatarUrl)
                        .SetProperty(user => user.UpdatedAt, clock.UtcNow), cancellationToken);
                if (updated != 1) return AccountOperationResult.Fail(AccountFailure.InvalidCredentials);
                // GetProfileAsync may have tracked this user before the set-based update.
                var tracked = dbContext.ChangeTracker.Entries<ApplicationUser>()
                    .FirstOrDefault(entry => entry.Entity.Id == userId);
                if (tracked is not null) await tracked.ReloadAsync(cancellationToken);
                if (professional is not null) await dbContext.SaveChangesAsync(cancellationToken);
                await auditWriter.WriteAsync(new(AccountAuditAction.ProfileUpdated, userId, userId), cancellationToken);
                await transaction.CommitAsync(cancellationToken);
                return AccountOperationResult.Success(account with
                {
                    FullName = update.FullName, PhoneNumber = update.PhoneNumber,
                    DateOfBirth = update.DateOfBirth, AvatarUrl = update.AvatarUrl, TutorProfileStatus = professional?.Status ?? account.TutorProfileStatus
                });
            }
            catch (PostgresException ex) when (ex.SqlState == PostgresErrorCodes.UniqueViolation &&
                ex.ConstraintName == "ux_user_accounts_phone_number")
            {
                await transaction.RollbackAsync(CancellationToken.None);
                dbContext.ChangeTracker.Clear();
                return AccountOperationResult.Fail(AccountFailure.DuplicatePhoneNumber);
            }
            catch
            {
                await transaction.RollbackAsync(CancellationToken.None);
                dbContext.ChangeTracker.Clear();
                throw;
            }
        });
    }

    public Task RequestPasswordResetAsync(string email, CancellationToken cancellationToken = default) =>
        throw new NotImplementedException();

    public Task<AccountOperationResult> ResetPasswordAsync(string email, string token, string newPassword, CancellationToken cancellationToken = default) =>
        throw new NotImplementedException();

    private static AccountFailure? GetUniqueFailure(DbUpdateException ex)
    {
        if (ex.InnerException is not PostgresException { SqlState: PostgresErrorCodes.UniqueViolation } postgres)
            return null;

        return string.Equals(postgres.ConstraintName, "ux_user_accounts_phone_number", StringComparison.Ordinal)
            ? AccountFailure.DuplicatePhoneNumber
            : AccountFailure.DuplicateEmail;
    }
}
