using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TutorMatching.Domain.Catalog;
using TutorMatching.Domain.Courses;
using TutorMatching.Domain.Locations;
using TutorMatching.Domain.Tutors;
using TutorMatching.Domain.Users;

namespace TutorMatching.Infrastructure.Persistence;

public sealed class DevelopmentDataSeeder(
    UserManager<ApplicationUser> userManager,
    ApplicationDbContext dbContext,
    IConfiguration configuration)
{
    public async Task SeedAsync()
    {
        await SeedProvincesAndDistrictsAsync();
        await SeedAdminAsync();
        await SeedTutorsAsync();
    }

    private async Task SeedProvincesAndDistrictsAsync()
    {
        var provinces = new List<(string Code, string Name, List<(string Code, string Name)> Districts)>
        {
            ("HN", "Hà Nội", [
                ("HN_CG", "Quận Cầu Giấy"),
                ("HN_BD", "Quận Ba Đình"),
                ("HN_DD", "Quận Đống Đa"),
                ("HN_HBT", "Quận Hai Bà Trưng"),
                ("HN_TX", "Quận Thanh Xuân"),
                ("HN_HK", "Quận Hoàn Kiếm")
            ]),
            ("DN", "Đà Nẵng", [
                ("DN_HC", "Quận Hải Châu"),
                ("DN_TK", "Quận Thanh Khê"),
                ("DN_ST", "Quận Sơn Trà"),
                ("DN_NHS", "Quận Ngũ Hành Sơn"),
                ("DN_CL", "Quận Cẩm Lệ"),
                ("DN_LK", "Quận Liên Chiểu")
            ]),
            ("HCM", "TP. Hồ Chí Minh", [
                ("HCM_Q1", "Quận 1"),
                ("HCM_Q3", "Quận 3"),
                ("HCM_Q5", "Quận 5"),
                ("HCM_Q7", "Quận 7"),
                ("HCM_Q10", "Quận 10"),
                ("HCM_TB", "Quận Tân Bình"),
                ("HCM_BT", "Quận Bình Thạnh"),
                ("HCM_TD", "TP. Thủ Đức")
            ]),
            ("HP", "Hải Phòng", [
                ("HP_HB", "Quận Hồng Bàng"),
                ("HP_LC", "Quận Lê Chân"),
                ("HP_NG", "Quận Ngô Quyền")
            ]),
            ("CT", "Cần Thơ", [
                ("CT_NK", "Quận Ninh Kiều"),
                ("CT_CR", "Quận Cái Răng")
            ])
        };

        foreach (var (pCode, pName, dists) in provinces)
        {
            var province = await dbContext.Provinces.SingleOrDefaultAsync(p => p.ProvinceCode == pCode);
            if (province is null)
            {
                province = new Province { ProvinceCode = pCode, ProvinceName = pName, IsActive = true };
                dbContext.Provinces.Add(province);
            }

            foreach (var (dCode, dName) in dists)
            {
                if (!await dbContext.Districts.AnyAsync(d => d.DistrictCode == dCode))
                {
                    dbContext.Districts.Add(new District
                    {
                        DistrictCode = dCode,
                        ProvinceCode = pCode,
                        DistrictName = dName,
                        IsActive = true
                    });
                }
            }
        }

        var levels = new List<(string Code, string Name)>
        {
            ("PRIMARY", "Tiểu học"),
            ("SECONDARY", "THCS"),
            ("HIGH_SCHOOL", "THPT"),
            ("UNIVERSITY", "Đại học")
        };
        foreach (var (code, name) in levels)
        {
            if (!await dbContext.Set<TeachingLevel>().AnyAsync(l => l.Code == code))
            {
                dbContext.Set<TeachingLevel>().Add(new TeachingLevel { Code = code, Name = name, IsActive = true });
            }
        }

        await dbContext.SaveChangesAsync();
    }

    private async Task SeedAdminAsync()
    {
        if (!bool.TryParse(configuration["SeedAdmin:Enabled"], out var enabled) || !enabled)
        {
            return;
        }

        var email = RequireSetting("SeedAdmin:Email").Trim();
        var password = RequireSetting("SeedAdmin:Password");
        var fullName = RequireSetting("SeedAdmin:FullName").Trim();

        if (fullName.Length is < 2 or > 100)
        {
            throw new InvalidOperationException("SeedAdmin:FullName must contain 2-100 characters.");
        }

        var existingUser = await userManager.FindByEmailAsync(email);
        if (existingUser is not null)
        {
            if (existingUser.Role != AccountRole.ADMIN)
            {
                throw new InvalidOperationException(
                    "The configured seed email already belongs to a non-Admin account.");
            }

            return;
        }

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = email,
            UserName = email,
            FullName = fullName,
            Role = AccountRole.ADMIN,
            EmailConfirmed = true,
            Status = AccountStatus.ACTIVE,
        };

        EnsureSucceeded(
            await userManager.CreateAsync(user, password),
            "create the controlled Admin demo account");
    }

    private async Task SeedTutorsAsync()
    {
        const string defaultPassword = "Password123!";

        var tutors = GetDemoTutors();

        foreach (var item in tutors)
        {
            var existingUser = await userManager.FindByEmailAsync(item.Email);
            if (existingUser is not null)
            {
                // Repair only recognizable, untouched demo profiles from the legacy seed.
                var existingProfile = await dbContext.TutorProfiles.SingleOrDefaultAsync(p => p.UserId == existingUser.Id);
                if (existingProfile is not null && existingUser.Role == AccountRole.TUTOR && existingUser.FullName == item.FullName)
                {
                    var isUntouched = existingProfile.Bio == item.Bio && existingProfile.Degree == item.Degree &&
                        existingProfile.SessionRateVnd == item.SessionRateVnd;

                    var migrationDrafted = existingProfile.Status == TutorProfileStatus.DRAFT &&
                        await dbContext.AuditEvents.AnyAsync(a => a.Action == "DiscoveryMigrationDrafted" &&
                            a.EntityType == "TutorProfile" && a.EntityId == existingProfile.Id.ToString() &&
                            a.CreatedAt >= existingProfile.UpdatedAt);

                    if (migrationDrafted || (isUntouched && (existingProfile.Status == item.Status ||
                        !await dbContext.TutorSubjects.AnyAsync(link => link.TutorProfileId == existingProfile.Id) ||
                        string.IsNullOrEmpty(existingProfile.ProvinceCode) ||
                        !await dbContext.AvailabilitySlots.AnyAsync(s => s.TutorProfileId == existingProfile.Id))))
                    {
                        await NormalizeDemoProfile(existingProfile, item);
                        if (migrationDrafted)
                        {
                            existingProfile.Status = item.Status;
                            existingProfile.ApprovedAt = item.Status == TutorProfileStatus.APPROVED ? DateTimeOffset.UtcNow : null;
                            existingProfile.UpdatedAt = DateTimeOffset.UtcNow;
                        }
                    }
                }
                continue;
            }

            var userId = Guid.NewGuid();
            var user = new ApplicationUser
            {
                Id = userId,
                Email = item.Email,
                UserName = item.Email,
                FullName = item.FullName,
                PhoneNumber = item.PhoneNumber,
                DateOfBirth = item.DateOfBirth,
                AvatarUrl = item.AvatarUrl,
                Role = AccountRole.TUTOR,
                EmailConfirmed = true,
                Status = AccountStatus.ACTIVE,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };

            var createResult = await userManager.CreateAsync(user, defaultPassword);
            EnsureSucceeded(createResult, $"create tutor user account {item.Email}");

            var now = DateTimeOffset.UtcNow;
            var profile = new TutorProfile
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Status = item.Status,
                CurrentStep = item.CurrentStep,
                Subjects = item.Subjects,
                Languages = item.Languages,
                TeachingLevels = item.TeachingLevels,
                AvatarUrl = item.AvatarUrl,
                HasCertifications = item.Certifications.Count > 0,
                Certifications = item.Certifications,
                EducationType = item.EducationType,
                SchoolName = item.SchoolName,
                Degree = item.Degree,
                Specialization = item.Specialization,
                YearOfStudy = item.YearOfStudy,
                Bio = item.Bio,
                ExperienceYears = item.ExperienceYears,
                TeachingMethodology = item.TeachingMethodology,
                AchievementsAndResults = item.AchievementsAndResults,
                TeachingModes = item.TeachingModes ?? (item.CurrentStep >= 5 ? ["ONLINE"] : []),
                ProvinceCode = item.ProvinceCode,
                DistrictCode = item.DistrictCode,
                HourlyRateVnd = item.HourlyRateVnd,
                SessionRateVnd = item.SessionRateVnd,
                MonthlyRateVnd = item.MonthlyRateVnd,
                IsNegotiable = item.IsNegotiable,
                CreatedAt = now,
                UpdatedAt = now,
                SubmittedAt = item.Status != TutorProfileStatus.DRAFT ? now : null,
                ApprovedAt = item.Status == TutorProfileStatus.APPROVED ? now : null
            };

            dbContext.TutorProfiles.Add(profile);
            await NormalizeDemoProfile(profile, item);
        }

        await dbContext.SaveChangesAsync();
    }

    private async Task NormalizeDemoProfile(TutorProfile profile, SeedTutorItem item)
    {
        if (item.TeachingModes is { Count: > 0 })
        {
            profile.TeachingModes = item.TeachingModes;
        }
        else if (profile.TeachingModes.Count == 0 && profile.CurrentStep >= 5)
        {
            profile.TeachingModes = ["ONLINE"];
        }

        if (!string.IsNullOrEmpty(item.ProvinceCode))
        {
            profile.ProvinceCode = item.ProvinceCode;
            profile.DistrictCode = item.DistrictCode;
        }

        profile.NormalizedDisplayName = ApplicationDbContext.NormalizeSearchName(item.FullName);

        var levelMap = new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["Tiểu học (Lớp 1 - 5)"] = "PRIMARY",
            ["THCS (Lớp 6 - 9)"] = "SECONDARY",
            ["THPT (Lớp 10 - 12)"] = "HIGH_SCHOOL",
            ["Luyện thi tốt nghiệp & ĐH"] = "HIGH_SCHOOL",
            ["Luyện thi vào 10"] = "SECONDARY",
            ["Sinh viên đại học"] = "UNIVERSITY"
        };
        var levels = item.TeachingLevels.Where(levelMap.ContainsKey).Select(label => levelMap[label]).Distinct().ToList();
        var existingSubjects = await dbContext.TutorSubjects.Where(s => s.TutorProfileId == profile.Id).Select(s => s.SubjectId).ToListAsync();
        var existingLevels = await dbContext.Set<TutorSubjectLevel>().Where(s => s.TutorProfileId == profile.Id).ToListAsync();

        foreach (var name in item.Subjects.Distinct())
        {
            var subject = dbContext.Subjects.Local.FirstOrDefault(s => s.Name == name) ?? await dbContext.Subjects.SingleOrDefaultAsync(s => s.Name == name);
            if (subject is null)
            {
                subject = new Subject { Id = Guid.NewGuid(), Name = name, IsActive = true };
                dbContext.Subjects.Add(subject);
            }

            if (!existingSubjects.Contains(subject.Id))
            {
                dbContext.TutorSubjects.Add(new TutorSubject { TutorProfileId = profile.Id, SubjectId = subject.Id });
            }

            foreach (var level in levels)
            {
                if (!existingLevels.Any(link => link.SubjectId == subject.Id && link.LevelCode == level))
                {
                    dbContext.Set<TutorSubjectLevel>().Add(new TutorSubjectLevel { TutorProfileId = profile.Id, SubjectId = subject.Id, LevelCode = level });
                }
            }
        }

        // Availability slots
        if (item.AvailabilitySlots is { Count: > 0 } && !await dbContext.AvailabilitySlots.AnyAsync(s => s.TutorProfileId == profile.Id))
        {
            var now = DateTimeOffset.UtcNow;
            foreach (var slot in item.AvailabilitySlots)
            {
                dbContext.AvailabilitySlots.Add(new AvailabilitySlot
                {
                    Id = Guid.NewGuid(),
                    TutorProfileId = profile.Id,
                    AvailabilityType = "WEEKLY",
                    DayOfWeek = slot.DayOfWeek,
                    StartTime = slot.StartTime,
                    EndTime = slot.EndTime,
                    IsActive = true,
                    CreatedAt = now,
                    UpdatedAt = now
                });
            }
        }

        // Courses
        if (item.Courses is { Count: > 0 } && !await dbContext.Courses.AnyAsync(c => c.TutorProfileId == profile.Id))
        {
            var now = DateTimeOffset.UtcNow;
            foreach (var courseItem in item.Courses)
            {
                var subject = dbContext.Subjects.Local.FirstOrDefault(s => s.Name == courseItem.SubjectName)
                    ?? await dbContext.Subjects.SingleOrDefaultAsync(s => s.Name == courseItem.SubjectName);
                if (subject != null)
                {
                    dbContext.Courses.Add(new Course
                    {
                        Id = Guid.NewGuid(),
                        TutorProfileId = profile.Id,
                        SubjectId = subject.Id,
                        Name = courseItem.Name,
                        Description = courseItem.Description,
                        SessionCount = courseItem.SessionCount,
                        PricePerSessionVnd = courseItem.PricePerSessionVnd,
                        StatusCode = "ACTIVE",
                        CreatedAt = now,
                        UpdatedAt = now
                    });
                }
            }
        }

        // Rejection review note
        if (profile.Status == TutorProfileStatus.REJECTED && !string.IsNullOrWhiteSpace(item.RejectionNote)
            && !await dbContext.TutorProfileReviews.AnyAsync(r => r.TutorProfileId == profile.Id))
        {
            var reviewer = await dbContext.Users.FirstOrDefaultAsync(u => u.Role == AccountRole.ADMIN)
                ?? await dbContext.Users.FirstOrDefaultAsync();
            if (reviewer != null)
            {
                dbContext.TutorProfileReviews.Add(new TutorProfileReview
                {
                    Id = Guid.NewGuid(),
                    TutorProfileId = profile.Id,
                    ReviewerUserId = reviewer.Id,
                    FromStatusCode = TutorProfileStatus.PENDING_REVIEW.ToString(),
                    ToStatusCode = TutorProfileStatus.REJECTED.ToString(),
                    Action = "REJECT",
                    ReviewedVersion = profile.Version,
                    Note = item.RejectionNote,
                    ReviewedAt = DateTimeOffset.UtcNow
                });
            }
        }
    }

    private static List<SeedTutorItem> GetDemoTutors() =>
    [
        // ==========================================
        // 4 GIA SƯ TẠI HÀ NỘI
        // ==========================================
        new(
            Email: "tutor.hn.hust@tutormatch.vn",
            FullName: "Nguyễn Hoàng Nam",
            PhoneNumber: "0901234561",
            DateOfBirth: new DateOnly(2003, 4, 12),
            AvatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=256",
            Status: TutorProfileStatus.APPROVED,
            CurrentStep: 6,
            Subjects: ["Toán học", "Tin học / Lập trình", "Vật lý"],
            Languages: ["Tiếng Việt", "Tiếng Anh"],
            TeachingLevels: ["THCS (Lớp 6 - 9)", "THPT (Lớp 10 - 12)", "Luyện thi tốt nghiệp & ĐH"],
            TeachingModes: ["ONLINE", "OFFLINE", "HYBRID"],
            ProvinceCode: "HN",
            DistrictCode: "HN_HBT",
            EducationType: "STUDYING",
            SchoolName: "Đại học Bách Khoa Hà Nội",
            Degree: "Sinh viên năm 4",
            Specialization: "Khoa học Máy tính & Trí tuệ nhân tạo",
            YearOfStudy: 4,
            Bio: "Xin chào! Mình là Hoàng Nam, sinh viên năm 4 ngành Khoa học máy tính ĐHBK Hà Nội. Mình có 3 năm kinh nghiệm kèm môn Toán & Tin học cho học sinh THCS, THPT. Phong cách dạy kiên nhẫn, đi sâu vào bản chất tư duy giải quyết vấn đề.",
            ExperienceYears: 3,
            TeachingMethodology: "Tập trung phân tích bản chất công thức thay vì học vẹt. Hướng dẫn kỹ năng phân tích đề thi và tối ưu hóa thời gian làm bài trắc nghiệm.",
            AchievementsAndResults: "Giải Ba kỳ thi HSG Quốc gia môn Tin học năm 2021; Điểm thi ĐH khối A00 đạt 28.5 điểm; 85% học sinh đạt điểm 8+ môn Toán kỳ thi vào 10.",
            HourlyRateVnd: 200000,
            SessionRateVnd: 400000,
            MonthlyRateVnd: 3200000,
            IsNegotiable: true,
            Certifications: [new() { Name = "Chứng chỉ Tin học Quốc tế MOS", Issuer = "Certiport", IssueYear = 2023, FileUrl = "/uploads/certs/mos.pdf" }],
            AvailabilitySlots: [
                new(1, new TimeOnly(18, 0), new TimeOnly(20, 0)),
                new(3, new TimeOnly(18, 0), new TimeOnly(20, 0)),
                new(5, new TimeOnly(18, 0), new TimeOnly(20, 0))
            ],
            Courses: [
                new("Toán học", "Ôn thi Toán vào 10 chuyên & công lập", "Khóa học 15 buổi củng cố toàn bộ chuyên đề Toán đại số và hình học thi vào 10.", 15, 400000),
                new("Tin học / Lập trình", "Lập trình C++ căn bản cho học sinh THPT", "Lộ trình 10 buổi từ cơ bản đến giải bài toán thuật toán nền tảng.", 10, 400000)
            ]
        ),
        new(
            Email: "tutor.hn.ulis@tutormatch.vn",
            FullName: "Trần Thị Thu Hà",
            PhoneNumber: "0901234562",
            DateOfBirth: new DateOnly(2001, 9, 20),
            AvatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256",
            Status: TutorProfileStatus.APPROVED,
            CurrentStep: 6,
            Subjects: ["Tiếng Anh", "Luyện thi chứng chỉ"],
            Languages: ["Tiếng Việt", "Tiếng Anh"],
            TeachingLevels: ["Tiểu học (Lớp 1 - 5)", "THCS (Lớp 6 - 9)", "Luyện thi vào 10", "Luyện thi tốt nghiệp & ĐH"],
            TeachingModes: ["ONLINE", "OFFLINE"],
            ProvinceCode: "HN",
            DistrictCode: "HN_CG",
            EducationType: "GRADUATED",
            SchoolName: "Trường Đại học Ngoại ngữ - ĐHQG Hà Nội",
            Degree: "Cử nhân Sư phạm Tiếng Anh",
            Specialization: "Sư phạm Tiếng Anh chất lượng cao",
            YearOfStudy: 2023,
            Bio: "Tốt nghiệp Xuất sắc khoa Sư phạm Tiếng Anh ULIS. Mình có 4 năm kinh nghiệm dạy kèm tiếng Anh mọi lứa tuổi và luyện thi chứng chỉ IELTS. Rất mong được đồng hành cùng các bạn học sinh yêu thích tiếng Anh.",
            ExperienceYears: 4,
            TeachingMethodology: "Phương pháp tương tác phản xạ chủ động (Interactive Communicative Approach), kết hợp học qua mindmap và sơ đồ tư duy ngữ pháp giúp nhớ lâu.",
            AchievementsAndResults: "IELTS 8.0 Overall (Listening 8.5, Reading 8.5); Giải Nhì Olympic Tiếng Anh sinh viên toàn quốc; 12 học sinh đạt band điểm IELTS 6.5 - 7.5 trong năm 2024.",
            HourlyRateVnd: 250000,
            SessionRateVnd: 500000,
            MonthlyRateVnd: 4000000,
            IsNegotiable: true,
            Certifications: [new() { Name = "Chứng chỉ IELTS 8.0", Issuer = "IDP Education", IssueYear = 2024, FileUrl = "/uploads/certs/ielts-8.pdf" }],
            AvailabilitySlots: [
                new(2, new TimeOnly(18, 30), new TimeOnly(20, 30)),
                new(4, new TimeOnly(18, 30), new TimeOnly(20, 30)),
                new(6, new TimeOnly(9, 0), new TimeOnly(11, 0))
            ],
            Courses: [
                new("Tiếng Anh", "IELTS Intensive 6.5 - 7.5 Mục tiêu 3 tháng", "Khóa luyện đề chuyên sâu 24 buổi tập trung 4 kỹ năng Nghe - Nói - Đọc - Viết.", 24, 500000)
            ]
        ),
        new(
            Email: "tutor.hn.hnue@tutormatch.vn",
            FullName: "Lê Minh Quang",
            PhoneNumber: "0901234563",
            DateOfBirth: new DateOnly(2003, 11, 5),
            AvatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256",
            Status: TutorProfileStatus.APPROVED,
            CurrentStep: 6,
            Subjects: ["Toán học", "Toán tư duy"],
            Languages: ["Tiếng Việt"],
            TeachingLevels: ["Tiểu học (Lớp 1 - 5)", "THCS (Lớp 6 - 9)", "Luyện thi vào 10"],
            TeachingModes: ["OFFLINE", "HYBRID"],
            ProvinceCode: "HN",
            DistrictCode: "HN_CG",
            EducationType: "STUDYING",
            SchoolName: "Trường Đại học Sư phạm Hà Nội",
            Degree: "Sinh viên năm 3",
            Specialization: "Sư phạm Toán học",
            YearOfStudy: 3,
            Bio: "Sinh viên Sư phạm Toán chính quy HNUE. Với nhiệt huyết của một giáo viên tương lai, mình luôn kiên trì đồng hành cùng học sinh mất gốc hoặc cần bứt phá điểm số thi vào lớp 10 các trường công lập.",
            ExperienceYears: 2,
            TeachingMethodology: "Hệ thống hóa kiến thức từ cơ bản đến nâng cao; xây dựng lộ trình cá nhân hóa dựa trên học lực hiện tại của từng học sinh; rèn luyện thói quen tự học.",
            AchievementsAndResults: "Thủ khoa đầu vào khoa Sư phạm Toán HNUE khóa 71; Đã giúp hơn 15 học sinh từ mức điểm 5-6 tiến bộ lên 8-9 điểm môn Toán thi vào 10.",
            HourlyRateVnd: 180000,
            SessionRateVnd: 360000,
            MonthlyRateVnd: 2800000,
            IsNegotiable: true,
            Certifications: [],
            AvailabilitySlots: [
                new(1, new TimeOnly(19, 0), new TimeOnly(21, 0)),
                new(4, new TimeOnly(19, 0), new TimeOnly(21, 0)),
                new(7, new TimeOnly(14, 0), new TimeOnly(16, 0))
            ],
            Courses: [
                new("Toán học", "Lấy lại căn bản Toán THCS & Rèn tư duy giải toán", "Khóa 12 buổi định hình lại nền tảng kiến thức hình học và đại số cơ bản.", 12, 360000)
            ]
        ),
        new(
            Email: "tutor.hn.neu@tutormatch.vn",
            FullName: "Phạm Quỳnh Anh",
            PhoneNumber: "0901234564",
            DateOfBirth: new DateOnly(2004, 2, 18),
            AvatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=256",
            Status: TutorProfileStatus.APPROVED,
            CurrentStep: 6,
            Subjects: ["Toán học", "Tiếng Anh", "Ngữ văn"],
            Languages: ["Tiếng Việt", "Tiếng Anh"],
            TeachingLevels: ["Tiểu học (Lớp 1 - 5)", "THCS (Lớp 6 - 9)"],
            TeachingModes: ["ONLINE", "OFFLINE"],
            ProvinceCode: "HN",
            DistrictCode: "HN_HBT",
            EducationType: "STUDYING",
            SchoolName: "Trường Đại học Kinh tế Quốc dân",
            Degree: "Sinh viên năm 2",
            Specialization: "Kinh tế Quốc tế (Chương trình Tiên tiến)",
            YearOfStudy: 2,
            Bio: "Sinh viên chương trình tiên tiến NEU, có năng khiếu sư phạm, tính cách vui vẻ, tâm lý và kiên nhẫn. Rất thích hợp dạy các bé tiểu học và cấp 2 rèn luyện nền tảng môn Toán và Tiếng Anh.",
            ExperienceYears: 2,
            TeachingMethodology: "Dạy học qua hình ảnh trực quan, tạo không khí học tập tích cực, không gây áp lực, giúp các em hào hứng và yêu thích việc học mỗi ngày.",
            AchievementsAndResults: "IELTS 7.5; Điểm thi tốt nghiệp THPT khối D01 đạt 27.8 điểm; 100% phụ huynh đánh giá tích cực sau khóa học hè.",
            HourlyRateVnd: 150000,
            SessionRateVnd: 300000,
            MonthlyRateVnd: 2400000,
            IsNegotiable: true,
            Certifications: [new() { Name = "IELTS 7.5", Issuer = "British Council", IssueYear = 2023, FileUrl = "/uploads/certs/ielts-75.pdf" }],
            AvailabilitySlots: [
                new(3, new TimeOnly(18, 0), new TimeOnly(20, 0)),
                new(5, new TimeOnly(18, 0), new TimeOnly(20, 0)),
                new(7, new TimeOnly(9, 0), new TimeOnly(11, 0))
            ],
            Courses: [
                new("Tiếng Anh", "Tiếng Anh & Toán tư duy cho học sinh Tiểu học", "Khóa 10 buổi tạo nền tảng từ vựng, ngữ âm và tư duy logic cho học sinh tiểu học.", 10, 300000)
            ]
        ),

        // ==========================================
        // 4 GIA SƯ TẠI ĐÀ NẴNG
        // ==========================================
        new(
            Email: "tutor.dn.dut@tutormatch.vn",
            FullName: "Đặng Văn Hùng",
            PhoneNumber: "0901234565",
            DateOfBirth: new DateOnly(2002, 8, 30),
            AvatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256",
            Status: TutorProfileStatus.APPROVED,
            CurrentStep: 6,
            Subjects: ["Vật lý", "Toán học"],
            Languages: ["Tiếng Việt"],
            TeachingLevels: ["THPT (Lớp 10 - 12)", "Luyện thi tốt nghiệp & ĐH"],
            TeachingModes: ["ONLINE", "OFFLINE"],
            ProvinceCode: "DN",
            DistrictCode: "DN_LK",
            EducationType: "STUDYING",
            SchoolName: "Trường Đại học Bách Khoa - Đại học Đà Nẵng",
            Degree: "Sinh viên năm 4",
            Specialization: "Kỹ thuật Điều khiển & Tự động hóa",
            YearOfStudy: 4,
            Bio: "Sinh viên năm cuối ĐH Bách Khoa Đà Nẵng. Đam mê môn Vật lý và phương pháp tư duy định lượng. Chuyên luyện thi Vật lý 10, 11, 12 và ôn thi THPT Quốc gia tại khu vực Đà Nẵng.",
            ExperienceYears: 3,
            TeachingMethodology: "Học Vật lý thông qua hiện tượng thực tế, giải thích cơ chế rõ ràng, trang bị kỹ năng giải nhanh bằng máy tính cầm tay và mẹo nhận biết bẫy đề thi.",
            AchievementsAndResults: "Điểm thi THPT Quốc gia môn Vật lý đạt 9.75 điểm; Kèm nhiều học sinh trường THPT Phan Châu Trinh, Hoàng Hoa Thám đạt 8.5+ môn Lý.",
            HourlyRateVnd: 170000,
            SessionRateVnd: 340000,
            MonthlyRateVnd: 2700000,
            IsNegotiable: true,
            Certifications: [],
            AvailabilitySlots: [
                new(1, new TimeOnly(18, 30), new TimeOnly(20, 30)),
                new(5, new TimeOnly(18, 30), new TimeOnly(20, 30)),
                new(6, new TimeOnly(15, 0), new TimeOnly(17, 0))
            ],
            Courses: [
                new("Vật lý", "Luyện thi Vật lý 12 & THPT Quốc gia theo chuyên đề", "Khóa 18 buổi nắm chắc 8+ điểm các phần Dao động, Sóng, Điện xoay chiều.", 18, 340000)
            ]
        ),
        new(
            Email: "tutor.dn.ued@tutormatch.vn",
            FullName: "Ngô Thảo Nguyên",
            PhoneNumber: "0901234566",
            DateOfBirth: new DateOnly(2000, 6, 14),
            AvatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256",
            Status: TutorProfileStatus.APPROVED,
            CurrentStep: 6,
            Subjects: ["Ngữ văn", "Rèn chữ đẹp"],
            Languages: ["Tiếng Việt"],
            TeachingLevels: ["Tiểu học (Lớp 1 - 5)", "THCS (Lớp 6 - 9)", "Luyện thi vào 10"],
            TeachingModes: ["OFFLINE"],
            ProvinceCode: "DN",
            DistrictCode: "DN_CL",
            EducationType: "GRADUATED",
            SchoolName: "Trường Đại học Sư phạm - Đại học Đà Nẵng",
            Degree: "Cử nhân Sư phạm Ngữ văn",
            Specialization: "Sư phạm Ngữ văn",
            YearOfStudy: 2022,
            Bio: "Đã tốt nghiệp cử nhân Sư phạm Ngữ văn UED. Đang công tác tại trường THCS tư thục tại Đà Nẵng. Phong cách giảng bài truyền cảm hứng, rèn luyện kỹ năng viết văn mạch lạc, cảm xúc và đúng cấu trúc chấm thi.",
            ExperienceYears: 4,
            TeachingMethodology: "Dạy cách lập dàn ý logic, mở bài và kết bài ấn tượng; cung cấp ngân hàng dẫn chứng thực tế giúp bài văn sinh động và thuyết phục giám khảo.",
            AchievementsAndResults: "Cử nhân Xuất sắc; Giải Nhất Nghiệp vụ Sư phạm cấp Trường; Hướng dẫn nhiều em học sinh đỗ vào trường THPT Chuyên Lê Quý Đôn Đà Nẵng.",
            HourlyRateVnd: 180000,
            SessionRateVnd: 360000,
            MonthlyRateVnd: 2800000,
            IsNegotiable: true,
            Certifications: [new() { Name = "Chứng chỉ Nghiệp vụ Sư phạm Xuất sắc", Issuer = "Đại học Đà Nẵng", IssueYear = 2022, FileUrl = "/uploads/certs/pedagogy.pdf" }],
            AvailabilitySlots: [
                new(2, new TimeOnly(18, 0), new TimeOnly(20, 0)),
                new(4, new TimeOnly(18, 0), new TimeOnly(20, 0)),
                new(7, new TimeOnly(8, 30), new TimeOnly(10, 30))
            ],
            Courses: [
                new("Ngữ văn", "Bí quyết viết văn nghị luận xã hội & văn học điểm 8+", "Khóa 10 buổi chuyên sâu kỹ năng lập dàn ý và đưa dẫn chứng thực tế thuyết phục.", 10, 360000)
            ]
        ),
        new(
            Email: "tutor.dn.ufl@tutormatch.vn",
            FullName: "Võ Nhật Huy",
            PhoneNumber: "0901234567",
            DateOfBirth: new DateOnly(2003, 1, 25),
            AvatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=256",
            Status: TutorProfileStatus.APPROVED,
            CurrentStep: 6,
            Subjects: ["Tiếng Nhật", "Tiếng Anh"],
            Languages: ["Tiếng Việt", "Tiếng Nhật", "Tiếng Anh"],
            TeachingLevels: ["Sinh viên đại học", "Người đi làm", "THPT (Lớp 10 - 12)"],
            TeachingModes: ["ONLINE", "HYBRID"],
            ProvinceCode: "DN",
            DistrictCode: "DN_HC",
            EducationType: "STUDYING",
            SchoolName: "Trường Đại học Ngoại ngữ - Đại học Đà Nẵng",
            Degree: "Sinh viên năm 3",
            Specialization: "Ngôn ngữ Nhật & Văn hóa Nhật Bản",
            YearOfStudy: 3,
            Bio: "Sinh viên khoa Tiếng Nhật UFL. Sở hữu chứng chỉ JLPT N2 và TOEIC 860. Có kinh nghiệm dạy kèm cho cả người mới bắt đầu từ bảng chữ cái đến luyện thi N4, N3 du học hoặc làm việc tại các doanh nghiệp Nhật.",
            ExperienceYears: 2,
            TeachingMethodology: "Tập trung sửa phát âm chuẩn Tokyo ngay từ đầu, học Kanji theo câu chuyện hình ảnh, rèn luyện ngữ cảnh giao tiếp thực tế nơi công sở.",
            AchievementsAndResults: "Chứng chỉ JLPT N2 (142/180 điểm); TOEIC 860 điểm; Kèm hơn 20 học viên đỗ JLPT N4, N3 trong năm 2024.",
            HourlyRateVnd: 200000,
            SessionRateVnd: 400000,
            MonthlyRateVnd: 3200000,
            IsNegotiable: true,
            Certifications: [new() { Name = "Chứng chỉ JLPT N2", Issuer = "Japan Foundation", IssueYear = 2023, FileUrl = "/uploads/certs/jlpt-n2.pdf" }],
            AvailabilitySlots: [
                new(1, new TimeOnly(19, 30), new TimeOnly(21, 30)),
                new(3, new TimeOnly(19, 30), new TimeOnly(21, 30)),
                new(5, new TimeOnly(19, 30), new TimeOnly(21, 30))
            ],
            Courses: [
                new("Tiếng Nhật", "Tiếng Nhật N4 cấp tốc & Giao tiếp phản xạ", "Lộ trình 20 buổi tổng hợp toàn bộ 300 chữ Hán và ngữ pháp N4 cơ bản.", 20, 400000)
            ]
        ),
        new(
            Email: "tutor.dn.due@tutormatch.vn",
            FullName: "Bùi Gia Bảo",
            PhoneNumber: "0901234568",
            DateOfBirth: new DateOnly(2004, 7, 19),
            AvatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=256",
            Status: TutorProfileStatus.APPROVED,
            CurrentStep: 6,
            Subjects: ["Toán học", "Hóa học"],
            Languages: ["Tiếng Việt"],
            TeachingLevels: ["THCS (Lớp 6 - 9)", "THPT (Lớp 10 - 12)"],
            TeachingModes: ["ONLINE", "OFFLINE"],
            ProvinceCode: "DN",
            DistrictCode: "DN_NHS",
            EducationType: "STUDYING",
            SchoolName: "Trường Đại học Kinh tế - Đại học Đà Nẵng",
            Degree: "Sinh viên năm 2",
            Specialization: "Tài chính - Ngân hàng",
            YearOfStudy: 2,
            Bio: "Gia sư môn Toán và Hóa tại khu vực Ngũ Hành Sơn & Hải Châu, Đà Nẵng. Từng là học sinh chuyên Hóa, có kỹ năng tổng hợp và sơ đồ hóa phương trình phản ứng dễ nhớ, giúp học sinh không còn sợ môn Hóa.",
            ExperienceYears: 2,
            TeachingMethodology: "Học Hóa qua bản chất liên kết phân tử và bảng tuần hoàn; phương pháp bảo toàn khối lượng/nguyên tố giải nhanh bài toán định lượng.",
            AchievementsAndResults: "Giải Ba kỳ thi HSG Hóa học cấp Tỉnh năm 2022; Điểm thi THPT môn Hóa đạt 9.5, môn Toán 9.0; Kèm nhiều học sinh bứt phá học lực khá lên giỏi.",
            HourlyRateVnd: 160000,
            SessionRateVnd: 320000,
            MonthlyRateVnd: 2500000,
            IsNegotiable: true,
            Certifications: [],
            AvailabilitySlots: [
                new(2, new TimeOnly(18, 0), new TimeOnly(20, 0)),
                new(6, new TimeOnly(14, 0), new TimeOnly(16, 0))
            ],
            Courses: [
                new("Hóa học", "Hóa học THCS - Xóa mất gốc & Nắm vững phương trình", "Khóa 12 buổi lấy lại nền tảng môn Hóa từ định luật bảo toàn khối lượng.", 12, 320000)
            ]
        ),

        // ==========================================
        // 2 GIA SƯ TẠI TP. HỒ CHÍ MINH
        // ==========================================
        new(
            Email: "tutor.hcm.hcmut@tutormatch.vn",
            FullName: "Huỳnh Quốc Bảo",
            PhoneNumber: "0901234569",
            DateOfBirth: new DateOnly(2000, 12, 8),
            AvatarUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=256",
            Status: TutorProfileStatus.APPROVED,
            CurrentStep: 6,
            Subjects: ["Toán học", "Tin học / Lập trình", "Vật lý"],
            Languages: ["Tiếng Việt", "Tiếng Anh"],
            TeachingLevels: ["THPT (Lớp 10 - 12)", "Luyện thi tốt nghiệp & ĐH", "Sinh viên đại học"],
            TeachingModes: ["ONLINE", "OFFLINE", "HYBRID"],
            ProvinceCode: "HCM",
            DistrictCode: "HCM_Q10",
            EducationType: "GRADUATED",
            SchoolName: "Trường Đại học Bách Khoa - ĐHQG TP.HCM",
            Degree: "Kỹ sư Khoa học Máy tính",
            Specialization: "Kỹ thuật Phần mềm",
            YearOfStudy: 2022,
            Bio: "Tốt nghiệp Kỹ sư phần mềm Đại học Bách Khoa TP.HCM (HCMUT). Có 4 năm kinh nghiệm làm gia sư Toán & Lập trình (C++, Python, Web) cho học sinh cấp 3 và sinh viên đại học năm 1-2.",
            ExperienceYears: 4,
            TeachingMethodology: "Tư duy thuật toán và mô hình hóa bài toán thực tế. Rèn luyện tư duy phản biện và khả năng tự nghiên cứu tài liệu kỹ thuật.",
            AchievementsAndResults: "Học bổng Odon Vallet; Top 5 cuộc thi Olympic Tin học sinh viên; Hướng dẫn nhiều học sinh đạt giải Tin học trẻ và điểm 9+ môn Toán đại học.",
            HourlyRateVnd: 250000,
            SessionRateVnd: 500000,
            MonthlyRateVnd: 4000000,
            IsNegotiable: true,
            Certifications: [new() { Name = "AWS Certified Solutions Architect", Issuer = "Amazon Web Services", IssueYear = 2023, FileUrl = "/uploads/certs/aws.pdf" }],
            AvailabilitySlots: [
                new(1, new TimeOnly(18, 30), new TimeOnly(20, 30)),
                new(3, new TimeOnly(18, 30), new TimeOnly(20, 30)),
                new(7, new TimeOnly(15, 0), new TimeOnly(17, 0))
            ],
            Courses: [
                new("Toán học", "Toán cao cấp & Xác suất thống kê đại học", "Khóa 10 buổi chuyên đề Đại số tuyến tính, Vi tích phân và Xác suất cho sinh viên năm 1-2.", 10, 500000)
            ]
        ),
        new(
            Email: "tutor.hcm.hcmue@tutormatch.vn",
            FullName: "Trương Mai Lan",
            PhoneNumber: "0901234570",
            DateOfBirth: new DateOnly(2002, 3, 17),
            AvatarUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=256",
            Status: TutorProfileStatus.APPROVED,
            CurrentStep: 6,
            Subjects: ["Hóa học", "Sinh học"],
            Languages: ["Tiếng Việt"],
            TeachingLevels: ["THCS (Lớp 6 - 9)", "THPT (Lớp 10 - 12)", "Luyện thi tốt nghiệp & ĐH"],
            TeachingModes: ["OFFLINE", "HYBRID"],
            ProvinceCode: "HCM",
            DistrictCode: "HCM_Q5",
            EducationType: "STUDYING",
            SchoolName: "Trường Đại học Sư phạm TP.HCM",
            Degree: "Sinh viên năm 4",
            Specialization: "Sư phạm Hóa học",
            YearOfStudy: 4,
            Bio: "Sinh viên năm cuối khoa Hóa trường ĐH Sư phạm TP.HCM. Có kỹ năng sư phạm tốt, tận tâm và thấu hiểu tâm lý học sinh. Chuyên kèm môn Hóa khối A00, B00 và ôn thi tốt nghiệp THPT Quốc gia.",
            ExperienceYears: 3,
            TeachingMethodology: "Hệ thống hóa kiến thức bằng mindmap logic, phân loại các dạng bài tập điển hình, luyện giải đề thi thử sát với cấu trúc đề của Bộ GD&ĐT.",
            AchievementsAndResults: "Điểm rèn luyện Xuất sắc toàn khóa; Điểm thi ĐH môn Hóa đạt 9.75; Hơn 90% học sinh đạt mục tiêu từ 8.0 trở lên trong kỳ thi tốt nghiệp 2024.",
            HourlyRateVnd: 220000,
            SessionRateVnd: 440000,
            MonthlyRateVnd: 3500000,
            IsNegotiable: true,
            Certifications: [new() { Name = "Chứng nhận Nghiệp vụ Sư phạm Loại Giỏi", Issuer = "ĐH Sư phạm TP.HCM", IssueYear = 2024, FileUrl = "/uploads/certs/hcmue.pdf" }],
            AvailabilitySlots: [
                new(2, new TimeOnly(18, 0), new TimeOnly(20, 0)),
                new(4, new TimeOnly(18, 0), new TimeOnly(20, 0)),
                new(6, new TimeOnly(9, 0), new TimeOnly(11, 0))
            ],
            Courses: [
                new("Hóa học", "Hóa học 10, 11, 12 - Chuyên đề bồi dưỡng điểm 9+", "Khóa 16 buổi chuyên sâu hóa hữu cơ và vô cơ phục vụ kỳ thi tốt nghiệp THPT.", 16, 440000)
            ]
        ),

        // =========================================================================
        // 10 GIA SƯ MỚI: CHIA THEO ĐẦY ĐỦ HỒ SƠ & THIẾU CÁC TRƯỜNG THỰC TẾ
        // =========================================================================

        // [Trường hợp 1]: Đầy đủ hồ sơ - APPROVED - Ngoại thương & Tiếng Anh/Chứng chỉ
        new(
            Email: "tutor.hn.ftu@tutormatch.vn",
            FullName: "Hoàng Thu Trang",
            PhoneNumber: "0901234571",
            DateOfBirth: new DateOnly(2001, 5, 15),
            AvatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256",
            Status: TutorProfileStatus.APPROVED,
            CurrentStep: 6,
            Subjects: ["Tiếng Anh", "Luyện thi chứng chỉ"],
            Languages: ["Tiếng Việt", "Tiếng Anh"],
            TeachingLevels: ["THPT (Lớp 10 - 12)", "Sinh viên đại học", "Luyện thi tốt nghiệp & ĐH"],
            TeachingModes: ["ONLINE", "OFFLINE", "HYBRID"],
            ProvinceCode: "HN",
            DistrictCode: "HN_DD",
            EducationType: "GRADUATED",
            SchoolName: "Trường Đại học Ngoại thương Hà Nội",
            Degree: "Cử nhân Kinh tế đối ngoại",
            Specialization: "Kinh tế đối ngoại chất lượng cao",
            YearOfStudy: 2023,
            Bio: "Tốt nghiệp Xuất sắc ĐH Ngoại thương, đạt 8.0 IELTS. Có 3 năm kinh nghiệm kèm tiếng Anh giao tiếp và luyện thi chứng chỉ cho học sinh THPT và sinh viên.",
            ExperienceYears: 3,
            TeachingMethodology: "Tập trung xây dựng phản xạ giao tiếp tự nhiên và phân tích cấu trúc bài thi chuẩn quốc tế.",
            AchievementsAndResults: "IELTS 8.0 Overall; Thủ khoa đầu ra chuyên ngành Kinh tế đối ngoại 2023; 15 học sinh đạt IELTS 6.5+ sau 4 tháng kèm.",
            HourlyRateVnd: 250000,
            SessionRateVnd: 500000,
            MonthlyRateVnd: 4000000,
            IsNegotiable: true,
            Certifications: [new() { Name = "IELTS 8.0 Academic", Issuer = "IDP Education", IssueYear = 2023, FileUrl = "/uploads/certs/ielts-8-trang.pdf" }],
            AvailabilitySlots: [
                new(1, new TimeOnly(18, 30), new TimeOnly(20, 30)),
                new(3, new TimeOnly(18, 30), new TimeOnly(20, 30)),
                new(5, new TimeOnly(18, 30), new TimeOnly(20, 30))
            ],
            Courses: [
                new("Tiếng Anh", "IELTS Speaking & Writing bứt phá band 7.0+", "Khóa học 16 buổi sửa bài chi tiết 1-1 và rèn phản xạ phòng thi thực chiến.", 16, 500000)
            ]
        ),

        // [Trường hợp 2]: Đầy đủ hồ sơ - APPROVED - KHTN TP.HCM & Toán / Lập trình
        new(
            Email: "tutor.hcm.hcmus@tutormatch.vn",
            FullName: "Nguyễn Thanh Tùng",
            PhoneNumber: "0901234572",
            DateOfBirth: new DateOnly(2002, 11, 20),
            AvatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256",
            Status: TutorProfileStatus.APPROVED,
            CurrentStep: 6,
            Subjects: ["Toán học", "Tin học / Lập trình"],
            Languages: ["Tiếng Việt", "Tiếng Anh"],
            TeachingLevels: ["THCS (Lớp 6 - 9)", "THPT (Lớp 10 - 12)", "Luyện thi vào 10"],
            TeachingModes: ["ONLINE", "OFFLINE"],
            ProvinceCode: "HCM",
            DistrictCode: "HCM_Q5",
            EducationType: "STUDYING",
            SchoolName: "Trường Đại học Khoa học Tự nhiên - ĐHQG TP.HCM",
            Degree: "Sinh viên năm 4",
            Specialization: "Khoa học Dữ liệu & Trí tuệ nhân tạo",
            YearOfStudy: 4,
            Bio: "Sinh viên năm 4 ĐH Khoa học Tự nhiên TP.HCM. Đam mê Toán ứng dụng và thuật toán lập trình. Chuyên kèm môn Toán cấp 2 và ôn thi chuyên Tin, chuyên Toán.",
            ExperienceYears: 3,
            TeachingMethodology: "Giảng giải bản chất logic đằng sau mỗi công thức và hướng dẫn học sinh vẽ sơ đồ thuật toán để giải quyết vấn đề.",
            AchievementsAndResults: "Giải Nhì Olympic Toán sinh viên toàn quốc; Top 10 Hackathon HCMUS 2023; 100% học sinh kèm môn Toán đỗ nguyện vọng 1 vào lớp 10.",
            HourlyRateVnd: 220000,
            SessionRateVnd: 440000,
            MonthlyRateVnd: 3500000,
            IsNegotiable: true,
            Certifications: [new() { Name = "Python Certified Associate Programmer", Issuer = "Python Institute", IssueYear = 2023, FileUrl = "/uploads/certs/pcap.pdf" }],
            AvailabilitySlots: [
                new(2, new TimeOnly(19, 0), new TimeOnly(21, 0)),
                new(4, new TimeOnly(19, 0), new TimeOnly(21, 0)),
                new(7, new TimeOnly(14, 0), new TimeOnly(16, 0))
            ],
            Courses: [
                new("Toán học", "Toán 9 ôn thi vào 10 chuyên & công lập", "Khóa 15 buổi bao phủ toàn bộ dạng bài phương trình bậc hai, hệ phương trình và hình học phẳng.", 15, 440000)
            ]
        ),

        // [Trường hợp 3]: Đầy đủ hồ sơ - APPROVED - Thạc sĩ Vật lý Đà Nẵng
        new(
            Email: "tutor.dn.udn@tutormatch.vn",
            FullName: "Phan Minh Khang",
            PhoneNumber: "0901234573",
            DateOfBirth: new DateOnly(1998, 4, 10),
            AvatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=256",
            Status: TutorProfileStatus.APPROVED,
            CurrentStep: 6,
            Subjects: ["Vật lý", "Toán học"],
            Languages: ["Tiếng Việt"],
            TeachingLevels: ["THPT (Lớp 10 - 12)", "Luyện thi tốt nghiệp & ĐH"],
            TeachingModes: ["OFFLINE", "HYBRID"],
            ProvinceCode: "DN",
            DistrictCode: "DN_HC",
            EducationType: "GRADUATED",
            SchoolName: "Trường Đại học Bách Khoa - Đại học Đà Nẵng",
            Degree: "Thạc sĩ Kỹ thuật Điều khiển & Tự động hóa",
            Specialization: "Tự động hóa công nghiệp",
            YearOfStudy: 2023,
            Bio: "Thạc sĩ tốt nghiệp ĐHBK Đà Nẵng, có hơn 5 năm kinh nghiệm giảng dạy và kèm cặp môn Vật lý cho các em học sinh lớp 10, 11, 12 định hướng khối A00, A01.",
            ExperienceYears: 5,
            TeachingMethodology: "Hệ thống hóa bài tập từ trực quan vật lý tới định lượng toán học; rèn kỹ năng bấm máy tính giải trắc nghiệm tốc độ cao.",
            AchievementsAndResults: "Tốt nghiệp Thạc sĩ loại Giỏi; có học sinh đạt 9.8 điểm môn Lý kỳ thi THPT Quốc gia 2024.",
            HourlyRateVnd: 260000,
            SessionRateVnd: 520000,
            MonthlyRateVnd: 4200000,
            IsNegotiable: true,
            Certifications: [new() { Name = "Chứng chỉ Phương pháp Giảng dạy Đại học", Issuer = "ĐH Sư phạm ĐN", IssueYear = 2022, FileUrl = "/uploads/certs/pedagogy-udn.pdf" }],
            AvailabilitySlots: [
                new(6, new TimeOnly(8, 30), new TimeOnly(11, 30)),
                new(7, new TimeOnly(14, 0), new TimeOnly(17, 0))
            ],
            Courses: [
                new("Vật lý", "Tổng ôn Vật lý 12 & Chinh phục điểm 9+ ĐH", "Khóa học 20 buổi tổng ôn các chuyên đề khó: Sóng ánh sáng, Hạt nhân và Dao động cơ nâng cao.", 20, 520000)
            ]
        ),

        // [Trường hợp 4]: Đầy đủ hồ sơ - PENDING_REVIEW - Cử nhân Sư phạm Văn mới nộp hồ sơ chờ duyệt
        new(
            Email: "tutor.pending.full@tutormatch.vn",
            FullName: "Đỗ Thùy Linh",
            PhoneNumber: "0901234574",
            DateOfBirth: new DateOnly(2002, 9, 12),
            AvatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256",
            Status: TutorProfileStatus.PENDING_REVIEW,
            CurrentStep: 6,
            Subjects: ["Ngữ văn"],
            Languages: ["Tiếng Việt"],
            TeachingLevels: ["Tiểu học (Lớp 1 - 5)", "THCS (Lớp 6 - 9)", "Luyện thi vào 10"],
            TeachingModes: ["ONLINE", "OFFLINE"],
            ProvinceCode: "HN",
            DistrictCode: "HN_DD",
            EducationType: "GRADUATED",
            SchoolName: "Trường Đại học Sư phạm Hà Nội",
            Degree: "Cử nhân Sư phạm Ngữ văn",
            Specialization: "Sư phạm Văn chất lượng cao",
            YearOfStudy: 2024,
            Bio: "Cử nhân Sư phạm Ngữ văn mới tốt nghiệp xuất sắc. Đam mê văn học và muốn truyền cảm hứng cảm thụ văn chương, giúp học sinh viết bài giàu cảm xúc và mạch lạc.",
            ExperienceYears: 2,
            TeachingMethodology: "Học văn thông qua cảm nhận đa giác quan và sơ đồ luận điểm, giúp học sinh thoát khỏi văn mẫu.",
            AchievementsAndResults: "Cử nhân Xuất sắc; Giải Nhất sinh viên NCKH cấp Trường đề tài Đổi mới dạy học Ngữ văn 2023.",
            HourlyRateVnd: 180000,
            SessionRateVnd: 360000,
            MonthlyRateVnd: 2800000,
            IsNegotiable: true,
            Certifications: [new() { Name = "Nghiệp vụ Sư phạm Xuất sắc", Issuer = "ĐH Sư phạm Hà Nội", IssueYear = 2024, FileUrl = "/uploads/certs/hnue-cert.pdf" }],
            AvailabilitySlots: [
                new(1, new TimeOnly(18, 0), new TimeOnly(20, 0)),
                new(4, new TimeOnly(18, 0), new TimeOnly(20, 0))
            ],
            Courses: [
                new("Ngữ văn", "Nghị luận văn học lớp 9 vào 10 - Tự tin đạt 8+", "Khóa học 12 buổi rèn luyện kỹ năng phân tích tác phẩm truyện và thơ hiện đại.", 12, 360000)
            ]
        ),

        // [Trường hợp 5]: APPROVED - THIẾU CHỨNG CHỈ (HasCertifications = false, Certifications = [])
        new(
            Email: "tutor.dn.nocert@tutormatch.vn",
            FullName: "Trần Quang Huy",
            PhoneNumber: "0901234575",
            DateOfBirth: new DateOnly(2003, 3, 25),
            AvatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256",
            Status: TutorProfileStatus.APPROVED,
            CurrentStep: 6,
            Subjects: ["Toán học", "Vật lý"],
            Languages: ["Tiếng Việt"],
            TeachingLevels: ["THCS (Lớp 6 - 9)"],
            TeachingModes: ["OFFLINE"],
            ProvinceCode: "DN",
            DistrictCode: "DN_TK",
            EducationType: "STUDYING",
            SchoolName: "Trường Đại học Bách Khoa - Đại học Đà Nẵng",
            Degree: "Sinh viên năm 3",
            Specialization: "Kỹ thuật Cơ khí",
            YearOfStudy: 3,
            Bio: "Sinh viên năm 3 ĐH Bách Khoa Đà Nẵng. Không thi các chứng chỉ quốc tế đắt tiền nhưng kiến thức môn Toán Lý rất vững và giảng bài bình dị, gần gũi với các em.",
            ExperienceYears: 2,
            TeachingMethodology: "Lấy ví dụ đơn giản từ đời sống, kiên nhẫn giảng đi giảng lại cho đến khi học sinh hiểu bản chất.",
            AchievementsAndResults: "Điểm thi đại học khối A00 đạt 27.25 điểm (Toán 9.2, Lý 9.0); Kèm nhiều em học sinh từ trung bình lên học sinh giỏi lớp 8, lớp 9.",
            HourlyRateVnd: 150000,
            SessionRateVnd: 300000,
            MonthlyRateVnd: 2400000,
            IsNegotiable: true,
            Certifications: [],
            AvailabilitySlots: [
                new(2, new TimeOnly(18, 30), new TimeOnly(20, 30)),
                new(6, new TimeOnly(18, 30), new TimeOnly(20, 30))
            ]
        ),

        // [Trường hợp 6]: APPROVED - CHỈ DẠY ONLINE, THIẾU ĐỊA CHỈ KHU VỰC (ProvinceCode = null, DistrictCode = null)
        new(
            Email: "tutor.onlineonly.nolocation@tutormatch.vn",
            FullName: "Vũ Mai Hương",
            PhoneNumber: "0901234576",
            DateOfBirth: new DateOnly(1999, 8, 14),
            AvatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256",
            Status: TutorProfileStatus.APPROVED,
            CurrentStep: 6,
            Subjects: ["Tiếng Anh", "Luyện thi chứng chỉ"],
            Languages: ["Tiếng Việt", "Tiếng Anh"],
            TeachingLevels: ["THPT (Lớp 10 - 12)", "Sinh viên đại học"],
            TeachingModes: ["ONLINE"],
            ProvinceCode: null,
            DistrictCode: null,
            EducationType: "GRADUATED",
            SchoolName: "Trường Đại học Hà Nội (HANU)",
            Degree: "Cử nhân Ngôn ngữ Anh",
            Specialization: "Biên phiên dịch Tiếng Anh",
            YearOfStudy: 2021,
            Bio: "Giáo viên tiếng Anh tự do dạy 100% online qua Zoom/Google Meet trên toàn quốc. Đầy đủ trang thiết bị bảng vẽ điện tử, micro chuyên nghiệp và học liệu tương tác số hóa.",
            ExperienceYears: 4,
            TeachingMethodology: "Học qua ứng dụng tương tác số, tài liệu Cambridge chính thống, sửa lỗi phát âm và viết bài 1-1 qua Google Docs.",
            AchievementsAndResults: "IELTS 8.5 (Listening 9.0, Reading 9.0); Đào tạo hơn 40 học viên đạt band 7.0+ qua hình thức học online từ khắp các tỉnh thành.",
            HourlyRateVnd: 300000,
            SessionRateVnd: 600000,
            MonthlyRateVnd: 4800000,
            IsNegotiable: false,
            Certifications: [new() { Name = "IELTS 8.5 Overall", Issuer = "British Council", IssueYear = 2023, FileUrl = "/uploads/certs/ielts-85.pdf" }],
            AvailabilitySlots: [
                new(1, new TimeOnly(19, 0), new TimeOnly(21, 0)),
                new(3, new TimeOnly(19, 0), new TimeOnly(21, 0)),
                new(5, new TimeOnly(19, 0), new TimeOnly(21, 0))
            ],
            Courses: [
                new("Tiếng Anh", "IELTS Writing Masterclass Online 1-1", "Khóa huấn luyện viết Task 1 & Task 2 chuyên sâu trực tuyến cho mục tiêu 7.5+.", 12, 600000)
            ]
        ),

        // [Trường hợp 7]: APPROVED - GIA SƯ KỸ NĂNG, THIẾU BẰNG ĐẠI HỌC CHÍNH QUY (NO_DEGREE, SchoolName = null)
        new(
            Email: "tutor.nodegree.selftaught@tutormatch.vn",
            FullName: "Lê Tuấn Kiệt",
            PhoneNumber: "0901234577",
            DateOfBirth: new DateOnly(1997, 12, 5),
            AvatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=256",
            Status: TutorProfileStatus.APPROVED,
            CurrentStep: 6,
            Subjects: ["Tin học / Lập trình"],
            Languages: ["Tiếng Việt", "Tiếng Anh"],
            TeachingLevels: ["THPT (Lớp 10 - 12)", "Sinh viên đại học"],
            TeachingModes: ["ONLINE", "OFFLINE"],
            ProvinceCode: "HCM",
            DistrictCode: "HCM_TB",
            EducationType: "NO_DEGREE",
            SchoolName: null,
            Degree: null,
            Specialization: "Tự nghiên cứu & 6 năm kinh nghiệm Senior Fullstack Developer",
            YearOfStudy: null,
            Bio: "Lập trình viên thực chiến với 6 năm kinh nghiệm tại các công ty công nghệ lớn. Không có bằng đại học chính quy về sư phạm nhưng có kỹ năng lập trình sâu rộng và phương pháp thực hành trực tiếp.",
            ExperienceYears: 6,
            TeachingMethodology: "Học lập trình qua dự án thực tế (Project-based learning); code trực tiếp, review pull request và debug lỗi như môi trường doanh nghiệp.",
            AchievementsAndResults: "Tech Lead dự án Fintech; hướng dẫn thành công nhiều bạn sinh viên trái ngành chuyển nghề sang IT có việc làm.",
            HourlyRateVnd: 300000,
            SessionRateVnd: 600000,
            MonthlyRateVnd: 4500000,
            IsNegotiable: true,
            Certifications: [new() { Name = "AWS Certified Solutions Architect", Issuer = "Amazon Web Services", IssueYear = 2022, FileUrl = "/uploads/certs/aws-kiet.pdf" }],
            AvailabilitySlots: [
                new(6, new TimeOnly(9, 0), new TimeOnly(11, 0)),
                new(7, new TimeOnly(9, 0), new TimeOnly(11, 0))
            ]
        ),

        // [Trường hợp 8]: DRAFT - HỒ SƠ DANG DỞ BƯỚC 2 (Thiếu học vấn, chứng chỉ, bio, giá cả)
        new(
            Email: "tutor.draft.step2@tutormatch.vn",
            FullName: "Ngô Bích Trâm",
            PhoneNumber: "0901234578",
            DateOfBirth: new DateOnly(2004, 6, 18),
            AvatarUrl: null,
            Status: TutorProfileStatus.DRAFT,
            CurrentStep: 2,
            Subjects: ["Toán học", "Hóa học"],
            Languages: ["Tiếng Việt"],
            TeachingLevels: ["THCS (Lớp 6 - 9)"],
            TeachingModes: [],
            ProvinceCode: null,
            DistrictCode: null,
            EducationType: null,
            SchoolName: null,
            Degree: null,
            Specialization: null,
            YearOfStudy: null,
            Bio: null,
            ExperienceYears: null,
            TeachingMethodology: null,
            AchievementsAndResults: null,
            HourlyRateVnd: null,
            SessionRateVnd: null,
            MonthlyRateVnd: null,
            IsNegotiable: true,
            Certifications: []
        ),

        // [Trường hợp 9]: DRAFT - HỒ SƠ DANG DỞ BƯỚC 4 (Có học vấn nhưng thiếu Bio, phương pháp, học phí)
        new(
            Email: "tutor.draft.step4@tutormatch.vn",
            FullName: "Lâm Quốc Thái",
            PhoneNumber: "0901234579",
            DateOfBirth: new DateOnly(2003, 10, 30),
            AvatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=256",
            Status: TutorProfileStatus.DRAFT,
            CurrentStep: 4,
            Subjects: ["Ngữ văn", "Tiếng Anh"],
            Languages: ["Tiếng Việt", "Tiếng Anh"],
            TeachingLevels: ["THCS (Lớp 6 - 9)", "THPT (Lớp 10 - 12)"],
            TeachingModes: ["ONLINE", "OFFLINE"],
            ProvinceCode: "HCM",
            DistrictCode: "HCM_TD",
            EducationType: "STUDYING",
            SchoolName: "Trường Đại học Kinh tế - Luật (UEL) - ĐHQG TP.HCM",
            Degree: "Sinh viên năm 3",
            Specialization: "Luật Kinh tế",
            YearOfStudy: 3,
            Bio: null,
            ExperienceYears: 1,
            TeachingMethodology: null,
            AchievementsAndResults: null,
            HourlyRateVnd: null,
            SessionRateVnd: null,
            MonthlyRateVnd: null,
            IsNegotiable: true,
            Certifications: [new() { Name = "TOEIC 850", Issuer = "IIG Vietnam", IssueYear = 2023, FileUrl = "/uploads/certs/toeic-850.pdf" }]
        ),

        // [Trường hợp 10]: REJECTED - HỒ SƠ BỊ TỪ CHỐI (Kèm lịch sử review của Admin giải thích lý do)
        new(
            Email: "tutor.rejected.invalid@tutormatch.vn",
            FullName: "Đặng Hữu Tài",
            PhoneNumber: "0901234580",
            DateOfBirth: new DateOnly(2002, 2, 14),
            AvatarUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=256",
            Status: TutorProfileStatus.REJECTED,
            CurrentStep: 6,
            Subjects: ["Vật lý"],
            Languages: ["Tiếng Việt"],
            TeachingLevels: ["THPT (Lớp 10 - 12)"],
            TeachingModes: ["ONLINE"],
            ProvinceCode: "HN",
            DistrictCode: "HN_HBT",
            EducationType: "STUDYING",
            SchoolName: "Đại học Bách Khoa",
            Degree: "Sinh viên",
            Specialization: "Kỹ thuật",
            YearOfStudy: 2,
            Bio: "Nhận dạy kèm môn Lý cấp 3 cho các em học sinh có nhu cầu.",
            ExperienceYears: 1,
            TeachingMethodology: "Giải bài tập trong sách giáo khoa.",
            AchievementsAndResults: "Học sinh tiên tiến cấp 3.",
            HourlyRateVnd: 120000,
            SessionRateVnd: 240000,
            MonthlyRateVnd: 1800000,
            IsNegotiable: true,
            Certifications: [],
            RejectionNote: "Ảnh chụp thẻ sinh viên bị mờ, không nhìn rõ thông tin niên khóa và họ tên. Phần mô tả phương pháp giảng dạy và kinh nghiệm quá sơ sài. Vui lòng tải lại ảnh minh chứng rõ nét và cập nhật chi tiết hơn trước khi gửi duyệt lại."
        )
    ];

    private string RequireSetting(string key)
    {
        var value = configuration[key];
        return string.IsNullOrWhiteSpace(value)
            ? throw new InvalidOperationException($"{key} is required when Admin seed is enabled.")
            : value;
    }

    private static void EnsureSucceeded(IdentityResult result, string operation)
    {
        if (result.Succeeded)
        {
            return;
        }

        var errorCodes = string.Join(", ", result.Errors.Select(error => error.Code));
        throw new InvalidOperationException($"Failed to {operation}: {errorCodes}");
    }

    private sealed record SeedTutorItem(
        string Email,
        string FullName,
        string? PhoneNumber,
        DateOnly? DateOfBirth,
        string? AvatarUrl,
        TutorProfileStatus Status,
        int CurrentStep,
        List<string> Subjects,
        List<string> Languages,
        List<string> TeachingLevels,
        List<string>? TeachingModes,
        string? ProvinceCode,
        string? DistrictCode,
        string? EducationType,
        string? SchoolName,
        string? Degree,
        string? Specialization,
        int? YearOfStudy,
        string? Bio,
        int? ExperienceYears,
        string? TeachingMethodology,
        string? AchievementsAndResults,
        int? HourlyRateVnd,
        int? SessionRateVnd,
        int? MonthlyRateVnd,
        bool IsNegotiable,
        List<TutorCertification> Certifications,
        List<SeedAvailabilitySlot>? AvailabilitySlots = null,
        List<SeedCourse>? Courses = null,
        string? RejectionNote = null);

    private sealed record SeedAvailabilitySlot(
        int DayOfWeek,
        TimeOnly StartTime,
        TimeOnly EndTime);

    private sealed record SeedCourse(
        string SubjectName,
        string Name,
        string? Description,
        int SessionCount,
        int PricePerSessionVnd);
}
