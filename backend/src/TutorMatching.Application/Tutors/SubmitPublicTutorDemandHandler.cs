using System.Text.Json;
using TutorMatching.Application.Abstractions;
using TutorMatching.Domain.Content;
using TutorMatching.Domain.Notifications;

namespace TutorMatching.Application.Tutors;

public sealed class DemandRejectedException(string message) : Exception(message);

public sealed class DemandRateLimitExceededException(TimeSpan retryAfter) : Exception("Too many requests.")
{
    public TimeSpan RetryAfter { get; } = retryAfter;
}

public sealed class SubmitPublicTutorDemandHandler(
    IRedisDeduplicationService deduplicationService,
    IExtractionService extractionService,
    IMatchingEngine matchingEngine,
    IDemandMatchingStore store,
    ISseNotificationPublisher ssePublisher,
    ITextEmbeddingService embeddingService)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task<SubmitTutorDemandResponseDto> HandleAsync(
        string actorFingerprint,
        string queryText,
        Guid? requesterUserId = null,
        CancellationToken cancellationToken = default)
    {
        var trimmed = queryText?.Trim() ?? string.Empty;
        if (trimmed.Length < DemandPost.MinRawContentLength || trimmed.Length > DemandPost.MaxRawContentLength)
        {
            throw new DemandRejectedException(
                $"Nội dung yêu cầu phải từ {DemandPost.MinRawContentLength} đến {DemandPost.MaxRawContentLength} ký tự.");
        }

        var rateLimit = await deduplicationService.CheckRateLimitAsync(
            actorFingerprint,
            maxRequestsPerMinute: 10,
            cancellationToken);

        if (!rateLimit.IsAllowed)
        {
            throw new DemandRateLimitExceededException(rateLimit.RetryAfter);
        }

        var (subjects, provinces, districts) = await store.LoadCatalogAsync(cancellationToken);

        var extracted = await extractionService.ExtractAsync(
            trimmed,
            subjects,
            provinces,
            districts,
            cancellationToken);

        if (extracted.IsRejected)
        {
            throw new DemandRejectedException(
                "Không thể nhận diện yêu cầu tìm gia sư hợp lệ. Vui lòng ghi rõ môn học, lớp hoặc khu vực.");
        }

        var candidatePostId = Guid.NewGuid();
        var dedup = await deduplicationService.CheckAndRegisterAsync(
            actorFingerprint,
            trimmed,
            candidatePostId,
            cancellationToken);

        if (dedup.IsDuplicate)
        {
            var cachedJson = await deduplicationService.GetCachedResponseJsonAsync(
                dedup.DemandPostId,
                cancellationToken);

            if (!string.IsNullOrWhiteSpace(cachedJson))
            {
                var cached = JsonSerializer.Deserialize<SubmitTutorDemandResponseDto>(cachedJson, JsonOptions);
                if (cached is not null)
                {
                    return cached with
                    {
                        DemandPostId = dedup.DemandPostId,
                        IsDeduplicatedHit = true,
                    };
                }
            }
        }

        var publicCandidates = await store.LoadPublicTutorCandidatesAsync(cancellationToken);
        var matchedTutors = matchingEngine.MatchPublicTutors(extracted, publicCandidates);

        var summaryDto = new ExtractedDemandSummaryDto(
            SubjectId: extracted.SubjectId,
            SubjectName: extracted.SubjectNameRaw,
            GradeLevel: extracted.GradeLevel,
            TuitionFeeVnd: extracted.TuitionFeeVnd,
            FeePeriod: extracted.FeePeriod,
            IsFeeNegotiable: extracted.IsFeeNegotiable,
            SessionsPerWeek: extracted.SessionsPerWeek,
            TeachingMode: extracted.TeachingMode,
            ProvinceCode: extracted.ProvinceCode,
            ProvinceName: extracted.ProvinceName,
            DistrictCode: extracted.DistrictCode,
            DistrictName: extracted.DistrictName,
            RawAddress: extracted.RawAddress,
            IsLocationAmbiguous: extracted.IsLocationAmbiguous,
            ConfidenceScore: extracted.ConfidenceScore);

        if (dedup.IsDuplicate)
        {
            var deduplicatedResponse = new SubmitTutorDemandResponseDto(
                DemandPostId: dedup.DemandPostId,
                IsDeduplicatedHit: true,
                ExtractedCriteria: summaryDto,
                MatchedTutors: matchedTutors);

            await deduplicationService.CacheResponseJsonAsync(
                dedup.DemandPostId,
                JsonSerializer.Serialize(deduplicatedResponse, JsonOptions),
                TimeSpan.FromHours(24),
                cancellationToken);

            return deduplicatedResponse;
        }

        var now = DateTimeOffset.UtcNow;
        var post = DemandPost.Create(
            actorFingerprint: actorFingerprint,
            contentHash: dedup.ContentHash,
            rawContent: trimmed,
            requesterUserId: requesterUserId,
            now: now);
        post.Id = dedup.DemandPostId;
        post.MarkExtracted();

        var embedding = await embeddingService.GenerateAsync(trimmed, cancellationToken);

        // Only persist location codes that exist in the active catalog; resolver fallbacks (gazetteer/aliases)
        // may emit canonical codes absent from this deployment's catalog and would violate the FK constraints.
        var persistedProvinceCode = provinces.Any(p =>
            string.Equals(p.ProvinceCode, extracted.ProvinceCode, StringComparison.OrdinalIgnoreCase))
            ? extracted.ProvinceCode
            : null;
        var persistedDistrictCode = districts.Any(d =>
            string.Equals(d.DistrictCode, extracted.DistrictCode, StringComparison.OrdinalIgnoreCase))
            ? extracted.DistrictCode
            : null;

        var detail = ExtractedDemandDetail.Create(
            demandPostId: post.Id,
            subjectId: extracted.SubjectId,
            subjectNameRaw: extracted.SubjectNameRaw,
            gradeLevel: extracted.GradeLevel,
            tuitionFeeVnd: extracted.TuitionFeeVnd,
            feePeriod: extracted.FeePeriod,
            isFeeNegotiable: extracted.IsFeeNegotiable,
            sessionsPerWeek: extracted.SessionsPerWeek,
            teachingMode: extracted.TeachingMode,
            provinceCode: persistedProvinceCode,
            districtCode: persistedDistrictCode,
            rawAddress: extracted.RawAddress,
            isLocationAmbiguous: extracted.IsLocationAmbiguous,
            scheduleNotes: extracted.ScheduleNotes,
            confidenceScore: extracted.ConfidenceScore,
            extractedJson: extracted.ExtractedJson,
            embedding: embedding.ToList(),
            now: now);

        var activeSubscriptionProfiles = await store.LoadActiveTutorMatchingProfilesAsync(cancellationToken);
        var matchedSubscriptions = matchingEngine.MatchTutorProfiles(extracted, activeSubscriptionProfiles);

        var notifications = matchedSubscriptions
            .Select(m => new PostMatchNotification
            {
                Id = Guid.NewGuid(),
                ExtractedDemandDetailId = detail.Id,
                TutorProfileId = m.TutorProfileId,
                MatchScore = m.MatchScore,
                IsRead = false,
                SentAt = now,
                CreatedAt = now,
            })
            .ToList();

        await store.SaveDemandAndNotificationsAsync(post, detail, notifications, cancellationToken);

        // Push realtime SSE events concurrently to all matched tutors
        if (notifications.Count > 0)
        {
            var publishTasks = notifications.Select(notification =>
            {
                var sseItem = new MatchedPostNotificationItemDto(
                    NotificationId: notification.Id,
                    DemandPostId: post.Id,
                    SubjectName: extracted.SubjectNameRaw ?? "Chưa rõ môn",
                    GradeLevel: extracted.GradeLevel ?? 0,
                    TuitionFeeVnd: extracted.TuitionFeeVnd,
                    FeePeriod: extracted.FeePeriod,
                    TeachingMode: extracted.TeachingMode,
                    ProvinceName: extracted.ProvinceName ?? "Toàn quốc",
                    DistrictName: extracted.DistrictName,
                    RawAddress: extracted.RawAddress,
                    RawContent: post.RawContent,
                    IsLocationAmbiguous: extracted.IsLocationAmbiguous,
                    MatchScore: notification.MatchScore,
                    CreatedAt: now,
                    IsRead: false);

                return ssePublisher.PublishAsync(notification.TutorProfileId, sseItem, cancellationToken);
            });

            await Task.WhenAll(publishTasks);
        }

        var response = new SubmitTutorDemandResponseDto(
            DemandPostId: post.Id,
            IsDeduplicatedHit: false,
            ExtractedCriteria: summaryDto,
            MatchedTutors: matchedTutors);

        await deduplicationService.CacheResponseJsonAsync(
            post.Id,
            JsonSerializer.Serialize(response, JsonOptions),
            TimeSpan.FromHours(24),
            cancellationToken);

        return response;
    }
}
