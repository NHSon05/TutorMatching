using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TutorMatching.Api.Contracts.Tutors;
using TutorMatching.Domain.Tutors;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Api.Controllers;

[ApiController]
[Route("api/v1/tutors")]
public sealed class TutorsController(ApplicationDbContext dbContext) : ControllerBase
{
    /// <summary>
    /// Lấy danh sách toàn bộ gia sư (hỗ trợ tìm kiếm, lọc theo môn học, khu vực, học phí).
    /// Mặc định trả về các gia sư đã được phê duyệt (APPROVED).
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType<PagedTutorsResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTutors(
        [FromQuery] TutorQueryParameters parameters,
        CancellationToken cancellationToken)
    {
        var query = from profile in dbContext.TutorProfiles.AsNoTracking()
                    join user in dbContext.Users.AsNoTracking() on profile.UserId equals user.Id
                    select new { profile, user };

        // 1. Lọc theo trạng thái hồ sơ
        if (!string.IsNullOrWhiteSpace(parameters.Status) &&
            Enum.TryParse<TutorProfileStatus>(parameters.Status, true, out var statusFilter))
        {
            query = query.Where(x => x.profile.Status == statusFilter);
        }
        else if (string.IsNullOrWhiteSpace(parameters.Status) ||
                 !parameters.Status.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(x => x.profile.Status == TutorProfileStatus.APPROVED);
        }

        // 2. Tìm kiếm theo từ khóa (tên, trường, chuyên ngành, bio)
        if (!string.IsNullOrWhiteSpace(parameters.Search))
        {
            var search = parameters.Search.Trim().ToLower();
            query = query.Where(x =>
                x.user.FullName.ToLower().Contains(search) ||
                (x.profile.SchoolName != null && x.profile.SchoolName.ToLower().Contains(search)) ||
                (x.profile.Specialization != null && x.profile.Specialization.ToLower().Contains(search)) ||
                (x.profile.Bio != null && x.profile.Bio.ToLower().Contains(search)));
        }

        // 3. Lọc theo khoảng học phí theo giờ
        if (parameters.MinPrice.HasValue)
        {
            query = query.Where(x => x.profile.HourlyRateVnd >= parameters.MinPrice.Value);
        }

        if (parameters.MaxPrice.HasValue)
        {
            query = query.Where(x => x.profile.HourlyRateVnd <= parameters.MaxPrice.Value);
        }

        // Sắp xếp theo ngày duyệt mới nhất hoặc ngày tạo
        var list = await query
            .OrderByDescending(x => x.profile.ApprovedAt ?? x.profile.CreatedAt)
            .ToListAsync(cancellationToken);

        // 4. Lọc in-memory cho các mảng JSON (Môn học)
        if (!string.IsNullOrWhiteSpace(parameters.Subject))
        {
            var subjectTerm = parameters.Subject.Trim();
            list = list.Where(x => x.profile.Subjects.Any(s =>
                s.Contains(subjectTerm, StringComparison.OrdinalIgnoreCase))).ToList();
        }

        // 5. Lọc theo khu vực/thành phố
        if (!string.IsNullOrWhiteSpace(parameters.City))
        {
            var city = parameters.City.Trim().ToLower();
            list = list.Where(x => MatchesCity(x.profile.SchoolName, x.profile.Bio, city)).ToList();
        }

        var totalCount = list.Count;
        var page = Math.Max(1, parameters.Page ?? 1);
        var pageSize = Math.Clamp(parameters.PageSize ?? 50, 1, 100);

        var pagedItems = list
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => MapToTutorListItemResponse(x.profile, x.user))
            .ToList();

        return Ok(new PagedTutorsResponse(pagedItems, totalCount, page, pageSize));
    }

    /// <summary>
    /// Lấy thông tin chi tiết của một gia sư theo Id (TutorProfile Id hoặc User Id).
    /// </summary>
    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    [ProducesResponseType<TutorListItemResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTutorById(Guid id, CancellationToken cancellationToken)
    {
        var record = await (from profile in dbContext.TutorProfiles.AsNoTracking()
                            join user in dbContext.Users.AsNoTracking() on profile.UserId equals user.Id
                            where profile.Id == id || profile.UserId == id
                            select new { profile, user })
                           .FirstOrDefaultAsync(cancellationToken);

        if (record is null)
        {
            return NotFound(new { message = "Không tìm thấy hồ sơ gia sư." });
        }

        return Ok(MapToTutorListItemResponse(record.profile, record.user));
    }

    private static bool MatchesCity(string? schoolName, string? bio, string city)
    {
        var text = $"{schoolName} {bio}".ToLower();
        return city switch
        {
            "hanoi" or "hà nội" or "hn" =>
                text.Contains("hà nội") || text.Contains("hanoi") || text.Contains("hust") || text.Contains("ulis") || text.Contains("hnue") || text.Contains("neu"),
            "danang" or "đà nẵng" or "dn" =>
                text.Contains("đà nẵng") || text.Contains("danang") || text.Contains("dut") || text.Contains("ued") || text.Contains("ufl") || text.Contains("due"),
            "hcm" or "hồ chí minh" or "tp.hcm" or "tphcm" or "sài gòn" =>
                text.Contains("hồ chí minh") || text.Contains("tp.hcm") || text.Contains("tphcm") || text.Contains("hcmut") || text.Contains("hcmue"),
            _ => text.Contains(city)
        };
    }

    private static TutorListItemResponse MapToTutorListItemResponse(
        TutorProfile profile,
        ApplicationUser user)
    {
        return new TutorListItemResponse(
            Id: profile.Id,
            UserId: profile.UserId,
            FullName: user.FullName,
            AvatarUrl: profile.AvatarUrl ?? user.AvatarUrl,
            Status: profile.Status.ToString(),
            Subjects: profile.Subjects,
            Languages: profile.Languages,
            TeachingLevels: profile.TeachingLevels,
            EducationType: profile.EducationType,
            SchoolName: profile.SchoolName,
            Degree: profile.Degree,
            Specialization: profile.Specialization,
            YearOfStudy: profile.YearOfStudy,
            Bio: profile.Bio,
            ExperienceYears: profile.ExperienceYears ?? 0,
            TeachingMethodology: profile.TeachingMethodology,
            AchievementsAndResults: profile.AchievementsAndResults,
            HourlyRateVnd: profile.HourlyRateVnd ?? 150000,
            SessionRateVnd: profile.SessionRateVnd,
            MonthlyRateVnd: profile.MonthlyRateVnd,
            IsNegotiable: profile.IsNegotiable,
            Rating: 5.0, // Điểm đánh giá ban đầu
            Certifications: profile.Certifications.Select(c => new TutorCertificationDto(
                Name: c.Name,
                Issuer: c.Issuer,
                IssueYear: c.IssueYear,
                FileUrl: c.FileUrl
            )).ToList(),
            CreatedAt: profile.CreatedAt,
            ApprovedAt: profile.ApprovedAt
        );
    }
}
