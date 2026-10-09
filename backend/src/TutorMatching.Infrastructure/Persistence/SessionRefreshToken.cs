namespace TutorMatching.Infrastructure.Persistence;

public sealed class SessionRefreshToken
{
    public string TokenHash { get; set; } = string.Empty;
    public Guid SessionId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
    public bool IsUsed { get; set; }
}
