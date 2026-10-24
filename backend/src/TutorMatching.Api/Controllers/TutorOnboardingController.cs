using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorMatching.Api.Contracts.Tutors;
using TutorMatching.Api.Errors;
using TutorMatching.Application.Abstractions;
using TutorMatching.Application.Tutors;

namespace TutorMatching.Api.Controllers;

[ApiController]
[Authorize(Roles = "TUTOR")]
[Route("tutor/onboarding")]
public sealed class TutorOnboardingController(
    ICurrentUser currentUser,
    ITutorOnboardingService onboardingService,
    IFileStorageService fileStorage) : ControllerBase
{
    [HttpGet("me", Name = "getTutorOnboarding")]
    [ProducesResponseType(typeof(TutorOnboardingResponse), StatusCodes.Status200OK, "application/json")]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden, "application/problem+json")]
    public async Task<IActionResult> GetOnboardingAsync(CancellationToken cancellationToken)
    {
        Response.Headers.CacheControl = "no-store";
        if (currentUser.UserId is not { } userId) return Unauthorized();

        var data = await onboardingService.GetOnboardingAsync(userId, cancellationToken);
        if (data is null) return NotFound();

        return Ok(MapToResponse(data));
    }

    [HttpPut("draft", Name = "saveTutorOnboardingDraft")]
    [Consumes("application/json")]
    [ProducesResponseType(typeof(TutorOnboardingResponse), StatusCodes.Status200OK, "application/json")]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict, "application/problem+json")]
    public async Task<IActionResult> SaveDraftAsync(
        [FromBody] SaveOnboardingDraftRequest request,
        CancellationToken cancellationToken)
    {
        Response.Headers.CacheControl = "no-store";
        if (currentUser.UserId is not { } userId) return Unauthorized();

        var command = new SaveDraftCommand(
            request.CurrentStep,
            request.About is null ? null : new TutorAboutData(
                request.About.FullName,
                request.About.DateOfBirth,
                request.About.PhoneNumber,
                request.About.Subjects,
                request.About.Languages,
                request.About.TeachingLevels),
            request.AvatarUrl,
            request.HasCertifications,
            request.Certifications?.Select(c => new TutorCertificationData(c.Name, c.Issuer, c.IssueYear, c.FileUrl)).ToList(),
            request.Education is null ? null : new TutorEducationData(
                request.Education.EducationType,
                request.Education.SchoolName,
                request.Education.Degree,
                request.Education.Specialization,
                request.Education.YearOfStudy),
            request.Description is null ? null : new TutorDescriptionData(
                request.Description.Bio,
                request.Description.ExperienceYears,
                request.Description.TeachingMethodology,
                request.Description.AchievementsAndResults),
            request.Pricing is null ? null : new TutorPricingData(
                request.Pricing.HourlyRateVnd,
                request.Pricing.SessionRateVnd,
                request.Pricing.MonthlyRateVnd,
                request.Pricing.IsNegotiable), request.ExpectedVersion, request.Discovery);

        var result = await onboardingService.SaveDraftAsync(userId, command, cancellationToken);
        if (!result.Succeeded)
        {
            return ApiProblems.FromFailure(HttpContext, result.Failure!.Value, result.Errors);
        }

        return Ok(MapToResponse(result.Data!));
    }

    [HttpPost("avatar", Name = "uploadTutorAvatar")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(UploadFileResponse), StatusCodes.Status200OK, "application/json")]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden, "application/problem+json")]
    public async Task<IActionResult> UploadAvatarAsync(
        IFormFile file,
        CancellationToken cancellationToken)
    {
        Response.Headers.CacheControl = "no-store";
        if (currentUser.UserId is not { } userId) return Unauthorized();

        if (file is null || file.Length == 0)
        {
            return BadRequest("File không hợp lệ hoặc rỗng.");
        }

        if (file.Length > 5 * 1024 * 1024)
        {
            return BadRequest("Dung lượng ảnh đại diện không được vượt quá 5MB.");
        }

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(extension))
        {
            return BadRequest("Định dạng ảnh không được hỗ trợ (chỉ chấp nhận JPG, PNG, WEBP).");
        }

        await using var stream = file.OpenReadStream();
        var relativeUrl = await fileStorage.SaveFileAsync(stream, file.FileName, "avatars", cancellationToken);
        await onboardingService.UpdateAvatarAsync(userId, relativeUrl, cancellationToken);

        return Ok(new UploadFileResponse(relativeUrl, file.FileName));
    }

    [HttpPost("certificates/upload", Name = "uploadTutorCertificate")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(UploadFileResponse), StatusCodes.Status200OK, "application/json")]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden, "application/problem+json")]
    public async Task<IActionResult> UploadCertificateAsync(
        IFormFile file,
        CancellationToken cancellationToken)
    {
        Response.Headers.CacheControl = "no-store";
        if (currentUser.UserId is not { } _) return Unauthorized();

        if (file is null || file.Length == 0)
        {
            return BadRequest("File không hợp lệ hoặc rỗng.");
        }

        if (file.Length > 10 * 1024 * 1024)
        {
            return BadRequest("Dung lượng chứng chỉ không được vượt quá 10MB.");
        }

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp", ".pdf" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(extension))
        {
            return BadRequest("Định dạng chứng chỉ không được hỗ trợ (chấp nhận JPG, PNG, WEBP, PDF).");
        }

        await using var stream = file.OpenReadStream();
        var relativeUrl = await fileStorage.SaveFileAsync(stream, file.FileName, "certificates", cancellationToken);

        return Ok(new UploadFileResponse(relativeUrl, file.FileName));
    }

    [HttpPost("submit", Name = "submitTutorOnboarding")]
    [ProducesResponseType(typeof(SubmitOnboardingResponse), StatusCodes.Status200OK, "application/json")]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status422UnprocessableEntity, "application/problem+json")]
    public async Task<IActionResult> SubmitAsync(CancellationToken cancellationToken, [FromBody(EmptyBodyBehavior = Microsoft.AspNetCore.Mvc.ModelBinding.EmptyBodyBehavior.Allow)] SubmitTutorRequest? request = null)
    {
        Response.Headers.CacheControl = "no-store";
        if (currentUser.UserId is not { } userId) return Unauthorized();

        var result = await onboardingService.SubmitAsync(userId, cancellationToken, request?.ExpectedVersion);
        if (result.Conflict) return Conflict(new { message = "Hồ sơ đã thay đổi hoặc đang chờ duyệt." });
        if (!result.Succeeded)
        {
            var problem = ApiProblems.Create(HttpContext, StatusCodes.Status422UnprocessableEntity, "Hồ sơ chưa đủ điều kiện để nộp duyệt.");
            if (result.Errors is not null)
            {
                problem.Extensions["errors"] = result.Errors;
            }
            return ApiProblems.ToResult(problem);
        }

        return Ok(new SubmitOnboardingResponse(
            result.Status!.Value,
            result.SubmittedAt!.Value,
            "Hồ sơ gia sư đã được gửi xét duyệt thành công. Quản trị viên sẽ phản hồi trong vòng 24-48 giờ."));
    }

    internal static TutorOnboardingResponse MapToResponse(TutorOnboardingData data)
    {
        return new TutorOnboardingResponse(
            data.Status,
            data.CurrentStep,
            new TutorAboutDto(
                data.About.FullName,
                data.About.DateOfBirth,
                data.About.PhoneNumber,
                data.About.Subjects,
                data.About.Languages,
                data.About.TeachingLevels),
            data.AvatarUrl,
            data.HasCertifications,
            data.Certifications.Select(c => new TutorCertificationDto(c.Name, c.Issuer, c.IssueYear, c.FileUrl)).ToList(),
            new TutorEducationDto(
                data.Education.EducationType,
                data.Education.SchoolName,
                data.Education.Degree,
                data.Education.Specialization,
                data.Education.YearOfStudy),
            new TutorDescriptionDto(
                data.Description.Bio,
                data.Description.ExperienceYears,
                data.Description.TeachingMethodology,
                data.Description.AchievementsAndResults),
            new TutorPricingDto(
                data.Pricing.HourlyRateVnd,
                data.Pricing.SessionRateVnd,
                data.Pricing.MonthlyRateVnd,
                data.Pricing.IsNegotiable),
            data.SubmittedAt,
            data.ApprovedAt, data.Version, data.Discovery);
    }
}
