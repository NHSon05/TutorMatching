using TutorMatching.Application.Abstractions;
using TutorMatching.Domain.Hiring;
using TutorMatching.Domain.Users;

namespace TutorMatching.Application.Hiring;

public sealed class CloseHireRequest(IHireRequestStore store, ICurrentUser user, IClock clock)
{
    public Task<HireResult> CancelAsync(Guid id, CloseHireRequestCommand command, CancellationToken ct) =>
        ExecuteAsync(id, command, false, ct);

    public Task<HireResult> CompleteAsync(Guid id, CloseHireRequestCommand command, CancellationToken ct) =>
        ExecuteAsync(id, command, true, ct);

    private async Task<HireResult> ExecuteAsync(Guid id, CloseHireRequestCommand command, bool complete, CancellationToken ct)
    {
        if (user.UserId is not { } actor) throw new HireStoreException("unauthorized");
        if (user.Role is not (AccountRole.LEARNER or AccountRole.TUTOR)) throw new HireStoreException("forbidden");
        HireRequest? request = null;
        await store.ExecuteAsync(new(actor, Guid.Empty, Guid.Empty, RequestId: id,
            ExpectedVersion: command.ExpectedVersion, RequireOffering: false), (session, _) =>
        {
            request = session.Request ?? throw new HireStoreException("not_found");
            var now = clock.UtcNow;
            try
            {
                var history = complete
                    ? request.Complete(actor, session.Offering.TutorUserId, command.Confirmed, command.Reason, now)
                    : request.Cancel(actor, session.Offering.TutorUserId, command.Confirmed, command.Reason, now);
                session.AddStatusEvent(history);
                session.NotifyOtherParticipant(complete ? "HIRE_REQUEST_COMPLETED" : "HIRE_REQUEST_CANCELLED",
                    complete ? "Việc học theo yêu cầu thuê đã hoàn tất." : "Yêu cầu thuê gia sư đã được hủy.", now);
            }
            catch (HireRuleException e) when (e.Code is "invalid_reason" or "confirmation_required")
            {
                throw new HireValidationException(new Dictionary<string, string[]> {
                    [e.Code == "invalid_reason" ? "reason" : "confirmed"] = [e.Code == "invalid_reason"
                        ? "Nhập lý do từ 1 đến 1000 ký tự, không chỉ chứa khoảng trắng."
                        : "Cần xác nhận trước khi thực hiện thao tác."] });
            }
            catch (HireRuleException e) { throw new HireStoreException(e.Code); }
            return Task.CompletedTask;
        }, ct);
        return new HireResult { Id = request!.Id, Version = request.Version, Status = request.StatusCode };
    }
}
