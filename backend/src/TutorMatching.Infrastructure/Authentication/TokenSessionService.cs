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

        var roles = await userManager.GetRolesAsync(user);
        if (roles.Count != 1) return null;
        var role = roles[0];

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
            AbsoluteExpiresAt = now.AddHours(8),
            IsRevoked = false
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
            ExpiresAt = refreshExpiry,
            IsUsed = false
        };
        dbContext.SessionRefreshTokens.Add(refreshTokenEntity);

        await dbContext.SaveChangesAsync(cancellationToken);
        return new TokenSessionGrant(sessionId, user.Id, role, rawRefreshToken, refreshExpiry);
    }

    public async Task<TokenSessionGrant?> RefreshAsync(string rawRefreshToken, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(rawRefreshToken)) return null;

        var hash = HashToken(rawRefreshToken.Trim());
        var tokenEntity = await dbContext.SessionRefreshTokens
            .FirstOrDefaultAsync(t => t.TokenHash == hash, cancellationToken);
        if (tokenEntity is null) return null;

        var session = await dbContext.TokenSessions
            .FirstOrDefaultAsync(s => s.Id == tokenEntity.SessionId, cancellationToken);
        if (session is null || session.IsRevoked) return null;

        // Reuse detection: If token was already used, revoke the entire session family immediately.
        if (tokenEntity.IsUsed)
        {
            session.IsRevoked = true;
            await dbContext.SaveChangesAsync(cancellationToken);
            return null;
        }

        var now = clock.UtcNow;
        if (now >= tokenEntity.ExpiresAt || now >= session.AbsoluteExpiresAt) return null;

        var user = await userManager.FindByIdAsync(session.UserId.ToString());
        if (user is null || user.Status != AccountStatus.ACTIVE || user.DeletedAt is not null ||
            user.SecurityStamp != session.SecurityStamp)
        {
            session.IsRevoked = true;
            await dbContext.SaveChangesAsync(cancellationToken);
            return null;
        }

        tokenEntity.IsUsed = true;

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
            ExpiresAt = newExpiry,
            IsUsed = false
        };
        dbContext.SessionRefreshTokens.Add(newRefreshTokenEntity);
        session.LastRefreshedAt = now;

        await dbContext.SaveChangesAsync(cancellationToken);
        return new TokenSessionGrant(session.Id, session.UserId, session.Role, newRawToken, newExpiry);
    }

    public async Task<bool> ValidateAsync(Guid sessionId, Guid userId, string role, CancellationToken cancellationToken = default)
    {
        var session = await dbContext.TokenSessions.AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == sessionId, cancellationToken);
        if (session is null || session.UserId != userId || session.IsRevoked) return false;
        if (!string.Equals(session.Role, role, StringComparison.OrdinalIgnoreCase)) return false;

        var now = clock.UtcNow;
        if (now >= session.AbsoluteExpiresAt) return false;

        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null || user.Status != AccountStatus.ACTIVE || user.DeletedAt is not null ||
            user.SecurityStamp != session.SecurityStamp)
        {
            return false;
        }

        return true;
    }

    public async Task<bool> LogoutAsync(string rawRefreshToken, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(rawRefreshToken)) return false;

        var hash = HashToken(rawRefreshToken.Trim());
        var tokenEntity = await dbContext.SessionRefreshTokens
            .FirstOrDefaultAsync(t => t.TokenHash == hash, cancellationToken);
        if (tokenEntity is null) return false;

        var session = await dbContext.TokenSessions
            .FirstOrDefaultAsync(s => s.Id == tokenEntity.SessionId, cancellationToken);
        if (session is not null)
        {
            session.IsRevoked = true;
            var user = await userManager.FindByIdAsync(session.UserId.ToString());
            if (user is not null)
            {
                await userManager.UpdateSecurityStampAsync(user);
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static string GenerateSecureToken() =>
        Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();

    private static string HashToken(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token))).ToLowerInvariant();
}
