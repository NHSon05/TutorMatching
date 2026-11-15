using System.Text.Json.Serialization;

namespace TutorMatching.Api.Contracts.Auth;

/// <summary>Body of POST /api/v1/auth/google. Credential is the Google Identity Services ID token.</summary>
[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed record GoogleSignInRequest(string Credential);

/// <summary>202 response of POST /api/v1/auth/google: a verified Google identity has no account yet.</summary>
public sealed record GoogleRegistrationRequired(
    string Status,
    string PendingToken,
    string Email,
    string FullName,
    string? AvatarUrl)
{
    public const string RoleRequiredStatus = "role_required";
}

/// <summary>Body of POST /api/v1/auth/google/complete. Role is LEARNER or TUTOR.</summary>
[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed record CompleteGoogleRegistrationRequest(string PendingToken, string Role);
