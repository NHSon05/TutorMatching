using TutorMatching.Domain.Courses;
using TutorMatching.Domain.Hiring;
using TutorMatching.Domain.Tutors;

namespace TutorMatching.Domain.UnitTests.Hiring;

public sealed class HirePaymentAndReviewTests
{
    private static readonly Guid Learner = Guid.NewGuid();
    private static readonly Guid TutorUser = Guid.NewGuid();
    private static readonly Guid TutorProfileId = Guid.NewGuid();
    private static readonly Guid Outsider = Guid.NewGuid();
    private static readonly DateTimeOffset Now = new(2026, 11, 8, 10, 0, 0, TimeSpan.Zero);

    private static HireRequest CreateAcceptedRequest(
        int sessionsPerWeek = 2,
        int pricePerSessionVnd = 300_000,
        int? courseSessionCount = null)
    {
        var courseId = courseSessionCount.HasValue ? Guid.NewGuid() : (Guid?)null;
        var request = new HireRequest
        {
            Id = Guid.NewGuid(),
            RequesterUserId = Learner,
            TutorProfileId = TutorProfileId,
            CourseId = courseId,
            SessionsPerWeek = sessionsPerWeek,
            DurationMinutes = 90,
            TeachingModeCode = "ONLINE",
            ProposedPriceVnd = pricePerSessionVnd,
            Course = courseSessionCount.HasValue
                ? new Course
                {
                    Id = courseId!.Value,
                    TutorProfileId = TutorProfileId,
                    Name = "Khóa luyện thi",
                    SessionCount = courseSessionCount.Value,
                    PricePerSessionVnd = pricePerSessionVnd,
                }
                : null,
            InitialTerms = new(
                new DateOnly(2026, 11, 15),
                sessionsPerWeek,
                90,
                "ONLINE",
                null,
                null,
                null,
                pricePerSessionVnd,
                [new WeeklyWindow(2, new TimeOnly(18, 0), new TimeOnly(19, 30))])
        };

        request.AcceptInitial(TutorUser, TutorUser, Now.AddHours(-2), null, null);
        return request;
    }

    [Fact]
    public void CalculatePackageBilling_WithoutCourse_UsesFourWeeksMultiplier()
    {
        var request = CreateAcceptedRequest(sessionsPerWeek: 3, pricePerSessionVnd: 250_000, courseSessionCount: null);

        var (unitPriceVnd, billingSessions, amountVnd) = request.CalculatePackageBilling();

        Assert.Equal(250_000, unitPriceVnd);
        Assert.Equal(12, billingSessions); // 3 sessions/week * 4 weeks
        Assert.Equal(3_000_000, amountVnd);
    }

    [Fact]
    public void CalculatePackageBilling_WithCourseSessionCount_UsesCourseSessionCount()
    {
        var request = CreateAcceptedRequest(sessionsPerWeek: 2, pricePerSessionVnd: 350_000, courseSessionCount: 10);

        var (unitPriceVnd, billingSessions, amountVnd) = request.CalculatePackageBilling();

        Assert.Equal(350_000, unitPriceVnd);
        Assert.Equal(10, billingSessions);
        Assert.Equal(3_500_000, amountVnd);
    }

    [Fact]
    public void CreateAndConfirmPayment_TransitionsPaymentStatusToPaid_AndRecordsTimestamps()
    {
        var request = CreateAcceptedRequest(sessionsPerWeek: 2, pricePerSessionVnd: 300_000);
        var idempotencyKey = Guid.NewGuid();

        Assert.Equal("UNPAID", request.PaymentStatusCode);
        Assert.True(request.CanPay(Learner));
        Assert.False(request.CanPay(TutorUser));

        var payment = request.InitiatePayment(Learner, idempotencyKey, Now);

        Assert.Equal("PENDING", request.PaymentStatusCode);
        Assert.Equal("PENDING", payment.StatusCode);
        Assert.Equal(300_000, payment.UnitPriceVnd);
        Assert.Equal(8, payment.BillingSessions);
        Assert.Equal(2_400_000, payment.AmountVnd);
        Assert.Equal("VIETQR_SANDBOX", payment.ProviderCode);
        Assert.False(string.IsNullOrWhiteSpace(payment.TransferReference));
        Assert.False(string.IsNullOrWhiteSpace(payment.QrPayload));

        var confirmTime = Now.AddMinutes(5);
        var history = request.ConfirmPayment(payment, Learner, confirmTime);

        Assert.Equal("PAID", payment.StatusCode);
        Assert.Equal(confirmTime, payment.PaidAt);
        Assert.Equal("PAID", request.PaymentStatusCode);
        Assert.Equal(confirmTime, request.PaidAt);
        Assert.False(request.CanPay(Learner));
        Assert.Equal("ACCEPTED", history.FromStatusCode);
        Assert.Equal("ACCEPTED", history.ToStatusCode);
    }

    [Fact]
    public void ConfirmPayment_SecondPendingPaymentAfterRequestPaid_ThrowsAlreadyPaid()
    {
        var request = CreateAcceptedRequest();
        var first = request.InitiatePayment(Learner, Guid.NewGuid(), Now);
        var second = request.InitiatePayment(Learner, Guid.NewGuid(), Now);
        request.ConfirmPayment(first, Learner, Now.AddMinutes(1));

        var ex = Assert.Throws<HireRuleException>(() => request.ConfirmPayment(second, Learner, Now.AddMinutes(2)));

        Assert.Equal("already_paid", ex.Code);
        Assert.Equal("PENDING", second.StatusCode);
        Assert.Null(second.PaidAt);
    }

    [Theory]
    [InlineData("FAILED")]
    [InlineData("CANCELLED")]
    public void ConfirmPayment_NonPendingPayment_ThrowsStateConflict(string paymentStatus)
    {
        var request = CreateAcceptedRequest();
        var payment = request.InitiatePayment(Learner, Guid.NewGuid(), Now);
        payment.StatusCode = paymentStatus;

        var ex = Assert.Throws<HireRuleException>(() => request.ConfirmPayment(payment, Learner, Now.AddMinutes(1)));

        Assert.Equal("state_conflict", ex.Code);
        Assert.NotEqual("PAID", request.PaymentStatusCode);
    }

    [Theory]
    [InlineData("UNPAID")]
    [InlineData("PENDING")]
    public void Complete_WhenPaymentNotPaidAndNotLegacy_ThrowsPaymentRequired(string paymentStatus)
    {
        var request = CreateAcceptedRequest();
        request.IsLegacy = false;
        request.PaymentStatusCode = paymentStatus;

        var ex = Assert.Throws<HireRuleException>(() =>
            request.Complete(Learner, TutorUser, confirmed: true, reason: "Hoàn thành khóa học", now: Now));

        Assert.Equal("payment_required", ex.Code);
        Assert.Equal("ACCEPTED", request.StatusCode);
        Assert.Null(request.CompletedAt);
    }

    [Fact]
    public void Complete_WhenPaymentIsPaid_TransitionsToCompleted()
    {
        var request = CreateAcceptedRequest();
        var payment = request.InitiatePayment(Learner, Guid.NewGuid(), Now.AddMinutes(-10));
        request.ConfirmPayment(payment, Learner, Now.AddMinutes(-5));

        Assert.True(request.CanComplete(Learner, TutorUser));
        Assert.True(request.CanComplete(TutorUser, TutorUser));

        var history = request.Complete(Learner, TutorUser, confirmed: true, reason: "  Đã học xong khóa học  ", now: Now);

        Assert.Equal("COMPLETED", request.StatusCode);
        Assert.Equal(Now, request.CompletedAt);
        Assert.Equal("Đã học xong khóa học", history.Reason);
    }

    [Fact]
    public void Complete_WhenIsLegacyAndUnpaid_AllowsCompletionForBackwardCompatibility()
    {
        var request = CreateAcceptedRequest();
        request.IsLegacy = true;
        request.PaymentStatusCode = "UNPAID";

        Assert.True(request.CanComplete(Learner, TutorUser));

        var history = request.Complete(Learner, TutorUser, confirmed: true, reason: null, now: Now);

        Assert.Equal("COMPLETED", request.StatusCode);
        Assert.Equal("COMPLETED", history.ToStatusCode);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(6)]
    public void CreateReview_WithOutOfBoundsRating_ThrowsInvalidRating(int invalidRating)
    {
        var request = CreateCompletedPaidRequest();

        var ex = Assert.Throws<HireRuleException>(() =>
            HireReview.Create(request, Learner, invalidRating, "Gia sư dạy tốt", Now));

        Assert.Equal("invalid_rating", ex.Code);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("overlong")]
    public void CreateReview_WithInvalidComment_ThrowsInvalidComment(string commentCase)
    {
        var request = CreateCompletedPaidRequest();
        var comment = commentCase == "overlong" ? new string('a', 1001) : commentCase;

        var ex = Assert.Throws<HireRuleException>(() =>
            HireReview.Create(request, Learner, 5, comment, Now));

        Assert.Equal("invalid_comment", ex.Code);
    }

    [Fact]
    public void CreateReview_RequiresCompletedRequestAndLearnerOwnership()
    {
        var acceptedRequest = CreateAcceptedRequest();
        var stateEx = Assert.Throws<HireRuleException>(() =>
            HireReview.Create(acceptedRequest, Learner, 5, "Tốt", Now));
        Assert.Equal("state_conflict", stateEx.Code);

        var completedRequest = CreateCompletedPaidRequest();
        var forbiddenEx = Assert.Throws<HireRuleException>(() =>
            HireReview.Create(completedRequest, TutorUser, 5, "Tự đánh giá", Now));
        Assert.Equal("forbidden", forbiddenEx.Code);

        var outsiderEx = Assert.Throws<HireRuleException>(() =>
            HireReview.Create(completedRequest, Outsider, 5, "Người ngoài", Now));
        Assert.Equal("forbidden", outsiderEx.Code);
    }

    [Fact]
    public void ReplyToReview_EnforcesTutorOwnership_LengthBounds_AndSingleReplyInvariant()
    {
        var completedRequest = CreateCompletedPaidRequest();
        var review = HireReview.Create(completedRequest, Learner, 5, "  Gia sư rất nhiệt tình!  ", Now);

        Assert.Equal(5, review.Rating);
        Assert.Equal("Gia sư rất nhiệt tình!", review.Comment);
        Assert.Null(review.TutorReply);

        // Non-tutor cannot reply
        var forbiddenEx = Assert.Throws<HireRuleException>(() =>
            review.Reply(Learner, TutorUser, "Cảm ơn bạn", Now.AddHours(1)));
        Assert.Equal("forbidden", forbiddenEx.Code);

        // Invalid reply text rejected
        foreach (var badReply in new string?[] { null, "", "   ", new string('x', 1001) })
        {
            var invalidEx = Assert.Throws<HireRuleException>(() =>
                review.Reply(TutorUser, TutorUser, badReply, Now.AddHours(1)));
            Assert.Equal("invalid_reply", invalidEx.Code);
        }

        // First valid reply succeeds
        var replyTime = Now.AddHours(2);
        review.Reply(TutorUser, TutorUser, "  Cảm ơn em và gia đình đã tin tưởng!  ", replyTime);

        Assert.Equal("Cảm ơn em và gia đình đã tin tưởng!", review.TutorReply);
        Assert.Equal(replyTime, review.TutorRepliedAt);

        // Second reply throws reply_already_submitted
        var duplicateReplyEx = Assert.Throws<HireRuleException>(() =>
            review.Reply(TutorUser, TutorUser, "Phản hồi lần 2", replyTime.AddMinutes(10)));
        Assert.Equal("reply_already_submitted", duplicateReplyEx.Code);
    }

    [Fact]
    public void TutorProfile_ApplyRatingAggregate_ComputesRoundedAverageAndCount()
    {
        var profile = new TutorProfile
        {
            Id = TutorProfileId,
            UserId = TutorUser,
        };

        profile.UpdateRatingAggregate([5, 4, 5]);

        Assert.Equal(3, profile.ReviewCount);
        Assert.Equal(4.67m, profile.AverageRating);

        profile.UpdateRatingAggregate([]);

        Assert.Equal(0, profile.ReviewCount);
        Assert.Equal(0.00m, profile.AverageRating);
    }

    private static HireRequest CreateCompletedPaidRequest()
    {
        var request = CreateAcceptedRequest();
        var payment = request.InitiatePayment(Learner, Guid.NewGuid(), Now.AddHours(-1));
        request.ConfirmPayment(payment, Learner, Now.AddMinutes(-30));
        request.Complete(Learner, TutorUser, confirmed: true, reason: "Hoàn thành", now: Now.AddMinutes(-10));
        return request;
    }
}
