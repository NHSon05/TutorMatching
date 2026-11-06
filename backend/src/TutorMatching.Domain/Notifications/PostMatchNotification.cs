using TutorMatching.Domain.Content;
using TutorMatching.Domain.Tutors;

namespace TutorMatching.Domain.Notifications;

public sealed class PostMatchNotification
{
    public Guid Id { get; set; }
    public Guid ExtractedDemandDetailId { get; set; }
    public Guid TutorProfileId { get; set; }
    public decimal MatchScore { get; set; } = 1.00m;
    public bool IsRead { get; set; }
    public DateTimeOffset SentAt { get; set; }
    public DateTimeOffset? ReadAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public ExtractedDemandDetail? ExtractedDemandDetail { get; set; }
    public TutorProfile? TutorProfile { get; set; }

    public void MarkAsRead(DateTimeOffset? now = null)
    {
        if (IsRead)
        {
            return;
        }

        IsRead = true;
        ReadAt = now ?? DateTimeOffset.UtcNow;
    }
}
