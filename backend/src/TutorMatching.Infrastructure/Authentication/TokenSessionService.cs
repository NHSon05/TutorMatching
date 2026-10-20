using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TutorMatching.Application.Abstractions;
using TutorMatching.Domain.Users;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Infrastructure.Authentication;

public sealed class TokenSessionService(
    ApplicationDbContext dbContext,
    UserManager<ApplicationUser> userManager,
    IClock clock) : ITokenSessionService
{
    public async Task<TokenSessionGrant?> CreateAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null || user.Status != AccountStatus.ACTIVE || user.DeletedAt is not null)
            return null;

        if (!Enum.IsDefined(user.Role)) return null;
        var role = user.Role.ToString();

        var now = clock.UtcNow;
        var sessionId = Guid.NewGuid();
        var session = new TokenSession
        {
            Id = sessionId,
            UserId = user.Id,
            SecurityStamp = user.SecurityStamp ?? string.Empty,
            Role = role,
            CreatedAt = now,
            LastRefreshedAt = now,
            AbsoluteExpiresAt = now.AddHours(8)
        };
        dbContext.TokenSessions.Add(session);

        var rawRefreshToken = GenerateSecureToken();
        var hash = HashToken(rawRefreshToken);
        var refreshExpiry = now.AddMinutes(30) > session.AbsoluteExpiresAt
            ? session.AbsoluteExpiresAt
            : now.AddMinutes(30);

        var refreshTokenEntity = new SessionRefreshToken
        {
            TokenHash = hash,
            SessionId = sessionId,
            CreatedAt = now,
            ExpiresAt = refreshExpiry
        };
        dbContext.SessionRefreshTokens.Add(refreshTokenEntity);

        await dbContext.SaveChangesAsync(cancellationToken);
        return new TokenSessionGrant(sessionId, user.Id, role, rawRefreshToken, refreshExpiry);
    }

    public async Task<TokenSessionGrant?> RefreshAsync(string rawRefreshToken, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(rawRefreshToken)) return null;

        var hash = HashToken(rawRefreshToken.Trim());
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        var session = await LockSessionAsync(hash, cancellationToken);
        if (session is null || session.RevokedAt is not null) return null;

        // Read the credential only after acquiring the family lock: a concurrent
        // refresh may have consumed it while this transaction was waiting.
        var tokenEntity = await dbContext.SessionRefreshTokens
            .FirstOrDefaultAsync(t => t.TokenHash == hash, cancellationToken);
        if (tokenEntity is null) return null;

        // Reuse detection: If token was already used, revoke the entire session family immediately.
        if (tokenEntity.ConsumedAt is not null)
        {
            session.RevokedAt = clock.UtcNow;
            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return null;
        }

        var now = clock.UtcNow;
        if (now >= tokenEntity.ExpiresAt || now >= session.AbsoluteExpiresAt) return null;

        var user = await userManager.FindByIdAsync(session.UserId.ToString());
        if (user is null || user.Status != AccountStatus.ACTIVE || user.DeletedAt is not null ||
            user.SecurityStamp != session.SecurityStamp || !await HasCurrentRoleAsync(user, session.Role))
        {
            session.RevokedAt = now;
            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return null;
        }

        tokenEntity.ConsumedAt = now;

        var newRawToken = GenerateSecureToken();
        var newHash = HashToken(newRawToken);
        var newExpiry = now.AddMinutes(30) > session.AbsoluteExpiresAt
            ? session.AbsoluteExpiresAt
            : now.AddMinutes(30);

        var newRefreshTokenEntity = new SessionRefreshToken
        {
            TokenHash = newHash,
            SessionId = session.Id,
            CreatedAt = now,
            ExpiresAt = newExpiry
        };
        dbContext.SessionRefreshTokens.Add(newRefreshTokenEntity);
        session.LastRefreshedAt = now;

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return new TokenSessionGrant(session.Id, session.UserId, session.Role, newRawToken, newExpiry);
    }

    public async Task<bool> ValidateAsync(Guid sessionId, Guid userId, string role, CancellationToken cancellationToken = default)
    {
        var session = await dbContext.TokenSessions.AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == sessionId, cancellationToken);
        if (session is null || session.UserId != userId || session.RevokedAt is not null) return false;
        if (!string.Equals(session.Role, role, StringComparison.OrdinalIgnoreCase)) return false;

        var now = clock.UtcNow;
        if (now >= session.AbsoluteExpiresAt) return false;

        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null || user.Status != AccountStatus.ACTIVE || user.DeletedAt is not null ||
            user.SecurityStamp != session.SecurityStamp)
        {
            return false;
        }

        return await HasCurrentRoleAsync(user, session.Role);
    }

    public async Task<bool> LogoutAsync(string rawRefreshToken, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(rawRefreshToken)) return false;

        var hash = HashToken(rawRefreshToken.Trim());
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        var session = await LockSessionAsync(hash, cancellationToken);
        if (session is null) return false;
        session.RevokedAt ??= clock.UtcNow;
        var user = await userManager.FindByIdAsync(session.UserId.ToString());
        if (user is not null)
        {
            var result = await userManager.UpdateSecurityStampAsync(user);
            if (!result.Succeeded) throw new InvalidOperationException("Unable to revoke sessions.");
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return true;
    }

    private static Task<bool> HasCurrentRoleAsync(ApplicationUser user, string sessionRole)
    {
        return Task.FromResult(string.Equals(user.Role.ToString(), sessionRole, StringComparison.OrdinalIgnoreCase));
    }

    private async Task<TokenSession?> LockSessionAsync(string hash, CancellationToken cancellationToken)
    {
        // Parameterized SQL; refresh and logout serialize on the same session row.
        var sessions = await dbContext.TokenSessions.FromSqlInterpolated($"""
            SELECT s.* FROM token_sessions AS s
            WHERE s.id = (SELECT t.session_id FROM session_refresh_tokens AS t WHERE t.token_hash = {hash})
            FOR UPDATE OF s
            """).ToListAsync(cancellationToken);
        return sessions.SingleOrDefault();
    }

    private static string GenerateSecureToken() =>
        Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();

    private static string HashToken(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token))).ToLowerInvariant();
}
