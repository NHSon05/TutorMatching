using TutorMatching.Application.Abstractions;
using TutorMatching.Domain.Hiring;
using TutorMatching.Domain.Users;

namespace TutorMatching.Application.Hiring;

public sealed class RespondToHireRequest(IHireRequestStore store, ICurrentUser user, IClock clock)
{
    public Task<HireResult> AcceptAsync(Guid id, AcceptHireRequestCommand command, CancellationToken ct) =>
        ExecuteAsync(id, command.ExpectedVersion, true, command.ProposalSequence, null, ct);

    public Task<HireResult> RejectAsync(Guid id, RejectHireRequestCommand command, CancellationToken ct) =>
        ExecuteAsync(id, command.ExpectedVersion, false, null, command.Reason, ct);

    private async Task<HireResult> ExecuteAsync(Guid id, Guid version, bool accept, int? proposalSequence, string? reason, CancellationToken ct)
    {
        if (user.UserId is not { } actor) throw new HireStoreException("unauthorized");
        if ((!accept || proposalSequence is null) ? user.Role != AccountRole.TUTOR : user.Role is not (AccountRole.LEARNER or AccountRole.TUTOR)) throw new HireStoreException("forbidden");
        if (!accept && !HireTerms.ValidReason(reason))
            throw new HireValidationException(new Dictionary<string, string[]> { ["reason"] = ["Nhập lý do từ 1 đến 1000 ký tự, không chỉ chứa khoảng trắng."] });
        HireRequest? request = null;
        await store.ExecuteAsync(new(actor, Guid.Empty, Guid.Empty, RequestId: id, ExpectedVersion: version, RequireOffering: accept), (session, _) =>
        {
            request = session.Request ?? throw new HireStoreException("not_found");
            var now = clock.UtcNow;
            if (accept)
            {
                if (proposalSequence is { } sequence
                    ? !request.CanAcceptProposal(actor, session.Offering.TutorUserId, sequence)
                    : !request.CanAcceptInitial(actor, session.Offering.TutorUserId))
                    throw new HireStoreException("state_conflict");
                var errors = (proposalSequence is null ? request.InitialTerms : request.CurrentTerms).Validate(now, session.Offering.Availability, session.Offering.Modes, session.Offering.ValidLocation);
                if (errors.Count != 0) throw new HireStoreException("availability_changed");
            }
            try
            {
                var history = accept
                    ? proposalSequence is { } acceptedSequence
                        ? request.AcceptProposal(actor, session.Offering.TutorUserId, acceptedSequence, now, session.Offering.ProvinceName, session.Offering.DistrictName)
                        : request.AcceptInitial(actor, session.Offering.TutorUserId, now, session.Offering.ProvinceName, session.Offering.DistrictName)
                    : request.Reject(actor, session.Offering.TutorUserId, reason, now);
                session.AddStatusEvent(history);
                session.NotifyOtherParticipant(accept ? "HIRE_REQUEST_ACCEPTED" : "HIRE_REQUEST_REJECTED",
                    accept ? "Điều khoản thuê gia sư đã được chấp nhận." : "Gia sư đã từ chối yêu cầu thuê.", now);
            }
            catch (HireRuleException e) { throw new HireStoreException(e.Code); }
            return Task.CompletedTask;
        }, ct);
        return new HireResult { Id = request!.Id, Version = request.Version, Status = request.StatusCode };
    }
}
