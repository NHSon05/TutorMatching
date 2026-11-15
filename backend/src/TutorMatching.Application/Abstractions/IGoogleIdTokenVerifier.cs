namespace TutorMatching.Application.Abstractions;

/// <summary>
/// Identity asserted by an external provider after its credential has been verified.
/// Subject is the provider's stable account id (≤ 255); Email ≤ 256; PictureUrl is an absolute https
/// URL ≤ 2048 or null. Never log instances of this record: it contains personal data.
/// </summary>
public sealed record ExternalIdentity(
    string Subject,
    string Email,
    bool EmailVerified,
    string? FullName,
    string? PictureUrl)
{
    public const int MaximumSubjectLength = 255;
    public const int MaximumEmailLength = 256;
    public const int MaximumPictureUrlLength = 2048;
}

/// <summary>Verifies a Google Identity Services ID token issued for this application.</summary>
public interface IGoogleIdTokenVerifier
{
    /// <summary>
    /// Returns the verified identity, or null when the credential is invalid, expired, issued for a
    /// different client, or Google sign-in is not configured. Implementations never log the credential.
    /// </summary>
    Task<ExternalIdentity?> VerifyAsync(string credential, CancellationToken cancellationToken = default);
}
