using TutorMatching.Application.Abstractions;

namespace TutorMatching.Infrastructure.Time;

public sealed class SystemClock(TimeProvider timeProvider) : IClock
{
    public DateTimeOffset UtcNow => timeProvider.GetUtcNow();
}