namespace TutorMatching.Domain.Hiring;

public sealed class HireReview
{
    public Guid Id { get; set; }
    public Guid HireRequestId { get; set; }
    public Guid TutorProfileId { get; set; }
    public Guid ReviewerUserId { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public string? TutorReply { get; set; }
    public DateTimeOffset? TutorRepliedAt { get; set; }
    public bool IsVisible { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public HireRequest? HireRequest { get; set; }

    public static HireReview Create(
        HireRequest request,
        Guid actorUserId,
        int rating,
        string? comment,
        DateTimeOffset now)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (actorUserId != request.RequesterUserId)
        {
            throw new HireRuleException("forbidden");
        }

        if (request.StatusCode != "COMPLETED")
        {
            throw new HireRuleException("state_conflict");
        }

        if (request.Review is not null)
        {
            throw new HireRuleException("review_already_submitted");
        }

        if (rating is < 1 or > 5)
        {
            throw new HireRuleException("invalid_rating");
        }

        string? normalizedComment = null;
        if (comment is not null)
        {
            if (string.IsNullOrWhiteSpace(comment) || comment.Trim().Length > 1000)
            {
                throw new HireRuleException("invalid_comment");
            }

            normalizedComment = comment.Trim();
        }

        var utcNow = now.ToUniversalTime();
        var review = new HireReview
        {
            Id = Guid.NewGuid(),
            HireRequestId = request.Id,
            TutorProfileId = request.TutorProfileId,
            ReviewerUserId = actorUserId,
            Rating = rating,
            Comment = normalizedComment,
            IsVisible = true,
            CreatedAt = utcNow,
            UpdatedAt = utcNow,
        };

        request.Review = review;
        return review;
    }

    public void Reply(Guid actorUserId, Guid tutorUserId, string? replyText, DateTimeOffset now)
    {
        if (actorUserId != tutorUserId)
        {
            throw new HireRuleException("forbidden");
        }

        if (TutorReply is not null)
        {
            throw new HireRuleException("reply_already_submitted");
        }

        if (string.IsNullOrWhiteSpace(replyText) || replyText.Trim().Length > 1000)
        {
            throw new HireRuleException("invalid_reply");
        }

        var utcNow = now.ToUniversalTime();
        TutorReply = replyText.Trim();
        TutorRepliedAt = utcNow;
        UpdatedAt = utcNow;
    }
}
