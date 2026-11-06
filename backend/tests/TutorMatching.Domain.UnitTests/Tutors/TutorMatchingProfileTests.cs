using TutorMatching.Domain.Tutors;

namespace TutorMatching.Domain.UnitTests.Tutors;

public sealed class TutorMatchingProfileTests
{
    [Fact]
    public void Create_WithValidCriteria_InitializesProfile()
    {
        var tutorProfileId = Guid.NewGuid();
        var mathId = Guid.NewGuid();
        var now = new DateTimeOffset(2026, 11, 6, 4, 0, 0, TimeSpan.Zero);

        var profile = TutorMatchingProfile.Create(
            tutorProfileId: tutorProfileId,
            preferredSubjects: [mathId],
            preferredGrades: [9, 10, 11, 12],
            minTuitionFeeVnd: 200_000,
            maxTuitionFeeVnd: 500_000,
            preferredProvinceCode: "01",
            preferredDistrictCodes: ["005", "006"],
            receiveAllDistricts: false,
            teachingModes: ["OFFLINE", "ONLINE"],
            isActive: true,
            now: now);

        Assert.NotEqual(Guid.Empty, profile.Id);
        Assert.Equal(tutorProfileId, profile.TutorProfileId);
        Assert.Single(profile.PreferredSubjects, mathId);
        Assert.Equal([9, 10, 11, 12], profile.PreferredGrades);
        Assert.Equal(200_000, profile.MinTuitionFeeVnd);
        Assert.Equal(500_000, profile.MaxTuitionFeeVnd);
        Assert.Equal("01", profile.PreferredProvinceCode);
        Assert.Equal(["005", "006"], profile.PreferredDistrictCodes);
        Assert.False(profile.ReceiveAllDistricts);
        Assert.Equal(["OFFLINE", "ONLINE"], profile.TeachingModes);
        Assert.True(profile.IsActive);
        Assert.Equal(now, profile.CreatedAt);
        Assert.Equal(now, profile.UpdatedAt);
    }

    [Fact]
    public void Create_WhenMinTuitionFeeNegative_ThrowsArgumentOutOfRangeException()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            TutorMatchingProfile.Create(
                tutorProfileId: Guid.NewGuid(),
                preferredSubjects: [Guid.NewGuid()],
                preferredGrades: [9],
                minTuitionFeeVnd: -10_000,
                maxTuitionFeeVnd: 200_000,
                preferredProvinceCode: "01",
                preferredDistrictCodes: ["005"],
                receiveAllDistricts: false,
                teachingModes: ["OFFLINE"],
                isActive: true));
    }

    [Fact]
    public void Create_WhenMaxTuitionFeeLessThanMin_ThrowsArgumentOutOfRangeException()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            TutorMatchingProfile.Create(
                tutorProfileId: Guid.NewGuid(),
                preferredSubjects: [Guid.NewGuid()],
                preferredGrades: [9],
                minTuitionFeeVnd: 300_000,
                maxTuitionFeeVnd: 250_000,
                preferredProvinceCode: "01",
                preferredDistrictCodes: ["005"],
                receiveAllDistricts: false,
                teachingModes: ["OFFLINE"],
                isActive: true));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(13)]
    [InlineData(-5)]
    public void Create_WhenPreferredGradesOutside1To12_ThrowsArgumentOutOfRangeException(int invalidGrade)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            TutorMatchingProfile.Create(
                tutorProfileId: Guid.NewGuid(),
                preferredSubjects: [Guid.NewGuid()],
                preferredGrades: [9, invalidGrade],
                minTuitionFeeVnd: 200_000,
                maxTuitionFeeVnd: null,
                preferredProvinceCode: "01",
                preferredDistrictCodes: ["005"],
                receiveAllDistricts: false,
                teachingModes: ["OFFLINE"],
                isActive: true));
    }

    [Fact]
    public void Create_WhenTeachingModeInvalid_ThrowsArgumentException()
    {
        Assert.Throws<ArgumentException>(() =>
            TutorMatchingProfile.Create(
                tutorProfileId: Guid.NewGuid(),
                preferredSubjects: [Guid.NewGuid()],
                preferredGrades: [9],
                minTuitionFeeVnd: 200_000,
                maxTuitionFeeVnd: null,
                preferredProvinceCode: "01",
                preferredDistrictCodes: ["005"],
                receiveAllDistricts: false,
                teachingModes: ["INVALID_MODE"],
                isActive: true));
    }
}
