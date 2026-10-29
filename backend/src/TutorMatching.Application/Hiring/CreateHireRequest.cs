using System.Collections.Immutable;
using System.Globalization;
using System.Security.Cryptography;
using System.Text.Json;
using TutorMatching.Application.Abstractions;
using TutorMatching.Domain.Hiring;
using TutorMatching.Domain.Tutors;
using TutorMatching.Domain.Users;

namespace TutorMatching.Application.Hiring;

public sealed class HireValidationException(IReadOnlyDictionary<string, string[]> errors) : Exception("validation_failed")
{
    public IReadOnlyDictionary<string, string[]> Errors { get; } = errors;
}

public sealed class CreateHireRequest(IHireRequestStore store, ICurrentUser user, IClock clock)
{
    public async Task<HireCreationOutcome> ExecuteAsync(CreateHireRequestCommand command, Guid key, CancellationToken ct)
    {
        if (user.UserId is not { } actor) throw new HireStoreException("unauthorized");
        if (user.Role != AccountRole.LEARNER) throw new HireStoreException("forbidden");
        if (key == Guid.Empty) throw new HireValidationException(new Dictionary<string, string[]> { ["idempotencyKey"] = ["Use a nonempty UUID."] });
        static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        var windows = (command.Schedules ?? []).Select(s =>
        {
            if (s is null || !TimeOnly.TryParseExact(s.StartTime, "HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out var start) ||
                !TimeOnly.TryParseExact(s.EndTime, "HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out var end))
                throw new HireValidationException(new Dictionary<string, string[]> { ["schedules"] = ["Use HH:mm times."] });
            return new WeeklyWindow(s.DayOfWeek, start, end);
        }).OrderBy(s => s.DayOfWeek).ThenBy(s => s.StartTime).ThenBy(s => s.EndTime).ToImmutableArray();
        var terms = new HireTerms(command.StartDate, command.SessionsPerWeek, command.DurationMinutes, command.TeachingMode,
            Clean(command.ProvinceCode), Clean(command.DistrictCode), Clean(command.LocationDetail), command.PriceVnd, windows);
        var note = Clean(command.Note);
        var fingerprint = Convert.ToHexString(SHA256.HashData(JsonSerializer.SerializeToUtf8Bytes(new
        {
            command.TutorProfileId,
            command.SubjectId,
            command.CourseId,
            command.ExpectedListedPriceVnd,
            terms,
            note
        }))).ToLowerInvariant();
        return await store.CreateAsync(new(actor, command.TutorProfileId, command.SubjectId, command.CourseId,
            ProvinceCode: terms.ProvinceCode, DistrictCode: terms.DistrictCode), key, fingerprint, (session, _) =>
        {
            // Validate the requested structure/capacity separately from a concurrently changed offer.
            var errors = terms.Validate(clock.UtcNow, windows, session.Offering.Modes, session.Offering.ValidLocation)
                .ToDictionary(x => x.Key, x => x.Value);
            if (!HireTerms.ValidNote(note)) errors["note"] = ["Maximum 2000 characters."];
            if (errors.Count != 0) throw new HireValidationException(errors);
            if (terms.Validate(clock.UtcNow, session.Offering.Availability, session.Offering.Modes, session.Offering.ValidLocation).Count != 0)
                throw new HireStoreException("availability_changed");
            if (command.ExpectedListedPriceVnd != session.Offering.ListedPriceVnd) throw new HireStoreException("listed_price_changed");
            var now = clock.UtcNow;
            var request = new HireRequest
            {
                Id = Guid.NewGuid(),
                RequesterUserId = actor,
                TutorProfileId = command.TutorProfileId,
                SubjectId = command.SubjectId,
                CourseId = command.CourseId,
                InitialTerms = terms,
                ListedPriceVnd = session.Offering.ListedPriceVnd,
                StartDate = terms.StartDate,
                SessionsPerWeek = terms.SessionsPerWeek,
                DurationMinutes = terms.DurationMinutes,
                TeachingModeCode = terms.TeachingMode,
                ProvinceCode = terms.ProvinceCode,
                DistrictCode = terms.DistrictCode,
                LocationDetail = terms.LocationDetail,
                ProposedPriceVnd = terms.PriceVnd,
                Note = note,
                StatusCode = terms.PriceVnd == session.Offering.ListedPriceVnd ? "PENDING" : "NEGOTIATING",
                CreatedAt = now,
                UpdatedAt = now
            };
            foreach (var window in windows) request.Schedules.Add(new RequestSchedule
            {
                Id = Guid.NewGuid(),
                HireRequestId = request.Id,
                DayOfWeek = window.DayOfWeek,
                StartTime = window.StartTime,
                EndTime = window.EndTime,
                CreatedAt = now
            });
            session.AddRequest(request);
            session.AddStatusEvent(new RequestStatusHistory
            {
                Id = Guid.NewGuid(),
                HireRequestId = request.Id,
                ActorUserId = actor,
                ToStatusCode = request.StatusCode,
                CreatedAt = now
            });
            var conversation = session.AddConversation(now);
            session.NotifyOtherParticipant("HIRE_REQUEST_CREATED", "Bạn có yêu cầu thuê gia sư mới.", now);
            var outcome = new HireCreationOutcome(request.Id, request.Version, request.StatusCode, conversation);
            session.AddCreateOperation(new HireCreateOperation
            {
                LearnerId = actor,
                IdempotencyKey = key,
                RequestId = request.Id,
                PayloadFingerprint = fingerprint,
                Outcome = outcome,
                CreatedAt = now
            });
            return Task.FromResult(outcome);
        }, ct);
    }
}
