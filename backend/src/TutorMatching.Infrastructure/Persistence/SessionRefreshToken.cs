namespace TutorMatching.Infrastructure.Persistence;

public sealed class SessionRefreshToken
{
    public string TokenHash { get; set; } = string.Empty;
    public Guid SessionId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
    // MinValue represents an unknown historical consumption time (PostgreSQL -infinity).
    public DateTimeOffset? ConsumedAt { get; set; }
}
