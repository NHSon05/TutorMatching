namespace TutorMatching.Domain.Content;

public enum PostStatus
{
    PENDING,
    EXTRACTED,
    FAILED,
    DUPLICATE,
    REJECTED
}

public sealed class DemandPost
{
    public const int MinRawContentLength = 10;
    public const int MaxRawContentLength = 2000;
    public const int DefaultRetentionDays = 30;

    public Guid Id { get; set; }
    public Guid? RequesterUserId { get; set; }
    public string ActorFingerprint { get; set; } = string.Empty;
    public string ContentHash { get; set; } = string.Empty;
    public string RawContent { get; set; } = string.Empty;
    public PostStatus Status { get; set; } = PostStatus.PENDING;
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public ExtractedDemandDetail? ExtractedDetail { get; set; }

    public static DemandPost Create(
        string actorFingerprint,
        string contentHash,
        string rawContent,
        Guid? requesterUserId = null,
        DateTimeOffset? now = null)
    {
        if (string.IsNullOrWhiteSpace(actorFingerprint))
        {
            throw new ArgumentException("Actor fingerprint is required.", nameof(actorFingerprint));
        }

        if (string.IsNullOrWhiteSpace(contentHash))
        {
            throw new ArgumentException("Content hash is required.", nameof(contentHash));
        }

        var trimmedContent = rawContent?.Trim() ?? string.Empty;
        if (trimmedContent.Length < MinRawContentLength || trimmedContent.Length > MaxRawContentLength)
        {
            throw new ArgumentOutOfRangeException(
                nameof(rawContent),
                $"Raw content length must be between {MinRawContentLength} and {MaxRawContentLength} characters.");
        }

        var createdAt = now ?? DateTimeOffset.UtcNow;

        return new DemandPost
        {
            Id = Guid.NewGuid(),
            RequesterUserId = requesterUserId,
            ActorFingerprint = actorFingerprint.Trim(),
            ContentHash = contentHash.Trim(),
            RawContent = trimmedContent,
            Status = PostStatus.PENDING,
            CreatedAt = createdAt,
            ExpiresAt = createdAt.AddDays(DefaultRetentionDays),
        };
    }

    public void MarkExtracted() => Status = PostStatus.EXTRACTED;

    public void MarkDuplicate() => Status = PostStatus.DUPLICATE;

    public void MarkRejected() => Status = PostStatus.REJECTED;

    public void MarkFailed() => Status = PostStatus.FAILED;
}
