using TutorMatching.Domain.Hiring;
using TutorMatching.Domain.Tutors;

namespace TutorMatching.Domain.UnitTests.Hiring;

public sealed class InitialResponseTests
{
    private static readonly Guid Tutor = Guid.NewGuid();
    private static readonly DateTimeOffset Now = new(2026, 10, 29, 8, 0, 0, TimeSpan.Zero);
    private static HireRequest Request(string status = "PENDING") => new()
    {
        Id = Guid.NewGuid(),
        RequesterUserId = Guid.NewGuid(),
        StatusCode = status,
        InitialTerms = new(new DateOnly(2026, 11, 10), 1, 60, "ONLINE", null, null, null, 150000,
            [new WeeklyWindow(1, new TimeOnly(18, 0), new TimeOnly(19, 0))])
    };

    [Theory]
    [InlineData("PENDING")]
    [InlineData("NEGOTIATING")]
    public void TutorAcceptsInitialTermsAndFreezesAgreement(string status)
    {
        var request = Request(status);
        var terms = request.InitialTerms;
        var history = request.AcceptInitial(Tutor, Tutor, Now, null, null);
        Assert.Equal("ACCEPTED", request.StatusCode);
        Assert.Equal(terms, request.FinalAgreement!.Terms);
        Assert.Equal(Tutor, request.FinalAgreement.AcceptedBy);
        Assert.Null(request.FinalAgreement.ProposalSequence);
        Assert.Equal(Now, request.AcceptedAt);
        Assert.Equal(150000, request.AgreedPriceVnd);
        Assert.Equal(status, history.FromStatusCode);
        Assert.Equal("ACCEPTED", history.ToStatusCode);
        Assert.Equal(Tutor, history.ActorUserId);
        Assert.Equal(Now, history.CreatedAt);
    }

    [Theory]
    [InlineData("ACCEPTED")]
    [InlineData("REJECTED")]
    [InlineData("CANCELLED")]
    [InlineData("COMPLETED")]
    public void ClosedRequestsCannotBeRespondedTo(string status)
    {
        var request = Request(status);
        Assert.Throws<HireRuleException>(() => request.AcceptInitial(Tutor, Tutor, Now, null, null));
        Assert.Throws<HireRuleException>(() => request.Reject(Tutor, Tutor, "Not available", Now));
        Assert.Equal(status, request.StatusCode);
    }

    [Fact]
    public void OnlyDesignatedTutorCanRespondAndInitialAcceptanceCannotSkipProposal()
    {
        var request = Request();
        Assert.Throws<HireRuleException>(() => request.AcceptInitial(request.RequesterUserId, Tutor, Now, null, null));
        Assert.Throws<HireRuleException>(() => request.Reject(Guid.NewGuid(), Tutor, "No", Now));
        request.LatestProposalSequence = 1;
        Assert.Throws<HireRuleException>(() => request.AcceptInitial(Tutor, Tutor, Now, null, null));
        Assert.Null(request.FinalAgreement);
        Assert.Equal("PENDING", request.StatusCode);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void RejectRequiresNonblankReason(string? reason)
    {
        var request = Request();
        Assert.Throws<HireRuleException>(() => request.Reject(Tutor, Tutor, reason, Now));
        Assert.Equal("PENDING", request.StatusCode);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(1000)]
    public void RejectRecordsReasonActorAndTime(int length)
    {
        var request = Request("NEGOTIATING");
        var history = request.Reject(Tutor, Tutor, new string('x', length), Now);
        Assert.Equal("REJECTED", request.StatusCode);
        Assert.Equal(new string('x', length), history.Reason);
        Assert.Equal(Tutor, history.ActorUserId);
        Assert.Equal(Now, history.CreatedAt);
        Assert.Null(request.FinalAgreement);
    }

    [Fact]
    public void RejectRejectsOverlongReason()
    {
        var request = Request();
        Assert.Throws<HireRuleException>(() => request.Reject(Tutor, Tutor, new string('x', 1001), Now));
        Assert.Equal("PENDING", request.StatusCode);
    }
}
