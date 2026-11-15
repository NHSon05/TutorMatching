namespace TutorMatching.Application.Abstractions;

/// <summary>
/// Produces and reads the short-lived, tamper-proof token that carries a verified Google identity
/// through the role-selection step without persisting an account.
/// </summary>
public interface IPendingGoogleRegistrationProtector
{
    /// <summary>Lifetime of a pending registration token.</summary>
    static TimeSpan Lifetime => TimeSpan.FromMinutes(10);

    string Protect(ExternalIdentity identity);

    /// <summary>Returns null when the token is malformed, tampered with, or expired.</summary>
    ExternalIdentity? Unprotect(string token);
}
