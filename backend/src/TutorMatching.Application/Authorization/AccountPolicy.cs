using TutorMatching.Domain.Users;

namespace TutorMatching.Application.Authorization;

public static class AccountPolicy
{
    public static bool Allows(AccountStatus status, AccountRole actual, AccountRole required) =>
        status == AccountStatus.ACTIVE && Enum.IsDefined(actual) && Enum.IsDefined(required) && actual == required;
}
