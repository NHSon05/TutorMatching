using TutorMatching.Application.Abstractions;
using TutorMatching.Domain.Tutors;
using TutorMatching.Domain.Users;

namespace TutorMatching.Application.Tutors;

public sealed class MatchingEngine : IMatchingEngine
{
    public IReadOnlyList<MatchedTutorCardDto> MatchPublicTutors(
        ExtractedDemandCriteriaDto criteria,
        IReadOnlyList<PublicTutorCandidate> candidates,
        int maxResults = 12)
    {
        var results = new List<MatchedTutorCardDto>();

        foreach (var candidate in candidates)
        {
            // Strict SRS Eligibility Invariant: Must be APPROVED tutor profile and ACTIVE user account
            if (candidate.ProfileStatus != TutorProfileStatus.APPROVED ||
                candidate.AccountStatus != AccountStatus.ACTIVE)
            {
                continue;
            }

            // 1. Step 1: Strict Subject check (subjects)
            var hasSubjectCriterion = criteria.SubjectId.HasValue || !string.IsNullOrWhiteSpace(criteria.SubjectNameRaw);
            var subjectMatched = false;

            if (criteria.SubjectId.HasValue)
            {
                subjectMatched = candidate.SubjectIds.Contains(criteria.SubjectId.Value);
            }

            if (!subjectMatched && !string.IsNullOrWhiteSpace(criteria.SubjectNameRaw))
            {
                var targetSubject = criteria.SubjectNameRaw.Trim();
                subjectMatched = candidate.SubjectNames.Any(s =>
                    string.Equals(s, targetSubject, StringComparison.OrdinalIgnoreCase) ||
                    s.Contains(targetSubject, StringComparison.OrdinalIgnoreCase) ||
                    targetSubject.Contains(s, StringComparison.OrdinalIgnoreCase));
            }

            if (hasSubjectCriterion && !subjectMatched)
            {
                continue;
            }

            // 2. Step 2: Strict Province check (provinceName / provinceCode)
            var hasProvinceCriterion = !string.IsNullOrWhiteSpace(criteria.ProvinceName) ||
                                       !string.IsNullOrWhiteSpace(criteria.ProvinceCode);
            var provinceMatched = false;

            if (hasProvinceCriterion)
            {
                if (!string.IsNullOrWhiteSpace(criteria.ProvinceName) &&
                    !string.IsNullOrWhiteSpace(candidate.ProvinceName))
                {
                    provinceMatched = string.Equals(
                        candidate.ProvinceName.Trim(),
                        criteria.ProvinceName.Trim(),
                        StringComparison.OrdinalIgnoreCase);
                }

                if (!provinceMatched &&
                    !string.IsNullOrWhiteSpace(criteria.ProvinceCode) &&
                    !string.IsNullOrWhiteSpace(candidate.ProvinceCode))
                {
                    provinceMatched = string.Equals(
                        candidate.ProvinceCode.Trim(),
                        criteria.ProvinceCode.Trim(),
                        StringComparison.OrdinalIgnoreCase);
                }

                if (!provinceMatched)
                {
                    continue;
                }
            }

            // 3. Step 3: Strict Listed Price check (listedPriceVnd)
            var hasPriceCriterion = criteria.TuitionFeeVnd > 0 && !criteria.IsFeeNegotiable;
            if (hasPriceCriterion)
            {
                if (candidate.ListedPriceVnd <= 0 || candidate.ListedPriceVnd > criteria.TuitionFeeVnd)
                {
                    continue;
                }
            }

            // 4. Step 4: Strict Teaching Mode check (teachingModeCode)
            var requestedMode = string.IsNullOrWhiteSpace(criteria.TeachingMode)
                ? "OFFLINE"
                : criteria.TeachingMode.Trim().ToUpperInvariant();

            var modeMatched = candidate.TeachingModes.Any(m =>
                string.Equals(m, requestedMode, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(m, "HYBRID", StringComparison.OrdinalIgnoreCase));

            if (!modeMatched)
            {
                continue;
            }

            // Calculate ranking score & highlights after passing all 4 strict filters
            var score = 0.00m;
            var highlights = new List<string>();

            if (subjectMatched)
            {
                score += 0.35m;
                highlights.Add($"Đúng môn {criteria.SubjectNameRaw ?? candidate.SubjectNames.FirstOrDefault() ?? "học"}");
            }

            if (hasProvinceCriterion && provinceMatched)
            {
                score += 0.15m;
                if (!string.IsNullOrWhiteSpace(criteria.DistrictCode) &&
                    string.Equals(candidate.DistrictCode, criteria.DistrictCode, StringComparison.OrdinalIgnoreCase))
                {
                    score += 0.15m;
                    if (!string.IsNullOrWhiteSpace(candidate.DistrictName))
                    {
                        highlights.Add($"Cùng {candidate.DistrictName}");
                    }
                }
                else if (!string.IsNullOrWhiteSpace(candidate.ProvinceName))
                {
                    highlights.Add($"Cùng {candidate.ProvinceName}");
                }
            }
            else
            {
                score += 0.15m;
            }

            if (hasPriceCriterion)
            {
                score += 0.15m;
                highlights.Add("Phù hợp ngân sách học phí");
            }
            else
            {
                score += 0.10m;
            }

            score += 0.10m;
            highlights.Add(requestedMode == "ONLINE" ? "Dạy Trực tuyến (Online)" : $"Hỗ trợ dạy {requestedMode}");

            if (criteria.GradeLevel.HasValue)
            {
                var expectedLevelCode = GradeToLevelCode(criteria.GradeLevel.Value);
                if (candidate.TeachingLevels.Count == 0 ||
                    candidate.TeachingLevels.Any(l => string.Equals(l, expectedLevelCode, StringComparison.OrdinalIgnoreCase)))
                {
                    score += 0.10m;
                    highlights.Add($"Phù hợp Lớp {criteria.GradeLevel.Value}");
                }
            }

            var finalScore = decimal.Round(Math.Clamp(score, 0.00m, 1.00m), 2, MidpointRounding.AwayFromZero);

            var displayMode = candidate.TeachingModes.Contains(requestedMode, StringComparer.OrdinalIgnoreCase)
                ? requestedMode
                : (candidate.TeachingModes.FirstOrDefault() ?? requestedMode);

            results.Add(new MatchedTutorCardDto(
                TutorProfileId: candidate.TutorProfileId,
                DisplayName: candidate.DisplayName,
                AvatarUrl: candidate.AvatarUrl,
                Headline: candidate.Headline,
                ListedPriceVnd: candidate.ListedPriceVnd,
                IsNegotiable: candidate.IsNegotiable,
                TeachingModeCode: displayMode,
                ProvinceName: candidate.ProvinceName,
                DistrictName: candidate.DistrictName,
                Subjects: candidate.SubjectNames,
                MatchScore: finalScore,
                MatchHighlights: highlights,
                SchoolName: candidate.SchoolName,
                Degree: candidate.Degree,
                Specialization: candidate.Specialization,
                EducationType: candidate.EducationType,
                Bio: candidate.Bio,
                ExperienceYears: candidate.ExperienceYears,
                TeachingMethodology: candidate.TeachingMethodology,
                AchievementsAndResults: candidate.AchievementsAndResults,
                HourlyRateVnd: candidate.HourlyRateVnd,
                SessionRateVnd: candidate.SessionRateVnd,
                MonthlyRateVnd: candidate.MonthlyRateVnd,
                TeachingModes: candidate.TeachingModes));
        }

        return results
            .OrderByDescending(x => x.MatchScore)
            .ThenBy(x => x.ListedPriceVnd)
            .Take(maxResults)
            .ToList();
    }

    public IReadOnlyList<MatchedTutorSubscriptionDto> MatchTutorProfiles(
        ExtractedDemandCriteriaDto criteria,
        IReadOnlyList<TutorMatchingProfile> profiles)
    {
        var results = new List<MatchedTutorSubscriptionDto>();

        foreach (var profile in profiles)
        {
            if (!profile.IsActive)
            {
                continue;
            }

            // 1. Subject check
            if (criteria.SubjectId.HasValue &&
                profile.PreferredSubjects.Count > 0 &&
                !profile.PreferredSubjects.Contains(criteria.SubjectId.Value))
            {
                continue;
            }

            // 2. Grade check
            if (criteria.GradeLevel.HasValue &&
                profile.PreferredGrades.Count > 0 &&
                !profile.PreferredGrades.Contains(criteria.GradeLevel.Value))
            {
                continue;
            }

            // 3. Tuition fee check
            if (!criteria.IsFeeNegotiable && criteria.TuitionFeeVnd > 0)
            {
                if (criteria.TuitionFeeVnd < profile.MinTuitionFeeVnd)
                {
                    continue;
                }

                if (profile.MaxTuitionFeeVnd.HasValue && criteria.TuitionFeeVnd > profile.MaxTuitionFeeVnd.Value)
                {
                    continue;
                }
            }

            // 4. Teaching mode & Location check
            var isOnlineDemand = string.Equals(criteria.TeachingMode, "ONLINE", StringComparison.OrdinalIgnoreCase);
            var tutorTeachesOnline = profile.TeachingModes.Any(m =>
                string.Equals(m, "ONLINE", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(m, "HYBRID", StringComparison.OrdinalIgnoreCase));

            var score = 0.65m;

            if (isOnlineDemand)
            {
                if (!tutorTeachesOnline)
                {
                    continue;
                }

                score += 0.30m;
            }
            else
            {
                // Offline or Hybrid demand
                if (!string.IsNullOrWhiteSpace(criteria.ProvinceCode) &&
                    !string.IsNullOrWhiteSpace(profile.PreferredProvinceCode) &&
                    !string.Equals(criteria.ProvinceCode, profile.PreferredProvinceCode, StringComparison.OrdinalIgnoreCase))
                {
                    if (!tutorTeachesOnline)
                    {
                        continue;
                    }
                }

                if (!string.IsNullOrWhiteSpace(criteria.DistrictCode))
                {
                    var districtMatched = profile.PreferredDistrictCodes.Any(d =>
                        string.Equals(d, criteria.DistrictCode, StringComparison.OrdinalIgnoreCase));

                    if (districtMatched)
                    {
                        score += 0.30m;
                    }
                    else if (profile.ReceiveAllDistricts)
                    {
                        score += 0.20m;
                    }
                    else
                    {
                        continue;
                    }
                }
                else if (criteria.IsLocationAmbiguous)
                {
                    // Ambiguous district: only notify tutors who opted into ReceiveAllDistricts in that province
                    if (profile.ReceiveAllDistricts)
                    {
                        score += 0.20m;
                    }
                    else
                    {
                        continue;
                    }
                }
            }

            results.Add(new MatchedTutorSubscriptionDto(
                TutorProfileId: profile.TutorProfileId,
                MatchScore: decimal.Round(Math.Clamp(score, 0.00m, 1.00m), 2, MidpointRounding.AwayFromZero)));
        }

        return results
            .OrderByDescending(x => x.MatchScore)
            .ToList();
    }

    private static string GradeToLevelCode(int grade) => grade switch
    {
        >= 1 and <= 5 => "PRIMARY",
        >= 6 and <= 9 => "SECONDARY",
        _ => "HIGH_SCHOOL",
    };
}
