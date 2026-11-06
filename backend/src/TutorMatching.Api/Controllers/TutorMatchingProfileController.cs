using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorMatching.Application.Abstractions;

namespace TutorMatching.Api.Controllers;

public sealed record UpdateTutorMatchingProfileRequest(
    IReadOnlyList<Guid>? PreferredSubjects,
    IReadOnlyList<int>? PreferredGrades,
    int MinTuitionFeeVnd,
    int? MaxTuitionFeeVnd,
    string? PreferredProvinceCode,
    IReadOnlyList<string>? PreferredDistrictCodes,
    bool ReceiveAllDistricts,
    IReadOnlyList<string>? TeachingModes,
    bool? IsActive);

[ApiController]
[Authorize(Policy = "TUTOR")]
[Route("tutors/me")]
public sealed class TutorMatchingProfileController(
    ICurrentUser currentUser,
    IDemandMatchingStore store) : ControllerBase
{
    [HttpGet("matching-profile")]
    [ProducesResponseType<TutorMatchingProfileDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMatchingProfile(CancellationToken cancellationToken)
    {
        if (currentUser.UserId is not { } userId)
        {
            return Unauthorized();
        }

        var tutorProfileId = await store.GetApprovedTutorProfileIdForUserAsync(userId, cancellationToken);
        if (!tutorProfileId.HasValue)
        {
            return Problem(
                statusCode: StatusCodes.Status403Forbidden,
                title: "Chỉ gia sư đã được phê duyệt mới có thể cấu hình nhận lớp tự động.");
        }

        var dto = await store.GetOrCreateTutorMatchingProfileAsync(tutorProfileId.Value, cancellationToken);
        return Ok(dto);
    }

    [HttpPut("matching-profile")]
    [ProducesResponseType<TutorMatchingProfileDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateMatchingProfile(
        [FromBody] UpdateTutorMatchingProfileRequest? request,
        CancellationToken cancellationToken)
    {
        if (currentUser.UserId is not { } userId)
        {
            return Unauthorized();
        }

        var tutorProfileId = await store.GetApprovedTutorProfileIdForUserAsync(userId, cancellationToken);
        if (!tutorProfileId.HasValue)
        {
            return Problem(
                statusCode: StatusCodes.Status403Forbidden,
                title: "Chỉ gia sư đã được phê duyệt mới có thể cấu hình nhận lớp tự động.");
        }

        if (request is null)
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Dữ liệu cấu hình không hợp lệ.");
        }

        try
        {
            var updated = await store.UpsertTutorMatchingProfileAsync(
                tutorProfileId.Value,
                new UpdateTutorMatchingProfileCommand(
                    PreferredSubjects: request.PreferredSubjects ?? [],
                    PreferredGrades: request.PreferredGrades ?? [],
                    MinTuitionFeeVnd: request.MinTuitionFeeVnd,
                    MaxTuitionFeeVnd: request.MaxTuitionFeeVnd,
                    PreferredProvinceCode: request.PreferredProvinceCode,
                    PreferredDistrictCodes: request.PreferredDistrictCodes ?? [],
                    ReceiveAllDistricts: request.ReceiveAllDistricts,
                    TeachingModes: request.TeachingModes ?? ["OFFLINE", "ONLINE"],
                    IsActive: request.IsActive ?? true),
                cancellationToken);

            return Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: ex.Message);
        }
    }

    [HttpGet("matched-posts")]
    [ProducesResponseType<PaginatedMatchedPostsDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMatchedPosts(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool unreadOnly = false,
        CancellationToken cancellationToken = default)
    {
        if (currentUser.UserId is not { } userId)
        {
            return Unauthorized();
        }

        var tutorProfileId = await store.GetApprovedTutorProfileIdForUserAsync(userId, cancellationToken);
        if (!tutorProfileId.HasValue)
        {
            return Problem(
                statusCode: StatusCodes.Status403Forbidden,
                title: "Chỉ gia sư đã được phê duyệt mới có thể xem lịch sử yêu cầu phù hợp.");
        }

        var result = await store.GetMatchedPostsForTutorAsync(
            tutorProfileId.Value,
            page,
            pageSize,
            unreadOnly,
            cancellationToken);

        return Ok(result);
    }
}
