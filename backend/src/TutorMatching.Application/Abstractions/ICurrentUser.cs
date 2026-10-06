using TutorMatching.Domain.Users;

namespace TutorMatching.Application.Abstractions;

public interface ICurrentUser
{
    bool IsAuthenticated { get; }
    Guid? UserId { get; }
    AccountRole? Role { get; }
}
