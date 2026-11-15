using System.Collections.Concurrent;
using TutorMatching.Application.Abstractions;

namespace TutorMatching.Api.IntegrationTests.Fixtures;

/// <summary>
/// Test double for Google ID-token verification: tests register a credential string and the identity it
/// should verify to. Unknown credentials verify to null, like an invalid or expired Google token.
/// No network calls to Google are made.
/// </summary>
public sealed class FakeGoogleIdTokenVerifier : IGoogleIdTokenVerifier
{
    private readonly ConcurrentDictionary<string, ExternalIdentity> identities = new(StringComparer.Ordinal);

    /// <summary>Registers an identity and returns the opaque credential that verifies to it.</summary>
    public string Register(ExternalIdentity identity)
    {
        var credential = $"fake-google-credential-{Guid.NewGuid():N}";
        identities[credential] = identity;
        return credential;
    }

    /// <summary>Convenience overload for a verified Google identity.</summary>
    public string Register(string subject, string email, string? fullName = "Google User",
        string? pictureUrl = null, bool emailVerified = true) =>
        Register(new ExternalIdentity(subject, email, emailVerified, fullName, pictureUrl));

    public Task<ExternalIdentity?> VerifyAsync(string credential, CancellationToken cancellationToken = default) =>
        Task.FromResult(identities.TryGetValue(credential ?? string.Empty, out var identity) ? identity : null);
}
