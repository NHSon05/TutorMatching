namespace TutorMatching.Application.Abstractions;

public interface IClock
{
    DateTimeOffset UtcNow { get; }
}
