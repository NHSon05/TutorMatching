namespace TutorMatching.Infrastructure.Authentication;

/// <summary>
/// Google Identity Services configuration (section <c>Google</c>, env <c>Google__ClientId</c>).
/// Only the public OAuth Web client ID is required; the ID-token flow uses no client secret.
/// An empty value disables Google sign-in (every credential is rejected).
/// </summary>
public sealed class GoogleOptions
{
    public const string SectionName = "Google";

    public string ClientId { get; set; } = string.Empty;
}
