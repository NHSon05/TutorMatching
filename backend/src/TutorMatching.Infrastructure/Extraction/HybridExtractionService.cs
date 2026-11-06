using System.Text.Json;
using TutorMatching.Application.Abstractions;
using TutorMatching.Domain.Catalog;
using TutorMatching.Domain.Locations;

namespace TutorMatching.Infrastructure.Extraction;

public sealed class NoOpLlmEntityExtractor : ILlmEntityExtractor
{
    public Task<LlmExtractionPayload?> TryExtractAsync(
        string rawContent,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<LlmExtractionPayload?>(null);
}

public sealed class HybridExtractionService(
    RegexEntityExtractor regexExtractor,
    AddressResolutionService addressResolutionService,
    ILlmEntityExtractor? llmExtractor = null,
    TimeSpan? llmTimeout = null) : IExtractionService
{
    public const decimal MinimumAcceptableConfidence = 0.40m;
    private static readonly TimeSpan DefaultLlmTimeout = TimeSpan.FromMilliseconds(2500);

    private readonly TimeSpan effectiveTimeout = llmTimeout ?? DefaultLlmTimeout;

    public async Task<ExtractedDemandCriteriaDto> ExtractAsync(
        string rawContent,
        IReadOnlyList<Subject> catalogSubjects,
        IReadOnlyList<Province> catalogProvinces,
        IReadOnlyList<District> catalogDistricts,
        CancellationToken cancellationToken = default)
    {
        var regexResult = regexExtractor.Extract(rawContent);

        LlmExtractionPayload? llmPayload = null;
        var usedFallback = false;

        if (llmExtractor is not null)
        {
            try
            {
                using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                timeoutCts.CancelAfter(effectiveTimeout);
                llmPayload = await llmExtractor.TryExtractAsync(rawContent, timeoutCts.Token);
            }
            catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
            {
                // Time-boxed 2.5s Circuit Breaker triggered -> fallback immediately to Regex + Gazetteer
                usedFallback = true;
            }
            catch (Exception)
            {
                usedFallback = true;
            }
        }

        var subjectNameRaw = llmPayload?.SubjectName ?? regexResult.SubjectNameRaw;
        var matchedSubject = ResolveCatalogSubject(subjectNameRaw, catalogSubjects);

        var gradeLevel = llmPayload?.GradeLevel ?? regexResult.GradeLevel;
        var tuitionFeeVnd = llmPayload?.TuitionFeeVnd ?? regexResult.TuitionFeeVnd;
        var feePeriod = llmPayload?.FeePeriod ?? regexResult.FeePeriod;
        var isFeeNegotiable = llmPayload?.IsFeeNegotiable ?? regexResult.IsFeeNegotiable;
        var sessionsPerWeek = llmPayload?.SessionsPerWeek ?? regexResult.SessionsPerWeek;
        var teachingMode = llmPayload?.TeachingMode ?? regexResult.TeachingMode;
        var scheduleNotes = llmPayload?.ScheduleNotes ?? regexResult.ScheduleNotes;

        var addressSource = !string.IsNullOrWhiteSpace(llmPayload?.AddressText)
            ? $"{rawContent} {llmPayload.AddressText}"
            : rawContent;

        var addressResolution = addressResolutionService.Resolve(
            addressSource,
            teachingMode,
            catalogProvinces,
            catalogDistricts);

        var confidenceScore = CalculateConfidenceScore(
            llmPayload,
            matchedSubject?.Id,
            subjectNameRaw,
            gradeLevel,
            tuitionFeeVnd,
            isFeeNegotiable,
            addressResolution);

        var isRejected = confidenceScore < MinimumAcceptableConfidence;

        var extractedPayload = new
        {
            subjectId = matchedSubject?.Id,
            subjectName = matchedSubject?.Name ?? subjectNameRaw,
            gradeLevel,
            tuitionFeeVnd,
            feePeriod,
            isFeeNegotiable,
            sessionsPerWeek,
            teachingMode,
            provinceCode = addressResolution.ProvinceCode,
            districtCode = addressResolution.DistrictCode,
            isLocationAmbiguous = addressResolution.IsLocationAmbiguous,
            scheduleNotes,
            confidenceScore,
            usedFallback,
        };

        return new ExtractedDemandCriteriaDto(
            SubjectId: matchedSubject?.Id,
            SubjectNameRaw: matchedSubject?.Name ?? subjectNameRaw,
            GradeLevel: gradeLevel,
            TuitionFeeVnd: tuitionFeeVnd,
            FeePeriod: feePeriod,
            IsFeeNegotiable: isFeeNegotiable,
            SessionsPerWeek: sessionsPerWeek,
            TeachingMode: teachingMode,
            ProvinceCode: addressResolution.ProvinceCode,
            ProvinceName: addressResolution.ProvinceName,
            DistrictCode: addressResolution.DistrictCode,
            DistrictName: addressResolution.DistrictName,
            RawAddress: addressResolution.RawAddress,
            IsLocationAmbiguous: addressResolution.IsLocationAmbiguous,
            ScheduleNotes: scheduleNotes,
            ConfidenceScore: confidenceScore,
            ExtractedJson: JsonSerializer.Serialize(extractedPayload),
            UsedFallback: usedFallback,
            IsRejected: isRejected);
    }

    private static Subject? ResolveCatalogSubject(
        string? subjectNameRaw,
        IReadOnlyList<Subject> catalogSubjects)
    {
        if (string.IsNullOrWhiteSpace(subjectNameRaw) || catalogSubjects.Count == 0)
        {
            return null;
        }

        var normalizedTarget = VietnamLandmarkGazetteer.RemoveDiacritics(subjectNameRaw);

        // Pass 1: Exact normalized name match
        foreach (var subject in catalogSubjects)
        {
            var normalizedSubject = VietnamLandmarkGazetteer.RemoveDiacritics(subject.Name);
            if (normalizedSubject == normalizedTarget)
            {
                return subject;
            }
        }

        // Pass 2: Substring match (e.g., "Toán" <-> "Toán học")
        foreach (var subject in catalogSubjects)
        {
            var normalizedSubject = VietnamLandmarkGazetteer.RemoveDiacritics(subject.Name);
            if (normalizedSubject.Contains(normalizedTarget, StringComparison.Ordinal) ||
                normalizedTarget.Contains(normalizedSubject, StringComparison.Ordinal))
            {
                return subject;
            }
        }

        return null;
    }

    private static decimal CalculateConfidenceScore(
        LlmExtractionPayload? llmPayload,
        Guid? subjectId,
        string? subjectNameRaw,
        int? gradeLevel,
        int tuitionFeeVnd,
        bool isFeeNegotiable,
        AddressResolutionResult addressResolution)
    {
        var ruleScore = 0.00m;

        if (subjectId.HasValue || !string.IsNullOrWhiteSpace(subjectNameRaw))
        {
            ruleScore += 0.40m;
        }

        if (gradeLevel.HasValue)
        {
            ruleScore += 0.25m;
        }

        if (tuitionFeeVnd > 0 || isFeeNegotiable)
        {
            ruleScore += 0.15m;
        }

        if (!string.IsNullOrWhiteSpace(addressResolution.DistrictCode))
        {
            ruleScore += 0.20m;
        }
        else if (!string.IsNullOrWhiteSpace(addressResolution.ProvinceCode))
        {
            ruleScore += 0.10m;
        }

        if (llmPayload is not null && llmPayload.ConfidenceScore > ruleScore)
        {
            return decimal.Round(Math.Clamp(llmPayload.ConfidenceScore, 0.00m, 1.00m), 2, MidpointRounding.AwayFromZero);
        }

        return decimal.Round(Math.Clamp(ruleScore, 0.00m, 1.00m), 2, MidpointRounding.AwayFromZero);
    }
}
