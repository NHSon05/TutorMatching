using TutorMatching.Domain.Tutors;
using TutorMatching.Infrastructure.Persistence;
namespace TutorMatching.Api.IntegrationTests.Fixtures;
internal static class TutorDiscoverySeed
{
    internal static readonly Guid MathId = Guid.Parse("02000000-0000-0000-0000-000000000001");
    internal static TutorProfile Legacy(Guid userId, bool mapped) => new()
    {
        Id = Guid.NewGuid(), UserId = userId, Status = TutorProfileStatus.APPROVED,
        Subjects = mapped ? ["Toán học"] : ["Unknown legacy subject"], TeachingLevels = ["THPT"],
        SessionRateVnd = 150000, CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
    };
}
