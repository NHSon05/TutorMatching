using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using TutorMatching.Application.Abstractions;

namespace TutorMatching.Api.Security;

public sealed class JwtCookieTokens(JwtSettings settings, TimeProvider clock)
{
    public const string AccessCookie = "accessToken";
    public const string RefreshCookie = "refreshToken";
    public const string RefreshPath = "/api/v1/auth";

    public void Issue(HttpContext context, TokenSessionGrant grant)
    {
        var now = clock.GetUtcNow();
        var accessExpires = now.AddMinutes(5);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Issuer = settings.Issuer,
            Audience = settings.Audience,
            Claims = new Dictionary<string, object>
            {
                ["sub"] = grant.UserId.ToString(),
                ["sid"] = grant.SessionId.ToString(),
                ["role"] = grant.Role,
                [JwtRegisteredClaimNames.Jti] = Guid.NewGuid().ToString()
            },
            NotBefore = now.UtcDateTime,
            Expires = accessExpires.UtcDateTime,
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(settings.SigningKey),
                SecurityAlgorithms.HmacSha256)
        };

        var handler = new JsonWebTokenHandler();
        var accessToken = handler.CreateToken(tokenDescriptor);

        var isSecure = ResolveSecure(context, settings.SecurePolicy);

        context.Response.Cookies.Append(AccessCookie, accessToken, new CookieOptions
        {
            Path = "/",
            HttpOnly = true,
            Secure = isSecure,
            SameSite = SameSiteMode.Lax,
            Expires = accessExpires
        });

        context.Response.Cookies.Append(RefreshCookie, grant.RefreshToken, new CookieOptions
        {
            Path = RefreshPath,
            HttpOnly = true,
            Secure = isSecure,
            SameSite = SameSiteMode.Lax,
            Expires = grant.ExpiresAt
        });
    }

    public void Clear(HttpContext context)
    {
        var isSecure = ResolveSecure(context, settings.SecurePolicy);

        context.Response.Cookies.Delete(AccessCookie, new CookieOptions
        {
            Path = "/",
            HttpOnly = true,
            Secure = isSecure,
            SameSite = SameSiteMode.Lax
        });

        context.Response.Cookies.Delete(RefreshCookie, new CookieOptions
        {
            Path = RefreshPath,
            HttpOnly = true,
            Secure = isSecure,
            SameSite = SameSiteMode.Lax
        });
    }

    private static bool ResolveSecure(HttpContext context, CookieSecurePolicy policy) => policy switch
    {
        CookieSecurePolicy.Always => true,
        CookieSecurePolicy.SameAsRequest => context.Request.IsHttps,
        CookieSecurePolicy.None => false,
        _ => true
    };
}
