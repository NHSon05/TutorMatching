using Microsoft.EntityFrameworkCore;
using TutorMatching.Application.Abstractions;
using TutorMatching.Application.Tutors;
using TutorMatching.Domain.Notifications;
using TutorMatching.Domain.Catalog;
using TutorMatching.Domain.Tutors;
using TutorMatching.Domain.Users;
using TutorMatching.Infrastructure.Auditing;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Infrastructure.Tutors;

public sealed class TutorReviewService(ApplicationDbContext db, ITutorOnboardingService onboarding, IClock clock) : ITutorReviewService
{
    public async Task<ReviewQueuePage> QueueAsync(int page, int pageSize, CancellationToken ct)
    {
        var query = from p in db.TutorProfiles.AsNoTracking()
                    join u in db.Users.AsNoTracking() on p.UserId equals u.Id
                    where p.Status == TutorProfileStatus.PENDING_REVIEW && u.Role == AccountRole.TUTOR && u.Status == AccountStatus.ACTIVE
                    select new { p, u };
        var total = await query.CountAsync(ct);
        var items = await query.OrderBy(x => x.p.SubmittedAt).ThenBy(x => x.p.Id)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(x => new ReviewQueueItem(x.p.Id, x.u.FullName, x.u.Status.ToString(), x.p.SubmittedAt, x.p.Version)).ToListAsync(ct);
        return new(items, total, page, pageSize);
    }

    public async Task<TutorReviewDetail?> DetailAsync(Guid profileId, CancellationToken ct)
    {
        // A consistent snapshot pairs the displayed content with the version sent back by the reviewer.
        var strategy = db.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var tx = await db.Database.BeginTransactionAsync(System.Data.IsolationLevel.RepeatableRead, ct);
            var row = await (from p in db.TutorProfiles.AsNoTracking()
                             join u in db.Users.AsNoTracking() on p.UserId equals u.Id
                             where p.Id == profileId
                             select new { p.UserId, u.Status }).SingleOrDefaultAsync(ct);
            if (row is null) return null;
            var profile = await onboarding.GetOnboardingAsync(row.UserId, ct);
            var history = await ReadHistory(profileId).ToListAsync(ct);
            var subjects = await (from link in db.TutorSubjects.AsNoTracking()
                                  join subject in db.Subjects.AsNoTracking() on link.SubjectId equals subject.Id
                                  where link.TutorProfileId == profileId
                                  orderby subject.Name, subject.Id
                                  select new { subject.Id, subject.Name }).ToListAsync(ct);
            var levels = await (from link in db.Set<TutorSubjectLevel>().AsNoTracking()
                                join level in db.Set<TeachingLevel>().AsNoTracking() on link.LevelCode equals level.Code
                                where link.TutorProfileId == profileId
                                orderby level.Code
                                select new { link.SubjectId, level.Name }).ToListAsync(ct);
            var provinceCode = profile?.Discovery?.ProvinceCode;
            var districtCode = profile?.Discovery?.DistrictCode;
            var province = await db.Provinces.Where(x => x.ProvinceCode == provinceCode).Select(x => x.ProvinceName).FirstOrDefaultAsync(ct);
            var district = await db.Districts.Where(x => x.DistrictCode == districtCode).Select(x => x.DistrictName).FirstOrDefaultAsync(ct);
            await tx.CommitAsync(ct);
            return new TutorReviewDetail(profileId, row.Status.ToString(), profile!, history,
                subjects.Select(s => new ReviewSubject(s.Id, s.Name, levels.Where(l => l.SubjectId == s.Id).Select(l => l.Name).ToList())).ToList(), province, district);
        });
    }

    public async Task<IReadOnlyList<ReviewHistory>> HistoryAsync(Guid ownerId, CancellationToken ct) =>
        await (from r in db.TutorProfileReviews.AsNoTracking()
               join p in db.TutorProfiles.AsNoTracking() on r.TutorProfileId equals p.Id
               where p.UserId == ownerId
               orderby r.ReviewedAt descending, r.Id descending
               select new ReviewHistory(r.Id, r.ReviewerUserId, r.Action, r.ReviewedVersion,
                   r.FromStatusCode, r.ToStatusCode, r.Note, r.ReviewedAt)).ToListAsync(ct);

    private IQueryable<ReviewHistory> ReadHistory(Guid profileId) => db.TutorProfileReviews.AsNoTracking()
        .Where(r => r.TutorProfileId == profileId).OrderByDescending(r => r.ReviewedAt).ThenByDescending(r => r.Id)
        .Select(r => new ReviewHistory(r.Id, r.ReviewerUserId, r.Action, r.ReviewedVersion, r.FromStatusCode, r.ToStatusCode, r.Note, r.ReviewedAt));

    public Task<ReviewDecisionResult> DecideAsync(Guid profileId, Guid actorId, Guid expectedVersion, string action, string? note, CancellationToken ct)
    {
        if (action is not ("APPROVE" or "REQUEST_CHANGES" or "REJECT") || note?.Length > 4000 ||
            (action != "APPROVE" && string.IsNullOrWhiteSpace(note)))
            return Task.FromResult(new ReviewDecisionResult(null, null, ReviewFailure.Invalid));
        return db.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
        {
            await using var tx = await db.Database.BeginTransactionAsync(ct);
            var profile = await db.TutorProfiles.FromSqlInterpolated($"SELECT * FROM tutor_profiles WHERE id={profileId} FOR UPDATE").SingleOrDefaultAsync(ct);
            if (profile is null) return new ReviewDecisionResult(null, null, ReviewFailure.NotFound);
            if (profile.Status != TutorProfileStatus.PENDING_REVIEW || expectedVersion != profile.Version)
                return new ReviewDecisionResult(null, null, ReviewFailure.Conflict);
            // Lock the account too: a concurrent account lock cannot race an approval decision.
            await db.Database.ExecuteSqlInterpolatedAsync($"SELECT id FROM user_accounts WHERE id={profile.UserId} FOR UPDATE", ct);
            var user = await db.Users.SingleAsync(u => u.Id == profile.UserId, ct);
            if (user.Role != AccountRole.TUTOR || user.Status != AccountStatus.ACTIVE)
                return new ReviewDecisionResult(null, null, ReviewFailure.Conflict);
            var now = clock.UtcNow;
            var target = action switch { "APPROVE" => TutorProfileStatus.APPROVED, "REQUEST_CHANGES" => TutorProfileStatus.DRAFT, _ => TutorProfileStatus.REJECTED };
            note = string.IsNullOrWhiteSpace(note) ? null : note.Trim();
            db.TutorProfileReviews.Add(new TutorProfileReview
            {
                Id = Guid.NewGuid(),
                TutorProfileId = profileId,
                ReviewerUserId = actorId,
                Action = action,
                ReviewedVersion = profile.Version,
                FromStatusCode = profile.Status.ToString(),
                ToStatusCode = target.ToString(),
                Note = note,
                ReviewedAt = now
            });
            profile.Status = target;
            profile.ApprovedAt = action == "APPROVE" ? now : null;
            profile.UpdatedAt = now;
            db.AuditEvents.Add(new AuditEvent
            {
                Id = Guid.NewGuid(),
                ActorUserId = actorId,
                Action = action switch { "APPROVE" => "TutorApproved", "REQUEST_CHANGES" => "TutorChangesRequested", _ => "TutorRejected" },
                EntityType = "TutorProfile",
                EntityId = profileId.ToString(),
                CreatedAt = now
            });
            db.Notifications.Add(new Notification
            {
                Id = Guid.NewGuid(),
                UserId = profile.UserId,
                TypeCode = "TUTOR_PROFILE_REVIEWED",
                Title = action switch { "APPROVE" => "Hồ sơ đã được duyệt", "REQUEST_CHANGES" => "Hồ sơ cần chỉnh sửa", _ => "Hồ sơ bị từ chối" },
                Body = note is { Length: > 2000 } ? note[..2000] : note,
                TutorProfileId = profileId,
                CreatedAt = now
            });
            await db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
            return new ReviewDecisionResult(target.ToString(), profile.Version);
        });
    }
}
