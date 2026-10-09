using TutorMatching.Application.Authorization;
using TutorMatching.Domain.Users;

namespace TutorMatching.Application.UnitTests.Authorization;

public sealed class AccountPolicyTests
{
    [Fact]
    public void OnlyActiveMatchingCanonicalRolesAreAllowed()
    {
        foreach (var status in Enum.GetValues<AccountStatus>())
        foreach (var actual in Enum.GetValues<AccountRole>())
        foreach (var required in Enum.GetValues<AccountRole>())
            Assert.Equal(status == AccountStatus.ACTIVE && actual == required, AccountPolicy.Allows(status, actual, required));
        Assert.False(AccountPolicy.Allows(AccountStatus.ACTIVE, (AccountRole)99, (AccountRole)99));
    }
}
