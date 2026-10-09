namespace TutorMatching.Infrastructure.Persistence;

public sealed class TokenSession
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string SecurityStamp { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset LastRefreshedAt { get; set; }
    public DateTimeOffset AbsoluteExpiresAt { get; set; }
    public bool IsRevoked { get; set; }
}
