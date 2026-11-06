namespace TutorMatching.Domain.Content;

public sealed class RetentionCleanupLog
{
    public Guid Id { get; set; }
    public DateOnly CleanupDate { get; set; }
    public int PostsDeletedCount { get; set; }
    public int NotificationsDeletedCount { get; set; }
    public int DurationMs { get; set; }
    public string Status { get; set; } = "SUCCESS";
    public string? ErrorMessage { get; set; }
    public DateTimeOffset ExecutedAt { get; set; }
}
