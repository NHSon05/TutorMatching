using TutorMatching.Application.Abstractions;
using TutorMatching.Application.Tutors;
using TutorMatching.Domain.Tutors;
using TutorMatching.Domain.Users;

namespace TutorMatching.Application.UnitTests.Matching;

public sealed class MatchingEngineTests
{
    private static readonly Guid MathSubjectId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid EnglishSubjectId = Guid.Parse("22222222-2222-2222-2222-222222222222");

    private readonly MatchingEngine engine = new();

    [Fact]
    public void MatchPublicTutors_FiltersOutNonApprovedOrInactiveTutors_AndRanksByScore()
    {
        var criteria = new ExtractedDemandCriteriaDto(
            SubjectId: MathSubjectId,
            SubjectNameRaw: "Toán",
            GradeLevel: 9,
            TuitionFeeVnd: 250_000,
            FeePeriod: "PER_SESSION",
            IsFeeNegotiable: false,
            SessionsPerWeek: 2,
            TeachingMode: "OFFLINE",
            ProvinceCode: "HN",
            ProvinceName: "Hà Nội",
            DistrictCode: "HN_CG",
            DistrictName: "Quận Cầu Giấy",
            RawAddress: "Cầu Giấy",
            IsLocationAmbiguous: false,
            ScheduleNotes: null,
            ConfidenceScore: 0.95m,
            ExtractedJson: "{}",
            UsedFallback: false,
            IsRejected: false);

        var approvedExactMatch = new PublicTutorCandidate(
            TutorProfileId: Guid.NewGuid(),
            DisplayName: "Nguyễn Minh Tuấn",
            AvatarUrl: null,
            Headline: "Giáo viên Toán THCS",
            ProfileStatus: TutorProfileStatus.APPROVED,
            AccountStatus: AccountStatus.ACTIVE,
            SubjectIds: [MathSubjectId],
            SubjectNames: ["Toán"],
            TeachingLevels: ["SECONDARY"],
            ListedPriceVnd: 250_000,
            IsNegotiable: true,
            TeachingModes: ["OFFLINE", "ONLINE"],
            ProvinceCode: "HN",
            ProvinceName: "Hà Nội",
            DistrictCode: "HN_CG",
            DistrictName: "Quận Cầu Giấy");

        var approvedSameProvinceDifferentDistrict = new PublicTutorCandidate(
            TutorProfileId: Guid.NewGuid(),
            DisplayName: "Trần Thu Hà",
            AvatarUrl: null,
            Headline: "Gia sư Toán ĐH Sư Phạm",
            ProfileStatus: TutorProfileStatus.APPROVED,
            AccountStatus: AccountStatus.ACTIVE,
            SubjectIds: [MathSubjectId],
            SubjectNames: ["Toán"],
            TeachingLevels: ["SECONDARY"],
            ListedPriceVnd: 240_000,
            IsNegotiable: true,
            TeachingModes: ["OFFLINE"],
            ProvinceCode: "HN",
            ProvinceName: "Hà Nội",
            DistrictCode: "HN_DD",
            DistrictName: "Quận Đống Đa");

        var pendingTutor = approvedExactMatch with
        {
            TutorProfileId = Guid.NewGuid(),
            DisplayName = "Gia sư Chờ Duyệt",
            ProfileStatus = TutorProfileStatus.PENDING_REVIEW,
        };

        var lockedTutor = approvedExactMatch with
        {
            TutorProfileId = Guid.NewGuid(),
            DisplayName = "Gia sư Bị Khóa",
            AccountStatus = AccountStatus.LOCKED,
        };

        var wrongSubjectTutor = approvedExactMatch with
        {
            TutorProfileId = Guid.NewGuid(),
            DisplayName = "Gia sư Tiếng Anh",
            SubjectIds = [EnglishSubjectId],
            SubjectNames = ["Tiếng Anh"],
        };

        var wrongProvinceTutor = approvedExactMatch with
        {
            TutorProfileId = Guid.NewGuid(),
            DisplayName = "Gia sư Đà Nẵng",
            ProvinceCode = "DN",
            ProvinceName = "Đà Nẵng",
            DistrictCode = "DN_HC",
            DistrictName = "Quận Hải Châu",
        };

        var overBudgetTutor = approvedExactMatch with
        {
            TutorProfileId = Guid.NewGuid(),
            DisplayName = "Gia sư Giá Cao",
            ListedPriceVnd = 300_000,
            IsNegotiable = true,
        };

        var wrongTeachingModeTutor = approvedExactMatch with
        {
            TutorProfileId = Guid.NewGuid(),
            DisplayName = "Gia sư Chỉ Dạy Online",
            TeachingModes = ["ONLINE"],
        };

        var matches = engine.MatchPublicTutors(
            criteria,
            [
                approvedExactMatch,
                approvedSameProvinceDifferentDistrict,
                pendingTutor,
                lockedTutor,
                wrongSubjectTutor,
                wrongProvinceTutor,
                overBudgetTutor,
                wrongTeachingModeTutor,
            ]);

        Assert.Equal(2, matches.Count);
        Assert.Equal(approvedExactMatch.TutorProfileId, matches[0].TutorProfileId);
        Assert.Equal(approvedSameProvinceDifferentDistrict.TutorProfileId, matches[1].TutorProfileId);
        Assert.True(matches[0].MatchScore > matches[1].MatchScore);
        Assert.DoesNotContain(matches, m => m.TutorProfileId == pendingTutor.TutorProfileId);
        Assert.DoesNotContain(matches, m => m.TutorProfileId == lockedTutor.TutorProfileId);
        Assert.DoesNotContain(matches, m => m.TutorProfileId == wrongSubjectTutor.TutorProfileId);
        Assert.DoesNotContain(matches, m => m.TutorProfileId == wrongProvinceTutor.TutorProfileId);
        Assert.DoesNotContain(matches, m => m.TutorProfileId == overBudgetTutor.TutorProfileId);
        Assert.DoesNotContain(matches, m => m.TutorProfileId == wrongTeachingModeTutor.TutorProfileId);
    }

    [Fact]
    public void MatchTutorSubscriptionProfiles_HandlesAmbiguousLocationViaReceiveAllDistrictsOrOnline()
    {
        var ambiguousCriteria = new ExtractedDemandCriteriaDto(
            SubjectId: MathSubjectId,
            SubjectNameRaw: "Toán",
            GradeLevel: 10,
            TuitionFeeVnd: 250_000,
            FeePeriod: "PER_SESSION",
            IsFeeNegotiable: false,
            SessionsPerWeek: 2,
            TeachingMode: "OFFLINE",
            ProvinceCode: "HN",
            ProvinceName: "Hà Nội",
            DistrictCode: null,
            DistrictName: null,
            RawAddress: "Hà Nội",
            IsLocationAmbiguous: true,
            ScheduleNotes: null,
            ConfidenceScore: 0.80m,
            ExtractedJson: "{}",
            UsedFallback: false,
            IsRejected: false);

        var tutorAcceptingAllDistricts = TutorMatchingProfile.Create(
            tutorProfileId: Guid.NewGuid(),
            preferredSubjects: [MathSubjectId],
            preferredGrades: [9, 10, 11],
            minTuitionFeeVnd: 200_000,
            maxTuitionFeeVnd: 400_000,
            preferredProvinceCode: "HN",
            preferredDistrictCodes: ["HN_CG"],
            receiveAllDistricts: true,
            teachingModes: ["OFFLINE"],
            isActive: true);

        var tutorStrictSingleDistrict = TutorMatchingProfile.Create(
            tutorProfileId: Guid.NewGuid(),
            preferredSubjects: [MathSubjectId],
            preferredGrades: [9, 10, 11],
            minTuitionFeeVnd: 200_000,
            maxTuitionFeeVnd: 400_000,
            preferredProvinceCode: "HN",
            preferredDistrictCodes: ["HN_CG"],
            receiveAllDistricts: false,
            teachingModes: ["OFFLINE"],
            isActive: true);

        var inactiveTutor = TutorMatchingProfile.Create(
            tutorProfileId: Guid.NewGuid(),
            preferredSubjects: [MathSubjectId],
            preferredGrades: [10],
            minTuitionFeeVnd: 150_000,
            maxTuitionFeeVnd: 400_000,
            preferredProvinceCode: "HN",
            preferredDistrictCodes: [],
            receiveAllDistricts: true,
            teachingModes: ["OFFLINE"],
            isActive: false);

        var matched = engine.MatchTutorProfiles(
            ambiguousCriteria,
            [tutorAcceptingAllDistricts, tutorStrictSingleDistrict, inactiveTutor]);

        Assert.Single(matched);
        Assert.Equal(tutorAcceptingAllDistricts.TutorProfileId, matched[0].TutorProfileId);
        Assert.True(matched[0].MatchScore >= 0.70m);
    }
}
