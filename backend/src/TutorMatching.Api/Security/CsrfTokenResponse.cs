namespace TutorMatching.Api.Security;

public sealed class CsrfTokenResponse
{
    public required string RequestToken { get; init; }
    public required string HeaderName { get; init; }
}
