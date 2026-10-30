using System.Collections.Immutable;
using System.Globalization;
using TutorMatching.Application.Abstractions;
using TutorMatching.Domain.Hiring;
using TutorMatching.Domain.Tutors;
using TutorMatching.Domain.Users;

namespace TutorMatching.Application.Hiring;

public sealed class NegotiateHireRequest(IHireRequestStore store, ICurrentUser user, IClock clock)
{
    public async Task<HireResult> ExecuteAsync(Guid id, ProposeHireRequestCommand command, CancellationToken ct)
    {
        if (user.UserId is not { } actor) throw new HireStoreException("unauthorized");
        if (user.Role is not (AccountRole.LEARNER or AccountRole.TUTOR)) throw new HireStoreException("forbidden");
        var schedules = command.Schedules?.Select(s =>
        {
            if (s is null || !TimeOnly.TryParseExact(s.StartTime, "HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out var start) ||
                !TimeOnly.TryParseExact(s.EndTime, "HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out var end))
                throw new HireValidationException(new Dictionary<string, string[]> { ["schedules"] = ["Use HH:mm times."] });
            return new WeeklyWindow(s.DayOfWeek, start, end);
        }).ToImmutableArray();
        HireRequest? request = null;
        await store.ExecuteAsync(new(actor, Guid.Empty, Guid.Empty, RequestId: id, ExpectedVersion: command.ExpectedVersion), (session, _) =>
        {
            request = session.Request ?? throw new HireStoreException("not_found");
            if (!request.CanPropose(actor, session.Offering.TutorUserId)) throw new HireStoreException("state_conflict");
            var now = clock.UtcNow;
            var effective = request.CurrentTerms with { PriceVnd = command.PriceVnd ?? request.CurrentTerms.PriceVnd,
                Schedules = schedules ?? request.CurrentTerms.Schedules };
            var errors = effective.Validate(now, effective.Schedules, [effective.TeachingMode], true).ToDictionary(x => x.Key, x => x.Value);
            if (!HireTerms.ValidNote(command.Note)) errors["note"] = ["Maximum 2000 characters."];
            if (errors.Count != 0) throw new HireValidationException(errors);
            if (effective.Validate(now, session.Offering.Availability, session.Offering.Modes, session.Offering.ValidLocation).Count != 0)
                throw new HireStoreException("availability_changed");
            try
            {
                var (proposal, history) = request.Propose(actor, session.Offering.TutorUserId, command.PriceVnd, schedules, command.Note, now);
                session.AddProposal(proposal);
                session.AddStatusEvent(history);
                session.NotifyOtherParticipant("HIRE_REQUEST_PROPOSED", "Có đề xuất mới về học phí hoặc lịch học.", now);
            }
            catch (HireRuleException e) when (e.Code is "invalid_terms" or "unchanged_terms")
            {
                throw new HireValidationException(new Dictionary<string, string[]> { ["priceVnd"] = ["Cần thay đổi giá hoặc lịch học hợp lệ."], ["schedules"] = ["Cần thay đổi giá hoặc lịch học hợp lệ."] });
            }
            catch (HireRuleException e) { throw new HireStoreException(e.Code); }
            return Task.CompletedTask;
        }, ct);
        return new HireResult { Id = request!.Id, Version = request.Version, Status = request.StatusCode };
    }
}
