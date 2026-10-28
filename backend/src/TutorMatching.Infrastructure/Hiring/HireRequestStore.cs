using System.Collections.Immutable;
using Microsoft.EntityFrameworkCore;
using TutorMatching.Application.Hiring;
using TutorMatching.Domain.Hiring;
using TutorMatching.Domain.Messaging;
using TutorMatching.Domain.Notifications;
using TutorMatching.Domain.Tutors;
using TutorMatching.Domain.Users;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Infrastructure.Hiring;

public sealed class HireRequestStore(ApplicationDbContext db) : IHireRequestStore
{
    public async Task ExecuteAsync(HireWriteTarget target, Func<IHireWriteSession, CancellationToken, Task> action,
        CancellationToken cancellationToken = default)
    {
        // A clean scoped context avoids overwriting caller changes or trusting stale tracked entities.
        if (db.ChangeTracker.Entries().Any()) throw new InvalidOperationException("Hiring writes require a clean scoped context.");
        await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var profileId = target.TutorProfileId;
            HireRequest? hint = null;
            if (target.RequestId is { } id)
            {
                hint = await db.HireRequests.AsNoTracking().SingleOrDefaultAsync(r => r.Id == id, cancellationToken)
                    ?? throw new HireStoreException("not_found");
                profileId = hint.TutorProfileId;
            }
            var profile = await db.TutorProfiles.FromSqlInterpolated($"SELECT * FROM tutor_profiles WHERE id={profileId} FOR UPDATE")
                .AsNoTracking().SingleOrDefaultAsync(cancellationToken) ?? throw new HireStoreException("not_found");
            // Shared account locks protect status/role while allowing two unrelated requests by the same actor.
            var userIds = new[] { target.ActorId, profile.UserId }.Distinct().Order().ToArray();

            var accounts = await db.Users.FromSqlInterpolated($"SELECT * FROM user_accounts WHERE id=ANY({userIds}) ORDER BY id FOR SHARE")
                .AsNoTracking().ToListAsync(cancellationToken);

            var actor = accounts.SingleOrDefault(a => a.Id == target.ActorId);

            var tutor = accounts.SingleOrDefault(a => a.Id == profile.UserId);
            if (actor is null || actor.Status != AccountStatus.ACTIVE || actor.DeletedAt is not null)
                throw new HireStoreException("unauthorized");

            if (hint is null)
            {
                if (actor.Role != AccountRole.LEARNER || actor.Id == profile.UserId) throw new HireStoreException("forbidden");
            }
            else if (!((actor.Id == hint.RequesterUserId && actor.Role == AccountRole.LEARNER) ||
                       (actor.Id == profile.UserId && actor.Role == AccountRole.TUTOR)))
                throw new HireStoreException("not_found");

            var subjectId = hint?.SubjectId ?? target.SubjectId;
            var courseId = hint is null ? target.CourseId : hint.CourseId;
            var subject = await db.Subjects.FromSqlInterpolated($"SELECT * FROM subjects WHERE id={subjectId} FOR SHARE")
                .AsNoTracking().SingleOrDefaultAsync(cancellationToken);
            var course = courseId is null ? null : await db.Courses.FromSqlInterpolated($"SELECT * FROM courses WHERE id={courseId} FOR SHARE")
                .AsNoTracking().SingleOrDefaultAsync(cancellationToken);
            var provinceCode = hint is null ? target.ProvinceCode : hint.InitialTerms.ProvinceCode;
            var districtCode = hint is null ? target.DistrictCode : hint.InitialTerms.DistrictCode;
            var province = provinceCode is null ? null : await db.Provinces.FromSqlInterpolated($"SELECT * FROM provinces WHERE province_code={provinceCode} FOR SHARE")
                .AsNoTracking().SingleOrDefaultAsync(cancellationToken);
            var district = districtCode is null ? null : await db.Districts.FromSqlInterpolated($"SELECT * FROM districts WHERE district_code={districtCode} FOR SHARE")
                .AsNoTracking().SingleOrDefaultAsync(cancellationToken);
            var price = courseId is null ? profile.SessionRateVnd : course?.PricePerSessionVnd;
            if (target.RequireOffering && (profile.Status != TutorProfileStatus.APPROVED || tutor is null ||
                tutor.Role != AccountRole.TUTOR || tutor.Status != AccountStatus.ACTIVE || tutor.DeletedAt is not null ||
                subject?.IsActive != true || price is null or <= 0 ||
                !await db.TutorSubjects.AnyAsync(s => s.TutorProfileId == profile.Id && s.SubjectId == subjectId, cancellationToken) ||
                (courseId is not null && (course is null || course.TutorProfileId != profile.Id || course.SubjectId != subjectId ||
                    course.StatusCode != "ACTIVE" || course.DeletedAt is not null))))
                throw new HireStoreException("offering_changed");
            var windows = await db.AvailabilitySlots.AsNoTracking().Where(s => s.TutorProfileId == profile.Id && s.IsActive &&
                s.AvailabilityType == "WEEKLY" && s.DayOfWeek != null)
                .Select(s => new WeeklyWindow(s.DayOfWeek!.Value, s.StartTime, s.EndTime)).ToListAsync(cancellationToken);
            HireRequest? request = null;
            if (hint is not null)
            {
                request = await db.HireRequests.FromSqlInterpolated($"SELECT * FROM hire_requests WHERE id={hint.Id} FOR UPDATE")
                    .SingleAsync(cancellationToken);
                if (request.TutorProfileId != profile.Id || request.RequesterUserId != hint.RequesterUserId ||
                    request.SubjectId != subjectId || request.CourseId != courseId)
                    throw new HireStoreException("version_conflict");
                if (target.ExpectedVersion is null || target.ExpectedVersion == Guid.Empty || request.Version != target.ExpectedVersion)
                    throw new HireStoreException("version_conflict");
            }
            var offering = new HireOffering(profile.UserId, price, profile.TeachingModes.ToImmutableArray(), windows.ToImmutableArray(),
                (provinceCode is null && districtCode is null) || (province?.IsActive == true && district?.IsActive == true && district.ProvinceCode == provinceCode),
                province?.ProvinceName, district?.DistrictName);
            var session = new WriteSession(db, target with { TutorProfileId = profileId, SubjectId = subjectId, CourseId = courseId }, request, offering);
            await action(session, cancellationToken);
            await db.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            await tx.RollbackAsync(CancellationToken.None);
            db.ChangeTracker.Clear();
            throw new HireStoreException("version_conflict");
        }
        catch
        {
            await tx.RollbackAsync(CancellationToken.None);
            db.ChangeTracker.Clear();
            throw;
        }
    }

    private sealed class WriteSession(ApplicationDbContext db, HireWriteTarget target, HireRequest? request, HireOffering offering) : IHireWriteSession
    {
        public HireRequest? Request { get; private set; } = request;
        public HireOffering Offering { get; } = offering;
        private HireRequest RequiredRequest => Request ?? throw new InvalidOperationException("Create a request first.");
        public Task<HireCreateOperation?> FindCreateOperationAsync(Guid key, CancellationToken ct) =>
            db.HireCreateOperations.AsNoTracking().SingleOrDefaultAsync(x => x.LearnerId == target.ActorId && x.IdempotencyKey == key, ct);
        public void AddRequest(HireRequest value)
        {
            if (Request is not null || value.RequesterUserId != target.ActorId || value.TutorProfileId != target.TutorProfileId ||
                value.SubjectId != target.SubjectId || value.CourseId != target.CourseId || value.IsLegacy)
                throw new InvalidOperationException("Request does not match locked participants/offering.");
            value.CreatedAt = value.CreatedAt.ToUniversalTime();
            value.UpdatedAt = value.UpdatedAt.ToUniversalTime();
            Request = value;
            db.HireRequests.Add(value);
        }
        public void AddProposal(Negotiation value)
        {
            if (value.HireRequestId != RequiredRequest.Id || value.SenderUserId != target.ActorId || value.IsLegacy)
                throw new InvalidOperationException("Proposal does not match the request actor.");
            value.CreatedAt = value.CreatedAt.ToUniversalTime();
            value.Sequence = ++RequiredRequest.LatestProposalSequence;
            db.Negotiations.Add(value);
        }
        public void AddStatusEvent(RequestStatusHistory value)
        {
            if (value.HireRequestId != RequiredRequest.Id || value.ActorUserId != target.ActorId || value.IsLegacy)
                throw new InvalidOperationException("Event does not match the request actor.");
            value.CreatedAt = value.CreatedAt.ToUniversalTime();
            value.Sequence = RequiredRequest.NextEventSequence++;
            db.RequestStatusHistories.Add(value);
        }
        public Guid AddConversation(DateTimeOffset now)
        {
            var conversation = new Conversation { Id = Guid.NewGuid(), HireRequestId = RequiredRequest.Id, CreatedAt = now.ToUniversalTime() };
            db.Conversations.Add(conversation);
            return conversation.Id;
        }
        public void NotifyOtherParticipant(string type, string title, DateTimeOffset now) => db.Notifications.Add(new Notification
        {
            Id = Guid.NewGuid(),
            HireRequestId = RequiredRequest.Id,
            UserId = target.ActorId == RequiredRequest.RequesterUserId ? Offering.TutorUserId : RequiredRequest.RequesterUserId,
            TypeCode = type,
            Title = title,
            CreatedAt = now.ToUniversalTime()
        });
        public void AddCreateOperation(HireCreateOperation operation)
        {
            if (operation.LearnerId != target.ActorId || operation.RequestId != RequiredRequest.Id || operation.IdempotencyKey == Guid.Empty)
                throw new InvalidOperationException("Creation identity does not match the request.");
            operation.CreatedAt = operation.CreatedAt.ToUniversalTime();
            db.HireCreateOperations.Add(operation);
        }
    }
}
