namespace TutorMatching.Application.Tutors;

public sealed record SavedTutorDto(Guid TutorProfileId, DateTimeOffset SavedAt);

public enum SaveTutorOutcome { Saved, NotFound }

/// <summary>Learner bookmarks of public tutor profiles. Save and remove are idempotent.</summary>
public interface ISavedTutorService
{
    Task<IReadOnlyList<SavedTutorDto>> ListAsync(Guid userId, CancellationToken cancellationToken);
    /// <summary>Only currently public (approved, active) profiles can be saved.</summary>
    Task<SaveTutorOutcome> SaveAsync(Guid userId, Guid tutorProfileId, CancellationToken cancellationToken);
    Task RemoveAsync(Guid userId, Guid tutorProfileId, CancellationToken cancellationToken);
}
