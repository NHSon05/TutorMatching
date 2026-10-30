using TutorMatching.Domain.Hiring;
using TutorMatching.Domain.Tutors;

namespace TutorMatching.Domain.UnitTests.Hiring;

public sealed class NegotiationTests
{
    private static readonly Guid Tutor = Guid.NewGuid();
    private static readonly DateTimeOffset Now = new(2026, 10, 29, 8, 0, 0, TimeSpan.Zero);
    private static HireRequest Request() => new()
    {
        Id = Guid.NewGuid(),
        RequesterUserId = Guid.NewGuid(),
        InitialTerms = new(new DateOnly(2026, 11, 10), 1, 60, "ONLINE", null, null, null, 150000,
            [new WeeklyWindow(1, new TimeOnly(18, 0), new TimeOnly(20, 0))])
    };
    private static Negotiation Propose(HireRequest r, Guid actor, int? price, WeeklyWindow[]? schedules = null)
    {
        var (proposal, history) = r.Propose(actor, Tutor, price, schedules, "Note", Now);
        proposal.Sequence = ++r.LatestProposalSequence;
        r.Negotiations.Add(proposal);
        Assert.Equal("NEGOTIATING", history.ToStatusCode);
        return proposal;
    }
    [Fact]
    public void OmittedTermsInheritLatestAndEarlierSnapshotsNeverChange()
    {
        var r = Request(); var original = r.InitialTerms;
        var first = Propose(r, Tutor, 170000);
        var second = Propose(r, r.RequesterUserId, null, [new(1, new(19, 0), new(20, 0))]);
        Assert.Equal(170000, second.Terms.PriceVnd);
        Assert.True(original.Schedules.SequenceEqual(first.Terms.Schedules));
        Assert.Equal(150000, r.InitialTerms.PriceVnd);
        Assert.Equal(new TimeOnly(18, 0), first.Terms.Schedules[0].StartTime);
        Assert.Throws<HireRuleException>(() => r.AcceptProposal(r.RequesterUserId, Tutor, 2, Now, null, null));
        Assert.Throws<HireRuleException>(() => r.AcceptProposal(Tutor, Tutor, 1, Now, null, null));
        r.AcceptProposal(Tutor, Tutor, 2, Now, null, null);
        Assert.Equal(second.Terms, r.FinalAgreement!.Terms);
        Assert.Equal(2, r.FinalAgreement.ProposalSequence);
        Assert.Equal("ACCEPTED", r.StatusCode);
        Assert.Throws<HireRuleException>(() => r.Propose(Tutor, Tutor, 180000, null, null, Now));
    }
    [Theory]
    [InlineData(null)]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(150000)]
    public void RequiresPositiveChangedPriceOrSchedule(int? price)
    {
        var r = Request();
        Assert.Throws<HireRuleException>(() => r.Propose(Tutor, Tutor, price, null, null, Now));
        Assert.Equal("PENDING", r.StatusCode);
    }
    [Fact]
    public void RejectsEquivalentSchedulesInvalidSchedulesAndOutsiders()
    {
        var r = Request();
        Assert.Throws<HireRuleException>(() => r.Propose(Tutor, Tutor, null, r.InitialTerms.Schedules, null, Now));
        Assert.Throws<HireRuleException>(() => r.Propose(Tutor, Tutor, null, [], null, Now));
        Assert.Throws<HireRuleException>(() => r.Propose(Tutor, Tutor, null, [new(1, new(20, 0), new(19, 0))], null, Now));
        Assert.Throws<HireRuleException>(() => r.Propose(Guid.NewGuid(), Tutor, 170000, null, null, Now));
    }
    [Theory]
    [InlineData("ACCEPTED")]
    [InlineData("REJECTED")]
    [InlineData("CANCELLED")]
    [InlineData("COMPLETED")]
    public void ClosedStatesRejectProposals(string status)
    {
        var r = Request(); r.StatusCode = status;
        Assert.Throws<HireRuleException>(() => r.Propose(Tutor, Tutor, 170000, null, null, Now));
    }
    [Fact]
    public void ExpiredTermsCannotBeProposedOrAccepted()
    {
        var r = Request(); Propose(r, Tutor, 170000);
        var later = Now.AddDays(30);
        Assert.Throws<HireRuleException>(() => r.Propose(r.RequesterUserId, Tutor, 180000, null, null, later));
        Assert.Throws<HireRuleException>(() => r.AcceptProposal(r.RequesterUserId, Tutor, 1, later, null, null));
    }
}
