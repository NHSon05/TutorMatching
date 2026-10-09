namespace TutorMatching.Application.Abstractions;

public sealed record TokenSessionGrant(
    Guid SessionId,
    Guid UserId,
    string Role,
    string RefreshToken,
    DateTimeOffset ExpiresAt);

public interface ITokenSessionService
{
    Task<TokenSessionGrant?> CreateAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<TokenSessionGrant?> RefreshAsync(string rawRefreshToken, CancellationToken cancellationToken = default);
    Task<bool> ValidateAsync(Guid sessionId, Guid userId, string role, CancellationToken cancellationToken = default);
    Task<bool> LogoutAsync(string rawRefreshToken, CancellationToken cancellationToken = default);
}
