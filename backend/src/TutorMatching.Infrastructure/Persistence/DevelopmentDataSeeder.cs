using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TutorMatching.Domain.Tutors;
using TutorMatching.Domain.Users;

namespace TutorMatching.Infrastructure.Persistence;

public sealed class DevelopmentDataSeeder(
    RoleManager<IdentityRole<Guid>> roleManager,
    UserManager<ApplicationUser> userManager,
    ApplicationDbContext dbContext,
    IConfiguration configuration)
{
    public async Task SeedAsync()
    {
        foreach (var role in Enum.GetValues<AccountRole>())
        {
            var roleName = role.ToString();
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                EnsureSucceeded(
                    await roleManager.CreateAsync(new IdentityRole<Guid>(roleName)),
                    $"create the canonical {roleName} role");
            }
        }

        await SeedAdminAsync();
        await SeedTutorsAsync();
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
            if (!await userManager.IsInRoleAsync(existingUser, AccountRole.ADMIN.ToString()))
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
            EmailConfirmed = true,
            Status = AccountStatus.ACTIVE,
        };

        EnsureSucceeded(
            await userManager.CreateAsync(user, password),
            "create the controlled Admin demo account");
        EnsureSucceeded(
            await userManager.AddToRoleAsync(user, AccountRole.ADMIN.ToString()),
            "assign the Admin role to the controlled demo account");
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
                EmailConfirmed = true,
                Status = AccountStatus.ACTIVE,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };

            var createResult = await userManager.CreateAsync(user, defaultPassword);
            EnsureSucceeded(createResult, $"create tutor user account {item.Email}");

            var roleResult = await userManager.AddToRoleAsync(user, AccountRole.TUTOR.ToString());
            EnsureSucceeded(roleResult, $"assign TUTOR role to {item.Email}");

            var now = DateTimeOffset.UtcNow;
            var profile = new TutorProfile
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Status = item.Status,
                CurrentStep = 6,
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
                HourlyRateVnd = item.HourlyRateVnd,
                SessionRateVnd = item.SessionRateVnd,
                MonthlyRateVnd = item.MonthlyRateVnd,
                IsNegotiable = item.IsNegotiable,
                CreatedAt = now,
                UpdatedAt = now,
                SubmittedAt = now,
                ApprovedAt = item.Status == TutorProfileStatus.APPROVED ? now : null
            };

            dbContext.TutorProfiles.Add(profile);
        }

        await dbContext.SaveChangesAsync();
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
            Subjects: ["Toán học", "Tin học / Lập trình", "Vật lý"],
            Languages: ["Tiếng Việt", "Tiếng Anh"],
            TeachingLevels: ["THCS (Lớp 6 - 9)", "THPT (Lớp 10 - 12)", "Luyện thi tốt nghiệp & ĐH"],
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
            Certifications: [new() { Name = "Chứng chỉ Tin học Quốc tế MOS", Issuer = "Certiport", IssueYear = 2023, FileUrl = "/uploads/certs/mos.pdf" }]
        ),
        new(
            Email: "tutor.hn.ulis@tutormatch.vn",
            FullName: "Trần Thị Thu Hà",
            PhoneNumber: "0901234562",
            DateOfBirth: new DateOnly(2001, 9, 20),
            AvatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256",
            Status: TutorProfileStatus.APPROVED,
            Subjects: ["Tiếng Anh", "Luyện thi chứng chỉ"],
            Languages: ["Tiếng Việt", "Tiếng Anh"],
            TeachingLevels: ["Tiểu học (Lớp 1 - 5)", "THCS (Lớp 6 - 9)", "Luyện thi vào 10", "Luyện thi tốt nghiệp & ĐH"],
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
            Certifications: [new() { Name = "Chứng chỉ IELTS 8.0", Issuer = "IDP Education", IssueYear = 2024, FileUrl = "/uploads/certs/ielts-8.pdf" }]
        ),
        new(
            Email: "tutor.hn.hnue@tutormatch.vn",
            FullName: "Lê Minh Quang",
            PhoneNumber: "0901234563",
            DateOfBirth: new DateOnly(2003, 11, 5),
            AvatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256",
            Status: TutorProfileStatus.APPROVED,
            Subjects: ["Toán học", "Toán tư duy"],
            Languages: ["Tiếng Việt"],
            TeachingLevels: ["Tiểu học (Lớp 1 - 5)", "THCS (Lớp 6 - 9)", "Luyện thi vào 10"],
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
            Certifications: []
        ),
        new(
            Email: "tutor.hn.neu@tutormatch.vn",
            FullName: "Phạm Quỳnh Anh",
            PhoneNumber: "0901234564",
            DateOfBirth: new DateOnly(2004, 2, 18),
            AvatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=256",
            Status: TutorProfileStatus.APPROVED,
            Subjects: ["Toán học", "Tiếng Anh", "Ngữ văn"],
            Languages: ["Tiếng Việt", "Tiếng Anh"],
            TeachingLevels: ["Tiểu học (Lớp 1 - 5)", "THCS (Lớp 6 - 9)"],
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
            Certifications: [new() { Name = "IELTS 7.5", Issuer = "British Council", IssueYear = 2023, FileUrl = "/uploads/certs/ielts-75.pdf" }]
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
            Subjects: ["Vật lý", "Toán học"],
            Languages: ["Tiếng Việt"],
            TeachingLevels: ["THPT (Lớp 10 - 12)", "Luyện thi tốt nghiệp & ĐH"],
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
            Certifications: []
        ),
        new(
            Email: "tutor.dn.ued@tutormatch.vn",
            FullName: "Ngô Thảo Nguyên",
            PhoneNumber: "0901234566",
            DateOfBirth: new DateOnly(2000, 6, 14),
            AvatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256",
            Status: TutorProfileStatus.APPROVED,
            Subjects: ["Ngữ văn", "Rèn chữ đẹp"],
            Languages: ["Tiếng Việt"],
            TeachingLevels: ["Tiểu học (Lớp 1 - 5)", "THCS (Lớp 6 - 9)", "Luyện thi vào 10"],
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
            Certifications: [new() { Name = "Chứng chỉ Nghiệp vụ Sư phạm Xuất sắc", Issuer = "Đại học Đà Nẵng", IssueYear = 2022, FileUrl = "/uploads/certs/pedagogy.pdf" }]
        ),
        new(
            Email: "tutor.dn.ufl@tutormatch.vn",
            FullName: "Võ Nhật Huy",
            PhoneNumber: "0901234567",
            DateOfBirth: new DateOnly(2003, 1, 25),
            AvatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=256",
            Status: TutorProfileStatus.APPROVED,
            Subjects: ["Tiếng Nhật", "Tiếng Anh"],
            Languages: ["Tiếng Việt", "Tiếng Nhật", "Tiếng Anh"],
            TeachingLevels: ["Sinh viên đại học", "Người đi làm", "THPT (Lớp 10 - 12)"],
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
            Certifications: [new() { Name = "Chứng chỉ JLPT N2", Issuer = "Japan Foundation", IssueYear = 2023, FileUrl = "/uploads/certs/jlpt-n2.pdf" }]
        ),
        new(
            Email: "tutor.dn.due@tutormatch.vn",
            FullName: "Bùi Gia Bảo",
            PhoneNumber: "0901234568",
            DateOfBirth: new DateOnly(2004, 7, 19),
            AvatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=256",
            Status: TutorProfileStatus.APPROVED,
            Subjects: ["Toán học", "Hóa học"],
            Languages: ["Tiếng Việt"],
            TeachingLevels: ["THCS (Lớp 6 - 9)", "THPT (Lớp 10 - 12)"],
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
            Certifications: []
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
            Subjects: ["Toán học", "Tin học / Lập trình", "Vật lý"],
            Languages: ["Tiếng Việt", "Tiếng Anh"],
            TeachingLevels: ["THPT (Lớp 10 - 12)", "Luyện thi tốt nghiệp & ĐH", "Sinh viên đại học"],
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
            Certifications: [new() { Name = "AWS Certified Solutions Architect", Issuer = "Amazon Web Services", IssueYear = 2023, FileUrl = "/uploads/certs/aws.pdf" }]
        ),
        new(
            Email: "tutor.hcm.hcmue@tutormatch.vn",
            FullName: "Trương Mai Lan",
            PhoneNumber: "0901234570",
            DateOfBirth: new DateOnly(2002, 3, 17),
            AvatarUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=256",
            Status: TutorProfileStatus.APPROVED,
            Subjects: ["Hóa học", "Sinh học"],
            Languages: ["Tiếng Việt"],
            TeachingLevels: ["THCS (Lớp 6 - 9)", "THPT (Lớp 10 - 12)", "Luyện thi tốt nghiệp & ĐH"],
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
            Certifications: [new() { Name = "Chứng nhận Nghiệp vụ Sư phạm Loại Giỏi", Issuer = "ĐH Sư phạm TP.HCM", IssueYear = 2024, FileUrl = "/uploads/certs/hcmue.pdf" }]
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
        string PhoneNumber,
        DateOnly DateOfBirth,
        string AvatarUrl,
        TutorProfileStatus Status,
        List<string> Subjects,
        List<string> Languages,
        List<string> TeachingLevels,
        string EducationType,
        string SchoolName,
        string Degree,
        string Specialization,
        int? YearOfStudy,
        string Bio,
        int ExperienceYears,
        string TeachingMethodology,
        string AchievementsAndResults,
        int HourlyRateVnd,
        int SessionRateVnd,
        int MonthlyRateVnd,
        bool IsNegotiable,
        List<TutorCertification> Certifications);
}
