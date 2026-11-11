using TutorMatching.Application.Abstractions;
using TutorMatching.Domain.Hiring;
using TutorMatching.Domain.Users;

namespace TutorMatching.Application.Hiring;

public sealed class ReviewHireRequest(IHireRequestStore store, IHireRequestQueries queries, ICurrentUser user, IClock clock)
{
    public async Task<HireReviewDto> SubmitAsync(Guid requestId, SubmitHireReviewCommand command, CancellationToken ct)
    {
        if (user.UserId is not { } actor) throw new HireStoreException("unauthorized");
        if (user.Role is not AccountRole.LEARNER) throw new HireStoreException("forbidden");

        await store.ExecuteAsync(
            new(actor, Guid.Empty, Guid.Empty, RequestId: requestId, RequireOffering: false, RequireExpectedVersion: false),
            async (session, token) =>
            {
                var request = session.Request ?? throw new HireStoreException("not_found");
                if (request.RequesterUserId != actor) throw new HireStoreException("forbidden");

                var existing = await session.FindReviewByRequestIdAsync(requestId, token);
                request.Review = existing;

                var now = clock.UtcNow;
                try
                {
                    var review = HireReview.Create(request, actor, command.Rating, command.Comment, now);
                    session.AddReview(review);
                    await session.RecalculateTutorRatingAsync(request.TutorProfileId, review.Rating, token);
                    session.NotifyOtherParticipant(
                        "TUTOR_REVIEW_RECEIVED",
                        "Học viên đã để lại đánh giá sau khóa học.",
                        now);
                }
                catch (HireRuleException e) when (e.Code is "invalid_rating" or "invalid_comment")
                {
                    throw new HireValidationException(new Dictionary<string, string[]>
                    {
                        [e.Code == "invalid_rating" ? "rating" : "comment"] =
                        [
                            e.Code == "invalid_rating"
                                ? "Điểm đánh giá phải từ 1 đến 5 sao."
                                : "Nhận xét không được chỉ chứa khoảng trắng và tối đa 1000 ký tự."
                        ]
                    });
                }
                catch (HireRuleException e)
                {
                    throw new HireStoreException(e.Code);
                }
            },
            ct);

        var detail = await queries.DetailAsync(requestId, ct);
        return detail.Review!;
    }

    public async Task<HireReviewDto> ReplyAsync(Guid requestId, ReplyHireReviewCommand command, CancellationToken ct)
    {
        if (user.UserId is not { } actor) throw new HireStoreException("unauthorized");
        if (user.Role is not AccountRole.TUTOR) throw new HireStoreException("forbidden");

        await store.ExecuteAsync(
            new(actor, Guid.Empty, Guid.Empty, RequestId: requestId, RequireOffering: false, RequireExpectedVersion: false),
            async (session, token) =>
            {
                var request = session.Request ?? throw new HireStoreException("not_found");
                if (session.Offering.TutorUserId != actor) throw new HireStoreException("forbidden");

                var existing = await session.FindReviewByRequestIdAsync(requestId, token);
                if (existing is not { IsVisible: true }) throw new HireStoreException("not_found");

                var now = clock.UtcNow;
                try
                {
                    existing.Reply(actor, session.Offering.TutorUserId, command.Reply, now);
                    session.NotifyOtherParticipant(
                        "TUTOR_REVIEW_REPLIED",
                        "Gia sư đã phản hồi đánh giá của bạn.",
                        now);
                }
                catch (HireRuleException e) when (e.Code == "invalid_reply")
                {
                    throw new HireValidationException(new Dictionary<string, string[]>
                    {
                        ["reply"] = ["Phản hồi phải từ 1 đến 1000 ký tự và không chỉ chứa khoảng trắng."]
                    });
                }
                catch (HireRuleException e)
                {
                    throw new HireStoreException(e.Code);
                }
            },
            ct);

        var detail = await queries.DetailAsync(requestId, ct);
        return detail.Review!;
    }
}
