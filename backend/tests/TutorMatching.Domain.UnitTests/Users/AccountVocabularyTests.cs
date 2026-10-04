using TutorMatching.Domain.Users;

namespace TutorMatching.Domain.UnitTests.Users;

public sealed class AccountVocabularyTests
{
    [Fact]
    public void RolesUseCanonicalPersistedValues()
    {
        Assert.Equal(
            ["ADMIN", "LEARNER", "TUTOR"],
            Enum.GetNames<AccountRole>());
    }

    [Fact]
    public void StatusesUseCanonicalPersistedValues()
    {
        Assert.Equal(
            ["ACTIVE", "LOCKED", "INACTIVE"],
            Enum.GetNames<AccountStatus>());
    }
}
