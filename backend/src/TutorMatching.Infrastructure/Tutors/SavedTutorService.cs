using Microsoft.EntityFrameworkCore;
using TutorMatching.Application.Abstractions;
using TutorMatching.Application.Tutors;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Infrastructure.Tutors;

public sealed class SavedTutorService(ApplicationDbContext db, IClock clock) : ISavedTutorService
{
    public async Task<IReadOnlyList<SavedTutorDto>> ListAsync(Guid userId, CancellationToken cancellationToken)
    {
        // Saved tutors that are no longer public (locked, unapproved) are hidden, not deleted:
        // they reappear if the profile becomes public again.
        var publicIds = db.PublicTutorProfiles().Select(p => p.Id);
        return await db.SavedTutors.AsNoTracking()
            .Where(s => s.UserId == userId && publicIds.Contains(s.TutorProfileId))
            .OrderByDescending(s => s.CreatedAt).ThenBy(s => s.TutorProfileId)
            .Select(s => new SavedTutorDto(s.TutorProfileId, s.CreatedAt))
            .ToListAsync(cancellationToken);
    }

    public async Task<SaveTutorOutcome> SaveAsync(Guid userId, Guid tutorProfileId, CancellationToken cancellationToken)
    {
        if (!await db.PublicTutorProfiles().AnyAsync(p => p.Id == tutorProfileId, cancellationToken))
            return SaveTutorOutcome.NotFound;
        // Atomic and idempotent: a repeated or concurrent save keeps the first timestamp.
        await db.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO saved_tutors (user_id, tutor_profile_id, created_at)
            VALUES ({userId}, {tutorProfileId}, {clock.UtcNow})
            ON CONFLICT (user_id, tutor_profile_id) DO NOTHING
            """, cancellationToken);
        return SaveTutorOutcome.Saved;
    }

    public Task RemoveAsync(Guid userId, Guid tutorProfileId, CancellationToken cancellationToken) =>
        db.SavedTutors.Where(s => s.UserId == userId && s.TutorProfileId == tutorProfileId)
            .ExecuteDeleteAsync(cancellationToken);
}
