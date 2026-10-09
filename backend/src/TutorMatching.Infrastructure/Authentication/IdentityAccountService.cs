using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using TutorMatching.Application.Abstractions;
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

                var roleResult = await userManager.AddToRoleAsync(user, role.ToString());
                if (!roleResult.Succeeded)
                {
                    await transaction.RollbackAsync(CancellationToken.None);
                    return AccountOperationResult.Fail(AccountFailure.InvalidInput);
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
                    user.AvatarUrl);

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
        var roles = await userManager.GetRolesAsync(user);
        if (roles.Count != 1 || !Enum.TryParse<AccountRole>(roles[0], out var role) || !Enum.IsDefined(role)) return null;
        return new(user.Id, user.Email!, user.FullName, role, user.Status, user.PhoneNumber, user.DateOfBirth, user.AvatarUrl);
    }

    public Task<AccountOperationResult> UpdateProfileAsync(Guid userId, ProfileUpdate update, CancellationToken cancellationToken = default) =>
        throw new NotImplementedException();

    public Task RequestPasswordResetAsync(string email, CancellationToken cancellationToken = default) =>
        throw new NotImplementedException();

    public Task<AccountOperationResult> ResetPasswordAsync(string email, string token, string newPassword, CancellationToken cancellationToken = default) =>
        throw new NotImplementedException();

    private static AccountFailure? GetUniqueFailure(DbUpdateException ex)
    {
        if (ex.InnerException is not PostgresException { SqlState: PostgresErrorCodes.UniqueViolation } postgres)
            return null;

        return string.Equals(postgres.ConstraintName, "UX_UserAccounts_PhoneNumber", StringComparison.Ordinal)
            ? AccountFailure.DuplicatePhoneNumber
            : AccountFailure.DuplicateEmail;
    }
}
