using TutorMatching.Domain.Users;

namespace TutorMatching.Application.Abstractions;

public interface IAccountService
{
    Task<AccountOperationResult> RegisterAsync(string fullName, string email, string? phoneNumber, string password,
        AccountRole role, CancellationToken cancellationToken = default);

    Task<AccountOperationResult> SignInAsync(string email, string password,
        CancellationToken cancellationToken = default);

    Task SignOutAsync(CancellationToken cancellationToken = default);
    Task<AccountProfile?> GetProfileAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<AccountOperationResult> UpdateProfileAsync(Guid userId, ProfileUpdate update,
        CancellationToken cancellationToken = default);

    Task RequestPasswordResetAsync(string email, CancellationToken cancellationToken = default);
    Task<AccountOperationResult> ResetPasswordAsync(string email, string token, string newPassword,
        CancellationToken cancellationToken = default);
}
