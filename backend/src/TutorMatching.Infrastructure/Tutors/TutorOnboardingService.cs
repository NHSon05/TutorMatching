using Microsoft.EntityFrameworkCore;
using Npgsql;
using TutorMatching.Application.Abstractions;
using TutorMatching.Application.Tutors;
using TutorMatching.Domain.Tutors;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Infrastructure.Tutors;

public sealed class TutorOnboardingService(
    ApplicationDbContext dbContext,
    IClock clock) : ITutorOnboardingService
{
    public async Task<TutorOnboardingData?> GetOnboardingAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user is null) return null;

        var profile = await GetOrCreateProfileAsync(user, cancellationToken);
        return MapToData(user, profile);
    }

    public async Task<SaveDraftResult> SaveDraftAsync(
        Guid userId,
        SaveDraftCommand command,
        CancellationToken cancellationToken = default)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken)
            ?? throw new InvalidOperationException($"User {userId} not found.");

        var profile = await GetOrCreateProfileAsync(user, cancellationToken);
        var now = clock.UtcNow;

        if (command.CurrentStep is { } step)
        {
            profile.CurrentStep = Math.Clamp(step, 1, 6);
        }

        if (command.About is { } about)
        {
            if (!string.IsNullOrWhiteSpace(about.FullName))
            {
                user.FullName = about.FullName.Trim();
            }
            if (about.DateOfBirth is not null)
            {
                user.DateOfBirth = about.DateOfBirth;
            }
            if (about.PhoneNumber is not null)
            {
                var trimmedPhone = string.IsNullOrWhiteSpace(about.PhoneNumber) ? null : about.PhoneNumber.Trim();
                if (trimmedPhone != null && trimmedPhone != user.PhoneNumber)
                {
                    var isDuplicate = await dbContext.Users.AnyAsync(
                        u => u.Id != userId && u.PhoneNumber == trimmedPhone,
                        cancellationToken);

                    if (isDuplicate)
                    {
                        var errors = new Dictionary<string, string[]>
                        {
                            ["phoneNumber"] = ["Số điện thoại này đã được sử dụng bởi một tài khoản khác."]
                        };
                        return SaveDraftResult.Fail(AccountFailure.DuplicatePhoneNumber, errors);
                    }
                }
                user.PhoneNumber = trimmedPhone;
            }
            if (about.Subjects is not null)
            {
                profile.Subjects = about.Subjects;
            }
            if (about.Languages is not null)
            {
                profile.Languages = about.Languages;
            }
            if (about.TeachingLevels is not null)
            {
                profile.TeachingLevels = about.TeachingLevels;
            }
        }

        if (!string.IsNullOrWhiteSpace(command.AvatarUrl))
        {
            profile.AvatarUrl = command.AvatarUrl;
            user.AvatarUrl = command.AvatarUrl;
        }

        if (command.HasCertifications is { } hasCerts)
        {
            profile.HasCertifications = hasCerts;
        }

        if (command.Certifications is not null)
        {
            profile.Certifications = command.Certifications.Select(c => new TutorCertification
            {
                Name = c.Name,
                Issuer = c.Issuer,
                IssueYear = c.IssueYear,
                FileUrl = c.FileUrl
            }).ToList();
        }

        if (command.Education is { } edu)
        {
            profile.EducationType = edu.EducationType;
            profile.SchoolName = edu.SchoolName;
            profile.Degree = edu.Degree;
            profile.Specialization = edu.Specialization;
            profile.YearOfStudy = edu.YearOfStudy;
        }

        if (command.Description is { } desc)
        {
            profile.Bio = desc.Bio;
            profile.ExperienceYears = desc.ExperienceYears;
            profile.TeachingMethodology = desc.TeachingMethodology;
            profile.AchievementsAndResults = desc.AchievementsAndResults;
        }

        if (command.Pricing is { } pricing)
        {
            profile.HourlyRateVnd = pricing.HourlyRateVnd;
            profile.SessionRateVnd = pricing.SessionRateVnd;
            profile.MonthlyRateVnd = pricing.MonthlyRateVnd;
            profile.IsNegotiable = pricing.IsNegotiable;
        }

        user.UpdatedAt = now;
        profile.UpdatedAt = now;

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex) when (IsPhoneNumberUniqueViolation(ex))
        {
            var errors = new Dictionary<string, string[]>
            {
                ["phoneNumber"] = ["Số điện thoại này đã được sử dụng bởi một tài khoản khác."]
            };
            return SaveDraftResult.Fail(AccountFailure.DuplicatePhoneNumber, errors);
        }

        return SaveDraftResult.Success(MapToData(user, profile));
    }

    private static bool IsPhoneNumberUniqueViolation(DbUpdateException ex)
    {
        return ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation } pg
            && string.Equals(pg.ConstraintName, "ux_user_accounts_phone_number", StringComparison.Ordinal);
    }

    public async Task<SubmitResult> SubmitAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken)
            ?? throw new InvalidOperationException($"User {userId} not found.");

        var profile = await GetOrCreateProfileAsync(user, cancellationToken);
        var errors = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);

        // Step 1: About validation
        if (string.IsNullOrWhiteSpace(user.FullName) || user.FullName.Trim().Length < 2)
            AddError(errors, "fullName", "Họ và tên phải có ít nhất 2 ký tự.");
        if (user.DateOfBirth is null)
            AddError(errors, "dateOfBirth", "Vui lòng chọn ngày sinh.");
        if (string.IsNullOrWhiteSpace(user.PhoneNumber))
            AddError(errors, "phoneNumber", "Vui lòng nhập số điện thoại.");
        if (profile.Subjects.Count == 0)
            AddError(errors, "subjects", "Vui lòng chọn ít nhất một môn học nhận dạy.");
        if (profile.Languages.Count == 0)
            AddError(errors, "languages", "Vui lòng chọn ít nhất một ngôn ngữ giảng dạy.");
        if (profile.TeachingLevels.Count == 0)
            AddError(errors, "teachingLevels", "Vui lòng chọn ít nhất một trình độ học sinh.");

        // Step 2: Photo validation
        if (string.IsNullOrWhiteSpace(profile.AvatarUrl) && string.IsNullOrWhiteSpace(user.AvatarUrl))
            AddError(errors, "avatarUrl", "Vui lòng tải lên ảnh đại diện.");

        // Step 3: Certifications validation
        if (profile.HasCertifications && profile.Certifications.Count == 0)
            AddError(errors, "certifications", "Vui lòng tải lên thông tin chứng chỉ hoặc bỏ chọn nếu chưa có.");

        // Step 4: Education validation
        if (string.IsNullOrWhiteSpace(profile.EducationType))
            AddError(errors, "educationType", "Vui lòng chọn thông tin học vấn.");

        // Step 5: Description validation
        if (string.IsNullOrWhiteSpace(profile.Bio))
            AddError(errors, "bio", "Vui lòng nhập giới thiệu bản thân (Bio).");
        if (profile.ExperienceYears is null or < 0)
            AddError(errors, "experienceYears", "Vui lòng nhập số năm kinh nghiệm hợp lệ.");

        // Step 6: Pricing validation
        var hasValidRate = (profile.HourlyRateVnd is > 0) ||
                           (profile.SessionRateVnd is > 0) ||
                           (profile.MonthlyRateVnd is > 0);
        if (!hasValidRate)
            AddError(errors, "pricing", "Vui lòng thiết lập ít nhất một mức giá học phí hợp lệ (theo giờ, buổi hoặc tháng).");

        if (errors.Count > 0)
        {
            return SubmitResult.Fail(errors.ToDictionary(k => k.Key, v => v.Value.ToArray()));
        }

        var now = clock.UtcNow;
        profile.Status = TutorProfileStatus.PENDING_REVIEW;
        profile.SubmittedAt = now;
        profile.UpdatedAt = now;

        await dbContext.SaveChangesAsync(cancellationToken);
        return SubmitResult.Success(profile.Status, now);
    }

    public async Task<string> UpdateAvatarAsync(
        Guid userId,
        string avatarUrl,
        CancellationToken cancellationToken = default)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken)
            ?? throw new InvalidOperationException($"User {userId} not found.");

        var profile = await GetOrCreateProfileAsync(user, cancellationToken);
        var now = clock.UtcNow;

        user.AvatarUrl = avatarUrl;
        user.UpdatedAt = now;
        profile.AvatarUrl = avatarUrl;
        profile.UpdatedAt = now;

        await dbContext.SaveChangesAsync(cancellationToken);
        return avatarUrl;
    }

    private async Task<TutorProfile> GetOrCreateProfileAsync(ApplicationUser user, CancellationToken cancellationToken)
    {
        var profile = await dbContext.TutorProfiles.FirstOrDefaultAsync(p => p.UserId == user.Id, cancellationToken);
        if (profile is not null) return profile;

        var now = clock.UtcNow;
        profile = new TutorProfile
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Status = TutorProfileStatus.DRAFT,
            CurrentStep = 1,
            AvatarUrl = user.AvatarUrl,
            CreatedAt = now,
            UpdatedAt = now
        };

        dbContext.TutorProfiles.Add(profile);
        await dbContext.SaveChangesAsync(cancellationToken);
        return profile;
    }

    private static TutorOnboardingData MapToData(ApplicationUser user, TutorProfile profile)
    {
        return new TutorOnboardingData(
            profile.Status,
            profile.CurrentStep,
            new TutorAboutData(
                user.FullName,
                user.DateOfBirth,
                user.PhoneNumber,
                profile.Subjects,
                profile.Languages,
                profile.TeachingLevels),
            profile.AvatarUrl ?? user.AvatarUrl,
            profile.HasCertifications,
            profile.Certifications.Select(c => new TutorCertificationData(c.Name, c.Issuer, c.IssueYear, c.FileUrl)).ToList(),
            new TutorEducationData(
                profile.EducationType,
                profile.SchoolName,
                profile.Degree,
                profile.Specialization,
                profile.YearOfStudy),
            new TutorDescriptionData(
                profile.Bio,
                profile.ExperienceYears,
                profile.TeachingMethodology,
                profile.AchievementsAndResults),
            new TutorPricingData(
                profile.HourlyRateVnd,
                profile.SessionRateVnd,
                profile.MonthlyRateVnd,
                profile.IsNegotiable),
            profile.SubmittedAt,
            profile.ApprovedAt);
    }

    private static void AddError(Dictionary<string, List<string>> errors, string key, string message)
    {
        if (!errors.TryGetValue(key, out var list))
        {
            list = [];
            errors[key] = list;
        }
        list.Add(message);
    }
}
