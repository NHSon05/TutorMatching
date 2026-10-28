using TutorMatching.Domain.Catalog;
using System.Text.Json;
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

    public Task<SaveDraftResult> SaveDraftAsync(Guid userId, SaveDraftCommand command, CancellationToken cancellationToken = default) =>
        dbContext.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
        {
            await using var tx = await dbContext.Database.BeginTransactionAsync(cancellationToken);
            await dbContext.Database.ExecuteSqlInterpolatedAsync($"SELECT id FROM tutor_profiles WHERE user_id={userId} FOR UPDATE", cancellationToken);
            var result = await SaveDraftCoreAsync(userId, command, cancellationToken);
            if (result.Succeeded) await tx.CommitAsync(cancellationToken);
            else dbContext.ChangeTracker.Clear();
            return result;
        });

    private async Task<SaveDraftResult> SaveDraftCoreAsync(
        Guid userId,
        SaveDraftCommand command,
        CancellationToken cancellationToken = default)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken)
            ?? throw new InvalidOperationException($"User {userId} not found.");

        var profile = await GetOrCreateProfileAsync(user, cancellationToken);
        var now = clock.UtcNow;
        if (!profile.CanEdit(command.ExpectedVersion))
            return SaveDraftResult.Fail(AccountFailure.Conflict);
        if (command.Discovery?.Subjects is null && ReadSelections(profile.Id).Count > 0 && (command.About?.Subjects is not null || command.About?.TeachingLevels is not null))
            return SaveDraftResult.Fail(AccountFailure.InvalidInput, new Dictionary<string,string[]> { ["subjects"]=["Vui lòng sửa môn/lớp từ danh mục chuẩn."] });
        if (command.Pricing is { } rates && new[] { rates.HourlyRateVnd, rates.SessionRateVnd, rates.MonthlyRateVnd }.Any(x => x is <= 0))
            return SaveDraftResult.Fail(AccountFailure.InvalidInput, new Dictionary<string,string[]> { ["sessionRateVnd"] = ["Học phí phải là số nguyên dương."] });
        if (command.About?.DateOfBirth > DateOnly.FromDateTime(clock.UtcNow.UtcDateTime) || (command.About?.PhoneNumber?.Length??0)>32 || (command.AvatarUrl?.Length??0)>2048)
            return SaveDraftResult.Fail(AccountFailure.InvalidInput);
        if (command.Description?.ExperienceYears is < 0)
            return SaveDraftResult.Fail(AccountFailure.InvalidInput);
        var before = JsonSerializer.Serialize(MapToData(user, profile) with { CurrentStep = 0, Version = Guid.Empty });
        if (command.Discovery is { } discovery)
        {
            var validation = await ApplyDiscoveryAsync(profile, discovery, cancellationToken);
            if (validation is not null) return SaveDraftResult.Fail(AccountFailure.InvalidInput, validation);
        }

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

        if (profile.Status == TutorProfileStatus.APPROVED && before != JsonSerializer.Serialize(MapToData(user, profile) with { CurrentStep = 0, Version = Guid.Empty }))
        {
            var validation = await SubmissionErrorsAsync(user, profile, cancellationToken);
            profile.ReconsiderApproval(validation.Count == 0, now);
        }
        if (user.FullName.Length>100 || (profile.Bio?.Length??0)>4000 || (profile.TeachingMethodology?.Length??0)>4000 || (profile.AchievementsAndResults?.Length??0)>4000 || (profile.Degree?.Length??0)>256 || (profile.SchoolName?.Length??0)>256 || (profile.Specialization?.Length??0)>256)
            return SaveDraftResult.Fail(AccountFailure.InvalidInput);
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

    public Task<SubmitResult> SubmitAsync(Guid userId, CancellationToken cancellationToken = default, Guid? expectedVersion = null) =>
        dbContext.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
        {
            await using var tx = await dbContext.Database.BeginTransactionAsync(cancellationToken);
            await dbContext.Database.ExecuteSqlInterpolatedAsync($"SELECT id FROM tutor_profiles WHERE user_id={userId} FOR UPDATE", cancellationToken);
            var result = await SubmitCoreAsync(userId, cancellationToken, expectedVersion);
            if (result.Succeeded) await tx.CommitAsync(cancellationToken);
            return result;
        });
    private async Task<SubmitResult> SubmitCoreAsync(Guid userId, CancellationToken cancellationToken, Guid? expectedVersion)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken)
            ?? throw new InvalidOperationException($"User {userId} not found.");

        var profile = await GetOrCreateProfileAsync(user, cancellationToken);
        if (!profile.CanSubmit(expectedVersion)) return new(false, Conflict: true);
        var errors = await SubmissionErrorsAsync(user, profile, cancellationToken);
        if (errors.Count > 0)
        {
            return SubmitResult.Fail(errors.ToDictionary(k => k.Key, v => v.Value.ToArray()));
        }

        if (!expectedVersion.HasValue) return new(false, Conflict: true);
        var now = clock.UtcNow;
        profile.Status = TutorProfileStatus.PENDING_REVIEW;
        profile.SubmittedAt = now;
        profile.UpdatedAt = now;

        await dbContext.SaveChangesAsync(cancellationToken);
        return SubmitResult.Success(profile.Status, now);
    }

    public Task<string> UpdateAvatarAsync(Guid userId, string avatarUrl, CancellationToken cancellationToken = default) =>
        dbContext.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
        {
            // Avatar writes touch both rows; acquire the same profile → account order as hiring/review.
            await using var tx = await dbContext.Database.BeginTransactionAsync(cancellationToken);
            await dbContext.Database.ExecuteSqlInterpolatedAsync($"SELECT id FROM tutor_profiles WHERE user_id={userId} FOR UPDATE", cancellationToken);
            await dbContext.Database.ExecuteSqlInterpolatedAsync($"SELECT id FROM user_accounts WHERE id={userId} FOR UPDATE", cancellationToken);
            var result = await UpdateAvatarCoreAsync(userId, avatarUrl, cancellationToken);
            await tx.CommitAsync(cancellationToken);
            return result;
        });

    private async Task<string> UpdateAvatarCoreAsync(Guid userId, string avatarUrl, CancellationToken cancellationToken)
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

    private TutorOnboardingData MapToData(ApplicationUser user, TutorProfile profile)
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
            profile.ApprovedAt, profile.Version,
            new TutorDiscoveryData(ReadSelections(profile.Id), profile.TeachingModes, profile.ProvinceCode, profile.DistrictCode));
    }

    private async Task<Dictionary<string,List<string>>> SubmissionErrorsAsync(ApplicationUser user, TutorProfile profile, CancellationToken token)
    {
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
        if (profile.SessionRateVnd is not > 0)
            AddError(errors, "sessionRateVnd", "Vui lòng nhập giá theo buổi dương.");
        if (string.IsNullOrWhiteSpace(profile.Degree)) AddError(errors,"qualification","Vui lòng nhập trình độ chuyên môn.");
        if (profile.TeachingModes.Count == 0) AddError(errors,"teachingModes","Chọn hình thức dạy.");
        if (profile.TeachingModes.Any(m => m != "ONLINE") && !await dbContext.Districts.AnyAsync(d => d.DistrictCode == profile.DistrictCode && d.ProvinceCode == profile.ProvinceCode && d.IsActive && d.Province!.IsActive, token))
            AddError(errors,"districtCode","Chọn khu vực hợp lệ.");
        var selected = dbContext.ChangeTracker.Entries<TutorSubjectLevel>().Where(e => e.State != EntityState.Deleted && e.Entity.TutorProfileId == profile.Id).Select(e => e.Entity).ToList();
        if (selected.Count == 0) selected = await dbContext.Set<TutorSubjectLevel>().Where(t => t.TutorProfileId == profile.Id).ToListAsync(token);
        if (selected.Count == 0 || await dbContext.Set<TutorSubject>().AnyAsync(s=>s.TutorProfileId==profile.Id && !dbContext.Set<TutorSubjectLevel>().Any(t=>t.TutorProfileId==s.TutorProfileId && t.SubjectId==s.SubjectId),token)) AddError(errors,"subjects","Chọn môn và lớp đang hoạt động.");
        foreach (var entry in selected)
            if (!await dbContext.Subjects.AnyAsync(x=>x.Id==entry.SubjectId && x.IsActive,token) || !await dbContext.Set<TeachingLevel>().AnyAsync(x=>x.Code==entry.LevelCode && x.IsActive,token))
                AddError(errors,"subjects","Môn hoặc lớp đã ngừng sử dụng.");
        return errors;
    }
    private List<TutorSubjectSelection> ReadSelections(Guid id)
    {
        var rows = dbContext.Set<TutorSubjectLevel>().AsNoTracking().Where(t=>t.TutorProfileId==id).ToList();
        var subjects = dbContext.Set<TutorSubject>().AsNoTracking().Where(t=>t.TutorProfileId==id).OrderBy(t=>t.SubjectId).Select(t=>t.SubjectId).ToList();
        return subjects.Select(subject=>new TutorSubjectSelection(subject,rows.Where(t=>t.SubjectId==subject).Select(t=>t.LevelCode).Order().ToList())).ToList();
    }
    private async Task<IReadOnlyDictionary<string,string[]>?> ApplyDiscoveryAsync(TutorProfile profile, TutorDiscoveryData data, CancellationToken token)
    {
        var errors = new Dictionary<string,string[]>();
        if (data.TeachingModes is { } modes && (modes.Distinct().Count()!=modes.Count || modes.Any(m=>m is not ("ONLINE" or "OFFLINE" or "HYBRID")))) errors["teachingModes"]=["Hình thức dạy không hợp lệ."];
        if (data.Subjects is { } selections)
        {
            if (selections.Any(x=>x is null) || selections.Count>100) return new Dictionary<string,string[]> { ["subjects"]=["Danh sách môn không hợp lệ."] };
            if (selections.Select(x=>x.SubjectId).Distinct().Count()!=selections.Count) errors["subjects"]=["Môn học bị trùng."];
            foreach(var entry in selections)
            {
                if (entry.LevelCodes is null || entry.LevelCodes.Distinct().Count()!=entry.LevelCodes.Count || !await dbContext.Subjects.AnyAsync(x=>x.Id==entry.SubjectId && x.IsActive,token)) {errors["subjects"]=["Môn/lớp không hợp lệ."];continue;}
                if (await dbContext.Set<TeachingLevel>().CountAsync(x=>entry.LevelCodes.Contains(x.Code)&&x.IsActive,token)!=entry.LevelCodes.Count) errors["subjects"]=["Lớp đã ngừng sử dụng hoặc không tồn tại."];
            }
        }
        if ((data.ProvinceCode?.Length??0)>32 || (data.DistrictCode?.Length??0)>32) errors["districtCode"]=["Mã khu vực quá dài."];
        if (!string.IsNullOrWhiteSpace(data.ProvinceCode) && !await dbContext.Provinces.AnyAsync(p=>p.ProvinceCode==data.ProvinceCode&&p.IsActive,token)) errors["provinceCode"]=["Tỉnh/thành không hợp lệ."];
        if (!string.IsNullOrWhiteSpace(data.DistrictCode) && !await dbContext.Districts.AnyAsync(d=>d.DistrictCode==data.DistrictCode&&d.ProvinceCode==data.ProvinceCode&&d.IsActive,token)) errors["districtCode"]=["Quận/huyện không hợp lệ."];
        if(errors.Count>0)return errors;
        if(data.TeachingModes is not null)profile.TeachingModes=data.TeachingModes;
        profile.ProvinceCode=string.IsNullOrWhiteSpace(data.ProvinceCode)?null:data.ProvinceCode;
        profile.DistrictCode=string.IsNullOrWhiteSpace(data.DistrictCode)?null:data.DistrictCode;
        if(data.Subjects is { } subjects)
        {
            dbContext.RemoveRange(await dbContext.Set<TutorSubjectLevel>().Where(t=>t.TutorProfileId==profile.Id).ToListAsync(token));
            dbContext.RemoveRange(await dbContext.Set<TutorSubject>().Where(t=>t.TutorProfileId==profile.Id).ToListAsync(token));
            await dbContext.SaveChangesAsync(token);
            foreach(var selection in subjects)
            {
                dbContext.Add(new TutorSubject {TutorProfileId=profile.Id,SubjectId=selection.SubjectId,CreatedAt=clock.UtcNow});
                foreach(var code in selection.LevelCodes)dbContext.Add(new TutorSubjectLevel {TutorProfileId=profile.Id,SubjectId=selection.SubjectId,LevelCode=code});
            }
            profile.Subjects=await dbContext.Subjects.Where(x=>subjects.Select(t=>t.SubjectId).Contains(x.Id)).Select(x=>x.Name).ToListAsync(token);
            profile.TeachingLevels=subjects.SelectMany(t=>t.LevelCodes).Distinct().ToList();
        }
        await dbContext.SaveChangesAsync(token);
        return null;
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
