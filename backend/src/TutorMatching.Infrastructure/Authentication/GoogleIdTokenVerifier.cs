using Google.Apis.Auth;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TutorMatching.Application.Abstractions;

namespace TutorMatching.Infrastructure.Authentication;

/// <summary>
/// Verifies Google ID tokens with Google's maintained library: signature against Google's cached
/// signing certificates, issuer, audience (this app's client ID) and expiry. The credential, email
/// and exception messages are never logged.
/// </summary>
public sealed class GoogleIdTokenVerifier(
    IOptions<GoogleOptions> options,
    ILogger<GoogleIdTokenVerifier> logger) : IGoogleIdTokenVerifier
{
    private static readonly TimeSpan ClockTolerance = TimeSpan.FromMinutes(5);

    public async Task<ExternalIdentity?> VerifyAsync(string credential, CancellationToken cancellationToken = default)
    {
        var clientId = options.Value.ClientId?.Trim();
        if (string.IsNullOrEmpty(clientId) || string.IsNullOrWhiteSpace(credential))
        {
            return null;
        }

        cancellationToken.ThrowIfCancellationRequested();

        GoogleJsonWebSignature.Payload payload;
        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(credential, new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = [clientId],
                IssuedAtClockTolerance = ClockTolerance,
                ExpirationTimeClockTolerance = ClockTolerance,
            });
        }
        catch (InvalidJwtException)
        {
            logger.LogInformation("Google ID token rejected by validation.");
            return null;
        }
        catch (Exception exception) when (exception is HttpRequestException or TaskCanceledException)
        {
            // Google certificate endpoint unreachable; caller returns the generic, retryable refusal.
            logger.LogWarning("Google ID token could not be verified: {ErrorType}.", exception.GetType().Name);
            return null;
        }

        return Map(payload);
    }

    private static ExternalIdentity? Map(GoogleJsonWebSignature.Payload payload)
    {
        var subject = payload.Subject?.Trim();
        var email = payload.Email?.Trim();
        if (string.IsNullOrEmpty(subject) || subject.Length > ExternalIdentity.MaximumSubjectLength ||
            string.IsNullOrEmpty(email) || email.Length > ExternalIdentity.MaximumEmailLength)
        {
            return null;
        }

        return new ExternalIdentity(
            subject,
            email,
            payload.EmailVerified,
            string.IsNullOrWhiteSpace(payload.Name) ? null : payload.Name.Trim(),
            NormalizePicture(payload.Picture));
    }

    private static string? NormalizePicture(string? picture) =>
        !string.IsNullOrWhiteSpace(picture) &&
        picture.Length <= ExternalIdentity.MaximumPictureUrlLength &&
        Uri.TryCreate(picture, UriKind.Absolute, out var uri) &&
        uri.Scheme == Uri.UriSchemeHttps
            ? uri.AbsoluteUri
            : null;
}
