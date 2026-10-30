using System.Data;
using System.Globalization;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TutorMatching.Application.Abstractions;
using TutorMatching.Application.Hiring;
using TutorMatching.Domain.Hiring;
using TutorMatching.Domain.Tutors;
using TutorMatching.Domain.Users;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Infrastructure.Hiring;

public sealed class HireRequestQueries(ApplicationDbContext db, ICurrentUser user, IClock clock) : IHireRequestQueries
{
    private sealed record Cursor(int Format, string? Status, DateTimeOffset UpperTime, Guid UpperId, DateTimeOffset LastTime, Guid LastId);
    private static readonly string[] Statuses = ["PENDING", "NEGOTIATING", "ACCEPTED", "REJECTED", "CANCELLED", "COMPLETED"];

    private async Task<ApplicationUser> Actor(CancellationToken ct)
    {
        if (user.UserId is not { } id) throw new HireStoreException("unauthorized");
        var actor = await db.Users.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, ct);
        if (actor is null || actor.Status != AccountStatus.ACTIVE || actor.DeletedAt is not null) throw new HireStoreException("unauthorized");
        if (actor.Role is not (AccountRole.LEARNER or AccountRole.TUTOR)) throw new HireStoreException("forbidden");
        return actor;
    }

    private IQueryable<HireRequest> Scoped(ApplicationUser actor) => db.HireRequests.AsNoTracking().Where(r =>
        actor.Role == AccountRole.LEARNER ? r.RequesterUserId == actor.Id : r.TutorProfile!.UserId == actor.Id);

    private static HireValidationException Invalid(string field) => new(new Dictionary<string, string[]> { [field] = ["Giá trị không hợp lệ."] });

    public async Task<HirePage> ListAsync(string? status, string? cursor, int pageSize, CancellationToken ct)
    {
        await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.RepeatableRead, ct);
        var actor = await Actor(ct);
        if (pageSize is < 1 or > 100) throw Invalid("pageSize");
        if (status is not null && !Statuses.Contains(status)) throw Invalid("status");
        Cursor? position = null;
        if (cursor is not null)
        {
            try
            {
                if (cursor.Length > 2048) throw new FormatException();
                position = JsonSerializer.Deserialize<Cursor>(Convert.FromBase64String(cursor));
                if (position is null || position.Format != 1 || position.Status != status || position.UpperId == Guid.Empty ||
                    position.LastId == Guid.Empty || position.LastTime > position.UpperTime || position.LastTime == default ||
                    position.UpperTime.Offset != TimeSpan.Zero || position.LastTime.Offset != TimeSpan.Zero ||
                    (position.LastTime == position.UpperTime && position.LastId.CompareTo(position.UpperId) > 0)) throw new FormatException();
            }
            catch (Exception e) when (e is FormatException or JsonException) { throw Invalid("cursor"); }
        }
        var query = Scoped(actor);
        if (status is not null) query = query.Where(r => r.StatusCode == status);
        if (position is not null)
        {
            var p = position;
            query = query.Where(r => (r.CreatedAt < p.UpperTime || (r.CreatedAt == p.UpperTime && r.Id.CompareTo(p.UpperId) <= 0)) &&
                (r.CreatedAt < p.LastTime || (r.CreatedAt == p.LastTime && r.Id.CompareTo(p.LastId) < 0)));
        }
        var rows = await query.OrderByDescending(r => r.CreatedAt).ThenByDescending(r => r.Id).Take(pageSize + 1)
            .Select(r => new HireSummary
            {
                Id = r.Id, Version = r.Version, Status = r.StatusCode, CreatedAt = r.CreatedAt,
                Learner = new HireIdentity { Id = r.RequesterUserId, DisplayName = db.Users.Where(u => u.Id == r.RequesterUserId).Select(u => u.FullName).First() },
                Tutor = new HireIdentity { Id = r.TutorProfile!.UserId, DisplayName = db.Users.Where(u => u.Id == r.TutorProfile.UserId).Select(u => u.FullName).First() }
            }).ToListAsync(ct);
        string? next = null;
        if (rows.Count > pageSize)
        {
            rows.RemoveAt(pageSize);
            var last = rows[^1];
            next = Convert.ToBase64String(JsonSerializer.SerializeToUtf8Bytes(new Cursor(1, status,
                position?.UpperTime ?? rows[0].CreatedAt, position?.UpperId ?? rows[0].Id, last.CreatedAt, last.Id)));
        }
        await tx.CommitAsync(ct);
        return new HirePage { Items = rows.ToArray(), NextCursor = next };
    }

    public async Task<HireDetail> DetailAsync(Guid id, CancellationToken ct)
    {
        await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.RepeatableRead, ct);
        var actor = await Actor(ct);
        var request = await Scoped(actor).SingleOrDefaultAsync(r => r.Id == id, ct) ?? throw new HireStoreException("not_found");
        var profile = await db.TutorProfiles.AsNoTracking().SingleAsync(p => p.Id == request.TutorProfileId, ct);
        var identities = await db.Users.AsNoTracking().Where(u => u.Id == request.RequesterUserId || u.Id == profile.UserId)
            .Select(u => new HireIdentity { Id = u.Id, DisplayName = u.FullName }).ToListAsync(ct);
        var proposals = await db.Negotiations.AsNoTracking().Where(p => p.HireRequestId == id).OrderBy(p => p.Sequence).ToListAsync(ct);
        var history = await db.RequestStatusHistories.AsNoTracking().Where(e => e.HireRequestId == id).OrderBy(e => e.Sequence)
            .Select(e => new HireEvent { Sequence = e.Sequence, ActorId = e.ActorUserId, FromStatus = e.FromStatusCode,
                ToStatus = e.ToStatusCode, Reason = e.Reason, CreatedAt = e.CreatedAt }).ToArrayAsync(ct);
        var conversation = await db.Conversations.Where(c => c.HireRequestId == id).Select(c => c.Id).SingleAsync(ct);
        var actions = new List<string>();
        request.Negotiations = proposals;
        if (request.CanRespond(actor.Id, profile.UserId)) actions.Add("reject");
        if (request.CanPropose(actor.Id, profile.UserId))
        {
            if (await CanAccept(request, profile, ct, proposing: true)) actions.Add("propose");
            if (await CanAccept(request, profile, ct))
            {
                if (request.CanAcceptInitial(actor.Id, profile.UserId) ||
                    request.CanAcceptProposal(actor.Id, profile.UserId, request.LatestProposalSequence)) actions.Add("accept");
            }
        }
        if (request.CanCancel(actor.Id, profile.UserId)) actions.Add("cancel");
        if (request.CanComplete(actor.Id, profile.UserId)) actions.Add("complete");
        var agreement = request.FinalAgreement;
        var result = new HireDetail
        {
            Id = id, Version = request.Version, Status = request.StatusCode, CreatedAt = request.CreatedAt,
            Learner = identities.Single(i => i.Id == request.RequesterUserId), Tutor = identities.Single(i => i.Id == profile.UserId),
            InitialTerms = Terms(request.InitialTerms), CurrentTerms = Terms(proposals.LastOrDefault()?.Terms ?? request.InitialTerms),
            FinalAgreement = agreement is null ? null : new HireAgreement { Terms = Terms(agreement.Terms), AcceptedBy = agreement.AcceptedBy,
                AcceptedAt = agreement.AcceptedAt, ProposalSequence = agreement.ProposalSequence, ProvinceName = agreement.ProvinceName, DistrictName = agreement.DistrictName },
            Proposals = proposals.Select(p => new HireProposal { Sequence = p.Sequence, SenderId = p.SenderUserId,
                Terms = Terms(p.Terms), Note = p.Note, CreatedAt = p.CreatedAt }).ToArray(),
            History = history, ConversationId = conversation, AllowedActions = actions.ToArray()
        };
        await tx.CommitAsync(ct);
        return result;
    }

    private async Task<bool> CanAccept(HireRequest request, TutorProfile profile, CancellationToken ct, bool proposing = false)
    {
        if (!await db.Users.AnyAsync(u => u.Id == profile.UserId && u.Role == AccountRole.TUTOR && u.Status == AccountStatus.ACTIVE && u.DeletedAt == null, ct)) return false;
        if (profile.Status != TutorProfileStatus.APPROVED || profile.SessionRateVnd is null or <= 0 ||
            !await db.Subjects.AnyAsync(s => s.Id == request.SubjectId && s.IsActive, ct) ||
            !await db.TutorSubjects.AnyAsync(s => s.TutorProfileId == profile.Id && s.SubjectId == request.SubjectId, ct)) return false;
        if (request.CourseId is { } course && !await db.Courses.AnyAsync(c => c.Id == course && c.TutorProfileId == profile.Id &&
            c.SubjectId == request.SubjectId && c.StatusCode == "ACTIVE" && c.DeletedAt == null && c.PricePerSessionVnd > 0 && c.SessionCount > 0 && c.Name != "", ct)) return false;
        var terms = request.CurrentTerms;
        var location = terms.ProvinceCode is null && terms.DistrictCode is null ||
            await db.Districts.AnyAsync(d => d.DistrictCode == terms.DistrictCode && d.ProvinceCode == terms.ProvinceCode && d.IsActive &&
                db.Provinces.Any(p => p.ProvinceCode == d.ProvinceCode && p.IsActive), ct);
        var slots = await db.AvailabilitySlots.AsNoTracking().Where(s => s.TutorProfileId == profile.Id && s.IsActive &&
            s.AvailabilityType == "WEEKLY" && s.DayOfWeek != null).Select(s => new WeeklyWindow(s.DayOfWeek!.Value, s.StartTime, s.EndTime)).ToListAsync(ct);
        return terms.Validate(clock.UtcNow, proposing ? terms.Schedules : slots, profile.TeachingModes, location).Count == 0;
    }

    private static HireTermsDto Terms(HireTerms terms) => new()
    {
        StartDate = terms.StartDate, SessionsPerWeek = terms.SessionsPerWeek, DurationMinutes = terms.DurationMinutes,
        TeachingMode = terms.TeachingMode, ProvinceCode = terms.ProvinceCode, DistrictCode = terms.DistrictCode,
        LocationDetail = terms.LocationDetail, PriceVnd = terms.PriceVnd,
        Schedules = terms.Schedules.Select(s => new HireSchedule { DayOfWeek = s.DayOfWeek,
            StartTime = s.StartTime.ToString("HH:mm", CultureInfo.InvariantCulture), EndTime = s.EndTime.ToString("HH:mm", CultureInfo.InvariantCulture) }).ToArray()
    };
}
