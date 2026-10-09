using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace TutorMatching.Api.Security;

public sealed class JwtSettings
{
    public required string Issuer { get; init; }
    public required string Audience { get; init; }
    public required byte[] SigningKey { get; init; }
    public required CookieSecurePolicy SecurePolicy { get; init; }

    public static JwtSettings Load(IConfiguration configuration, CookieSecurePolicy securePolicy)
    {
        var issuer = configuration["Jwt:Issuer"] ?? "tutormatching-api";
        var audience = configuration["Jwt:Audience"] ?? "tutormatching-client";
        var rawKey = configuration["Jwt:SigningKey"];
        byte[] keyBytes;
        if (!string.IsNullOrWhiteSpace(rawKey))
        {
            try
            {
                keyBytes = Convert.FromBase64String(rawKey);
            }
            catch (FormatException)
            {
                keyBytes = System.Text.Encoding.UTF8.GetBytes(rawKey);
            }
        }
        else
        {
            keyBytes = System.Text.Encoding.UTF8.GetBytes("development-jwt-signing-key-32-bytes!!");
        }

        if (keyBytes.Length < 32)
        {
            throw new InvalidOperationException("JWT signing key must be at least 32 bytes (256 bits).");
        }

        return new JwtSettings
        {
            Issuer = issuer,
            Audience = audience,
            SigningKey = keyBytes,
            SecurePolicy = securePolicy
        };
    }
}
