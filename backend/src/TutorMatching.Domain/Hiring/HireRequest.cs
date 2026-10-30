using System.Collections.Immutable;
using TutorMatching.Domain.Catalog;
using TutorMatching.Domain.Courses;
using TutorMatching.Domain.Locations;
using TutorMatching.Domain.Tutors;

namespace TutorMatching.Domain.Hiring;

public sealed class HireRequest
{
    public Guid Id { get; set; }
    public Guid Version { get; set; } = Guid.NewGuid();
    public bool IsLegacy { get; set; }
    public int? ListedPriceVnd { get; set; }
    public int LatestProposalSequence { get; set; }
    public int NextEventSequence { get; set; } = 1;
    public HireTerms InitialTerms { get; set; } = null!;
    public FinalAgreement? FinalAgreement { get; set; }
    public Guid RequesterUserId { get; set; }
    public Guid TutorProfileId { get; set; }
    public Guid SubjectId { get; set; }
    public Guid? CourseId { get; set; }
    public DateOnly StartDate { get; set; }
    public int SessionsPerWeek { get; set; }
    public int DurationMinutes { get; set; }
    public string TeachingModeCode { get; set; } = "ONLINE";
    public string? ProvinceCode { get; set; }
    public string? DistrictCode { get; set; }
    public string? LocationDetail { get; set; }
    public int ProposedPriceVnd { get; set; }
    public int? AgreedPriceVnd { get; set; }
    public string StatusCode { get; set; } = "PENDING";
    public string? Note { get; set; }
    public string? CancelReason { get; set; }
    public DateTimeOffset? AcceptedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public TutorProfile? TutorProfile { get; set; }
    public Subject? Subject { get; set; }
    public Course? Course { get; set; }
    public Province? Province { get; set; }
    public District? District { get; set; }

    public bool CanRespond(Guid actor, Guid tutor) => actor == tutor && StatusCode is "PENDING" or "NEGOTIATING";
    public bool CanAcceptInitial(Guid actor, Guid tutor) => CanRespond(actor, tutor) && LatestProposalSequence == 0 && FinalAgreement is null;

    public RequestStatusHistory AcceptInitial(Guid actor, Guid tutor, DateTimeOffset now, string? provinceName, string? districtName)
    {
        if (actor != tutor) throw new HireRuleException("forbidden");
        if (!CanAcceptInitial(actor, tutor)) throw new HireRuleException("state_conflict");
        FinalAgreement = new FinalAgreement(InitialTerms, actor, now, null, provinceName, districtName);
        AgreedPriceVnd = InitialTerms.PriceVnd;
        AcceptedAt = now.ToUniversalTime();
        return Transition("ACCEPTED", actor, null, now);
    }

    public RequestStatusHistory Reject(Guid actor, Guid tutor, string? reason, DateTimeOffset now)
    {
        if (actor != tutor) throw new HireRuleException("forbidden");
        if (!CanRespond(actor, tutor)) throw new HireRuleException("state_conflict");
        if (!HireTerms.ValidReason(reason)) throw new HireRuleException("invalid_reason");
        return Transition("REJECTED", actor, reason!.Trim(), now);
    }

    public Negotiation? LatestProposal => Negotiations.OrderByDescending(p => p.Sequence).FirstOrDefault();
    public HireTerms CurrentTerms => LatestProposal?.Terms ?? InitialTerms;
    public bool CanPropose(Guid actor, Guid tutor) => (actor == tutor || actor == RequesterUserId) &&
        StatusCode is "PENDING" or "NEGOTIATING" && FinalAgreement is null;
    public bool CanAcceptProposal(Guid actor, Guid tutor, int sequence) => CanPropose(actor, tutor) &&
        StatusCode == "NEGOTIATING" && LatestProposal is { } latest && latest.Sequence == sequence &&
        LatestProposalSequence == sequence && latest.SenderUserId != actor;

    public (Negotiation Proposal, RequestStatusHistory History) Propose(Guid actor, Guid tutor,
        int? price, IEnumerable<WeeklyWindow>? schedules, string? note, DateTimeOffset now)
    {
        if (actor != tutor && actor != RequesterUserId) throw new HireRuleException("forbidden");
        if (!CanPropose(actor, tutor)) throw new HireRuleException("state_conflict");
        var current = CurrentTerms;
        var terms = current with { PriceVnd = price ?? current.PriceVnd,
            Schedules = (schedules ?? current.Schedules).OrderBy(w => w.DayOfWeek).ThenBy(w => w.StartTime).ThenBy(w => w.EndTime).ToImmutableArray() };
        if (!HireTerms.ValidNote(note) || terms.Validate(now, terms.Schedules, [terms.TeachingMode], true).Count != 0)
            throw new HireRuleException("invalid_terms");
        if (terms.PriceVnd == current.PriceVnd && terms.Schedules.SequenceEqual(current.Schedules.OrderBy(w => w.DayOfWeek).ThenBy(w => w.StartTime).ThenBy(w => w.EndTime)))
            throw new HireRuleException("unchanged_terms");
        var proposal = new Negotiation { Id = Guid.NewGuid(), HireRequestId = Id, SenderUserId = actor,
            Terms = terms, ProposedPriceVnd = terms.PriceVnd, Note = note?.Trim(), CreatedAt = now.ToUniversalTime() };
        foreach (var window in terms.Schedules)
            proposal.Schedules.Add(new NegotiationSchedule { Id = Guid.NewGuid(), NegotiationId = proposal.Id,
                DayOfWeek = window.DayOfWeek, StartTime = window.StartTime, EndTime = window.EndTime });
        return (proposal, Transition("NEGOTIATING", actor, null, now));
    }

    public RequestStatusHistory AcceptProposal(Guid actor, Guid tutor, int sequence, DateTimeOffset now,
        string? provinceName, string? districtName)
    {
        if (actor != tutor && actor != RequesterUserId) throw new HireRuleException("forbidden");
        if (!CanAcceptProposal(actor, tutor, sequence)) throw new HireRuleException("state_conflict");
        var terms = LatestProposal!.Terms;
        if (terms.Validate(now, terms.Schedules, [terms.TeachingMode], true).Count != 0)
            throw new HireRuleException("availability_changed");
        FinalAgreement = new FinalAgreement(terms, actor, now, sequence, provinceName, districtName);
        AgreedPriceVnd = terms.PriceVnd;
        AcceptedAt = now.ToUniversalTime();
        return Transition("ACCEPTED", actor, null, now);
    }

    public bool CanCancel(Guid actor, Guid tutor) =>
        (actor == RequesterUserId && StatusCode is "PENDING" or "NEGOTIATING") ||
        ((actor == RequesterUserId || actor == tutor) && StatusCode == "ACCEPTED");
    public bool CanComplete(Guid actor, Guid tutor) =>
        (actor == RequesterUserId || actor == tutor) && StatusCode == "ACCEPTED";

    public RequestStatusHistory Cancel(Guid actor, Guid tutor, bool confirmed, string? reason, DateTimeOffset now)
    {
        if (actor != RequesterUserId && actor != tutor) throw new HireRuleException("forbidden");
        if (!CanCancel(actor, tutor)) throw new HireRuleException("state_conflict");
        ValidateClosing(confirmed, reason, StatusCode == "ACCEPTED");
        CancelReason = reason?.Trim();
        return Transition("CANCELLED", actor, CancelReason, now);
    }

    public RequestStatusHistory Complete(Guid actor, Guid tutor, bool confirmed, string? reason, DateTimeOffset now)
    {
        if (actor != RequesterUserId && actor != tutor) throw new HireRuleException("forbidden");
        if (!CanComplete(actor, tutor)) throw new HireRuleException("state_conflict");
        ValidateClosing(confirmed, reason, false);
        CompletedAt = now.ToUniversalTime();
        return Transition("COMPLETED", actor, reason?.Trim(), now);
    }

    private static void ValidateClosing(bool confirmed, string? reason, bool reasonRequired)
    {
        if (!confirmed) throw new HireRuleException("confirmation_required");
        if ((reasonRequired || reason is not null) && !HireTerms.ValidReason(reason))
            throw new HireRuleException("invalid_reason");
    }

    private RequestStatusHistory Transition(string status, Guid actor, string? reason, DateTimeOffset now)
    {
        var history = new RequestStatusHistory
        {
            Id = Guid.NewGuid(),
            HireRequestId = Id,
            ActorUserId = actor,
            FromStatusCode = StatusCode,
            ToStatusCode = status,
            Reason = reason,
            CreatedAt = now.ToUniversalTime()
        };
        StatusCode = status;
        UpdatedAt = now.ToUniversalTime();
        return history;
    }

    public ICollection<RequestSchedule> Schedules { get; set; } = [];
    public ICollection<Negotiation> Negotiations { get; set; } = [];
    public ICollection<RequestStatusHistory> StatusHistories { get; set; } = [];
}
