using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.AspNetCore.DataProtection;
using TutorMatching.Application.Abstractions;

namespace TutorMatching.Infrastructure.Authentication;

/// <summary>
/// Stateless pending-registration token: the verified identity plus an expiry instant, encrypted and
/// authenticated by ASP.NET Data Protection (purpose <see cref="Purpose"/>). Expiry is checked against
/// the injected <see cref="TimeProvider"/> so tests can advance time deterministically.
/// </summary>
public sealed class DataProtectionPendingGoogleRegistrationProtector(
    IDataProtectionProvider provider,
    TimeProvider timeProvider) : IPendingGoogleRegistrationProtector
{
    public const string Purpose = "TutorMatching.GoogleSignup.v1";
    private const int MaximumTokenLength = 4096;

    private readonly IDataProtector protector = provider.CreateProtector(Purpose);

    public string Protect(ExternalIdentity identity)
    {
        ArgumentNullException.ThrowIfNull(identity);
        var expiresAt = timeProvider.GetUtcNow().Add(IPendingGoogleRegistrationProtector.Lifetime);
        var payload = new PendingPayload(
            identity.Subject, identity.Email, identity.EmailVerified, identity.FullName, identity.PictureUrl,
            expiresAt.ToUnixTimeMilliseconds());
        return protector.Protect(JsonSerializer.Serialize(payload));
    }

    public ExternalIdentity? Unprotect(string token)
    {
        if (string.IsNullOrWhiteSpace(token) || token.Length > MaximumTokenLength)
        {
            return null;
        }

        PendingPayload? payload;
        try
        {
            payload = JsonSerializer.Deserialize<PendingPayload>(protector.Unprotect(token));
        }
        catch (Exception exception) when (exception is CryptographicException or JsonException or FormatException)
        {
            return null;
        }

        if (payload is null ||
            string.IsNullOrEmpty(payload.Subject) ||
            string.IsNullOrEmpty(payload.Email) ||
            timeProvider.GetUtcNow().ToUnixTimeMilliseconds() >= payload.ExpiresAtUnixMs)
        {
            return null;
        }

        return new ExternalIdentity(payload.Subject, payload.Email, payload.EmailVerified, payload.FullName,
            payload.PictureUrl);
    }

    private sealed record PendingPayload(
        string Subject,
        string Email,
        bool EmailVerified,
        string? FullName,
        string? PictureUrl,
        long ExpiresAtUnixMs);
}
