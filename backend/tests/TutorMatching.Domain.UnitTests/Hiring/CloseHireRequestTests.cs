using TutorMatching.Domain.Hiring;
using TutorMatching.Domain.Tutors;

namespace TutorMatching.Domain.UnitTests.Hiring;

public sealed class CloseHireRequestTests
{
    private static readonly Guid Learner = Guid.NewGuid(), Tutor = Guid.NewGuid(), Outsider = Guid.NewGuid();
    private static readonly DateTimeOffset Now = new(2026, 10, 30, 8, 0, 0, TimeSpan.Zero);
    private static HireRequest Request(string status)
    {
        var request = new HireRequest { Id = Guid.NewGuid(), RequesterUserId = Learner,
            InitialTerms = new(new DateOnly(2026, 11, 10), 1, 60, "ONLINE", null, null, null, 150000,
                [new WeeklyWindow(1, new TimeOnly(18, 0), new TimeOnly(19, 0))]) };
        if (status == "ACCEPTED") request.AcceptInitial(Tutor, Tutor, Now.AddDays(-1), null, null);
        request.StatusCode = status;
        return request;
    }

    public static IEnumerable<object[]> Matrix() =>
        from status in new[] { "PENDING", "NEGOTIATING", "ACCEPTED", "REJECTED", "CANCELLED", "COMPLETED" }
        from actor in new[] { "learner", "tutor", "outsider" }
        from complete in new[] { false, true }
        select new object[] { status, actor, complete };

    [Theory, MemberData(nameof(Matrix))]
    public void EnforcesEveryActorStateActionAndPreservesSnapshots(string status, string role, bool complete)
    {
        var request = Request(status);
        var actor = role == "learner" ? Learner : role == "tutor" ? Tutor : Outsider;
        var allowed = role != "outsider" && (complete ? status == "ACCEPTED" :
            status == "ACCEPTED" || role == "learner" && status is "PENDING" or "NEGOTIATING");
        var original = request.InitialTerms; var agreement = request.FinalAgreement; var version = request.Version;
        var acceptedAt = request.AcceptedAt;
        Assert.Equal(allowed, complete ? request.CanComplete(actor, Tutor) : request.CanCancel(actor, Tutor));
        RequestStatusHistory Action() => complete ? request.Complete(actor, Tutor, true, "  Done  ", Now) : request.Cancel(actor, Tutor, true, "  Done  ", Now);
        if (allowed)
        {
            var history = Action();
            Assert.Equal(complete ? "COMPLETED" : "CANCELLED", request.StatusCode);
            Assert.Equal(status, history.FromStatusCode);
            Assert.Equal(request.StatusCode, history.ToStatusCode);
            Assert.Equal(actor, history.ActorUserId);
            Assert.Equal("Done", history.Reason);
            Assert.Equal(Now, history.CreatedAt);
            Assert.Equal(Now, request.UpdatedAt);
            Assert.Equal(complete ? Now : (DateTimeOffset?)null, request.CompletedAt);
            Assert.Equal(complete ? null : "Done", request.CancelReason);
        }
        else
        {
            Assert.Throws<HireRuleException>(Action);
            Assert.Equal(status, request.StatusCode);
        }
        Assert.Same(original, request.InitialTerms);
        Assert.Same(agreement, request.FinalAgreement);
        Assert.Equal(acceptedAt, request.AcceptedAt);
        Assert.Equal(version, request.Version); // Persistence owns the concurrency token.
    }

    [Theory]
    [InlineData("PENDING", false)] [InlineData("NEGOTIATING", false)]
    [InlineData("ACCEPTED", false)] [InlineData("ACCEPTED", true)]
    public void ExplicitConfirmationRequiredWithoutMutation(string status, bool complete)
    {
        var request = Request(status);
        var error = Assert.Throws<HireRuleException>(() => complete
            ? request.Complete(Learner, Tutor, false, "Reason", Now)
            : request.Cancel(Learner, Tutor, false, "Reason", Now));
        Assert.Equal("confirmation_required", error.Code);
        Assert.Equal(status, request.StatusCode);
    }

    [Theory]
    [InlineData(null)] [InlineData("")] [InlineData("   ")] [InlineData("overlong")]
    public void AcceptedCancellationRequiresValidReason(string? reason)
    {
        foreach (var actor in new[] { Learner, Tutor })
        {
            var request = Request("ACCEPTED");
            Assert.Equal("invalid_reason", Assert.Throws<HireRuleException>(() =>
                request.Cancel(actor, Tutor, true, reason == "overlong" ? new string('x', 1001) : reason, Now)).Code);
            Assert.Equal("ACCEPTED", request.StatusCode);
        }
    }

    [Theory]
    [InlineData(false)] [InlineData(true)]
    public void OptionalReasonCanBeOmittedButIfPresentMustBeValid(bool complete)
    {
        RequestStatusHistory Action(HireRequest request, string? reason) => complete
            ? request.Complete(Learner, Tutor, true, reason, Now) : request.Cancel(Learner, Tutor, true, reason, Now);
        var status = complete ? "ACCEPTED" : "PENDING";
        Assert.Null(Action(Request(status), null).Reason);
        Assert.Equal(1000, Action(Request(status), new string('x', 1000)).Reason!.Length);
        foreach (var reason in new[] { "", "  ", new string('x', 1001) })
            Assert.Throws<HireRuleException>(() => Action(Request(status), reason));
    }

    [Theory]
    [InlineData("REJECTED")] [InlineData("CANCELLED")] [InlineData("COMPLETED")]
    public void TerminalStatesRejectAllOtherActions(string status)
    {
        var request = Request(status);
        Assert.Throws<HireRuleException>(() => request.AcceptInitial(Tutor, Tutor, Now, null, null));
        Assert.Throws<HireRuleException>(() => request.AcceptProposal(Learner, Tutor, 1, Now, null, null));
        Assert.Throws<HireRuleException>(() => request.Reject(Tutor, Tutor, "No", Now));
        Assert.Throws<HireRuleException>(() => request.Propose(Tutor, Tutor, 170000, null, null, Now));
        Assert.Equal(status, request.StatusCode);
    }
}
