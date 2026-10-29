using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using System.Text.Json;

namespace TutorMatching.Application.Hiring;

// ==================== GENERAL DTO =============================
[JsonNumberHandling(JsonNumberHandling.Strict)]
[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed class HireSchedule
{
    [JsonPropertyName("dayOfWeek"), JsonRequired, Required, Range(1, 7)]
    public int DayOfWeek { get; init; }
    [JsonPropertyName("startTime"), JsonRequired, Required, RegularExpression(@"^([01][0-9]|2[0-3]):[0-5][0-9]$")]
    public string StartTime { get; init; } = null!;
    [JsonPropertyName("endTime"), JsonRequired, Required, RegularExpression(@"^([01][0-9]|2[0-3]):[0-5][0-9]$")]
    public string EndTime { get; init; } = null!;
}

[JsonNumberHandling(JsonNumberHandling.Strict)]
[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed class HireTermsDto
{
    [JsonPropertyName("startDate"), JsonRequired, Required]
    public DateOnly StartDate { get; init; }
    [JsonPropertyName("sessionsPerWeek"), JsonRequired, Required, Range(1, 21)]
    public int SessionsPerWeek { get; init; }
    [JsonPropertyName("durationMinutes"), JsonRequired, Required, Range(30, 240)]
    public int DurationMinutes { get; init; }
    [JsonPropertyName("teachingMode"), JsonRequired, Required, RegularExpression(@"^(ONLINE|OFFLINE|HYBRID)$")]
    public string TeachingMode { get; init; } = null!;
    [JsonPropertyName("provinceCode"), JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull), JsonConverter(typeof(NonNullIfPresentConverter<string>))]
    public string? ProvinceCode { get; init; }
    [JsonPropertyName("districtCode"), JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull), JsonConverter(typeof(NonNullIfPresentConverter<string>))]
    public string? DistrictCode { get; init; }
    [JsonPropertyName("locationDetail"), JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull), StringLength(500), JsonConverter(typeof(NonNullIfPresentConverter<string>))]
    public string? LocationDetail { get; init; }
    [JsonPropertyName("priceVnd"), JsonRequired, Required, Range(1, 2147483647)]
    public int PriceVnd { get; init; }
    [JsonPropertyName("schedules"), JsonRequired, Required, MinLength(1), MaxLength(147)]
    public HireSchedule[] Schedules { get; init; } = null!;
}

[JsonNumberHandling(JsonNumberHandling.Strict)]
[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed class HireProposal
{
    [JsonPropertyName("sequence"), JsonRequired, Required, Range(1, 2147483647)]
    public int Sequence { get; init; }
    [JsonPropertyName("senderId"), JsonRequired, Required]
    public Guid SenderId { get; init; }
    [JsonPropertyName("terms"), JsonRequired, Required]
    public HireTermsDto Terms { get; init; } = null!;
    [JsonPropertyName("note"), JsonRequired]
    public string? Note { get; init; }
    [JsonPropertyName("createdAt"), JsonRequired, Required]
    public DateTimeOffset CreatedAt { get; init; }
}

[JsonNumberHandling(JsonNumberHandling.Strict)]
[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed class HireAgreement
{
    [JsonPropertyName("terms"), JsonRequired, Required]
    public HireTermsDto Terms { get; init; } = null!;
    [JsonPropertyName("acceptedBy"), JsonRequired, Required]
    public Guid AcceptedBy { get; init; }
    [JsonPropertyName("acceptedAt"), JsonRequired, Required]
    public DateTimeOffset AcceptedAt { get; init; }
    [JsonPropertyName("proposalSequence"), JsonRequired, Range(1, 2147483647)]
    public int? ProposalSequence { get; init; }
    [JsonPropertyName("provinceName"), JsonRequired]
    public string? ProvinceName { get; init; }
    [JsonPropertyName("districtName"), JsonRequired]
    public string? DistrictName { get; init; }
}

[JsonNumberHandling(JsonNumberHandling.Strict)]
[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed class HireEvent
{
    [JsonPropertyName("sequence"), JsonRequired, Required, Range(1, 2147483647)]
    public int Sequence { get; init; }
    [JsonPropertyName("actorId"), JsonRequired]
    public Guid? ActorId { get; init; }
    [JsonPropertyName("fromStatus"), JsonRequired, RegularExpression(@"^(PENDING|NEGOTIATING|ACCEPTED|REJECTED|CANCELLED|COMPLETED)$")]
    public string? FromStatus { get; init; }
    [JsonPropertyName("toStatus"), JsonRequired, Required, RegularExpression(@"^(PENDING|NEGOTIATING|ACCEPTED|REJECTED|CANCELLED|COMPLETED)$")]
    public string ToStatus { get; init; } = null!;
    [JsonPropertyName("reason"), JsonRequired]
    public string? Reason { get; init; }
    [JsonPropertyName("createdAt"), JsonRequired, Required]
    public DateTimeOffset CreatedAt { get; init; }
}


[JsonNumberHandling(JsonNumberHandling.Strict)]
[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed class HireIdentity
{
    [JsonPropertyName("id"), JsonRequired, Required]
    public Guid Id { get; init; }
    [JsonPropertyName("displayName"), JsonRequired, Required]
    public string DisplayName { get; init; } = null!;
}

// ==============================================================

// ====================== Client Request ========================
[JsonNumberHandling(JsonNumberHandling.Strict)]
[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed class CreateHireRequestCommand
{
    [JsonPropertyName("startDate"), JsonRequired, Required]
    public DateOnly StartDate { get; init; }
    [JsonPropertyName("sessionsPerWeek"), JsonRequired, Required, Range(1, 21)]
    public int SessionsPerWeek { get; init; }
    [JsonPropertyName("durationMinutes"), JsonRequired, Required, Range(30, 240)]
    public int DurationMinutes { get; init; }
    [JsonPropertyName("teachingMode"), JsonRequired, Required, RegularExpression(@"^(ONLINE|OFFLINE|HYBRID)$")]
    public string TeachingMode { get; init; } = null!;
    [JsonPropertyName("provinceCode"), JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull), JsonConverter(typeof(NonNullIfPresentConverter<string>))]
    public string? ProvinceCode { get; init; }
    [JsonPropertyName("districtCode"), JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull), JsonConverter(typeof(NonNullIfPresentConverter<string>))]
    public string? DistrictCode { get; init; }
    [JsonPropertyName("locationDetail"), JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull), StringLength(500), JsonConverter(typeof(NonNullIfPresentConverter<string>))]
    public string? LocationDetail { get; init; }
    [JsonPropertyName("priceVnd"), JsonRequired, Required, Range(1, 2147483647)]
    public int PriceVnd { get; init; }
    [JsonPropertyName("schedules"), JsonRequired, Required, MinLength(1), MaxLength(147)]
    public HireSchedule[] Schedules { get; init; } = null!;
    [JsonPropertyName("tutorProfileId"), JsonRequired, Required]
    public Guid TutorProfileId { get; init; }
    [JsonPropertyName("subjectId"), JsonRequired, Required]
    public Guid SubjectId { get; init; }
    [JsonPropertyName("courseId"), JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull), JsonConverter(typeof(NonNullIfPresentConverter<Guid?>))]
    public Guid? CourseId { get; init; }
    [JsonPropertyName("expectedListedPriceVnd"), JsonRequired, Required, Range(1, 2147483647)]
    public int ExpectedListedPriceVnd { get; init; }
    [JsonPropertyName("note"), JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull), StringLength(2000), JsonConverter(typeof(NonNullIfPresentConverter<string>))]
    public string? Note { get; init; }
}


[JsonNumberHandling(JsonNumberHandling.Strict)]
[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed class ProposeHireRequestCommand : IValidatableObject
{
    [JsonPropertyName("expectedVersion"), JsonRequired, Required]
    public Guid ExpectedVersion { get; init; }
    [JsonPropertyName("priceVnd"), JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull), Range(1, 2147483647), JsonConverter(typeof(NonNullIfPresentConverter<int?>))]
    public int? PriceVnd { get; init; }
    [JsonPropertyName("schedules"), JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull), MinLength(1), MaxLength(147), JsonConverter(typeof(NonNullIfPresentConverter<HireSchedule[]>))]
    public HireSchedule[]? Schedules { get; init; }
    [JsonPropertyName("note"), JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull), StringLength(2000), JsonConverter(typeof(NonNullIfPresentConverter<string>))]
    public string? Note { get; init; }
    public IEnumerable<ValidationResult> Validate(ValidationContext context)
    {
        if (PriceVnd is null && Schedules is null)
            yield return new ValidationResult("A price or schedule is required.", ["priceVnd", "schedules"]);
    }
}



[JsonNumberHandling(JsonNumberHandling.Strict)]
[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed class AcceptHireRequestCommand
{
    [JsonPropertyName("expectedVersion"), JsonRequired, Required]
    public Guid ExpectedVersion { get; init; }
    [JsonPropertyName("proposalSequence"), JsonRequired, Range(1, 2147483647)]
    public int? ProposalSequence { get; init; }
}

[JsonNumberHandling(JsonNumberHandling.Strict)]
[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed class RejectHireRequestCommand
{
    [JsonPropertyName("expectedVersion"), JsonRequired, Required]
    public Guid ExpectedVersion { get; init; }
    [JsonPropertyName("reason"), JsonRequired, Required, StringLength(1000, MinimumLength = 1)]
    public string Reason { get; init; } = null!;
}

[JsonNumberHandling(JsonNumberHandling.Strict)]
[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed class CloseHireRequestCommand
{
    [JsonPropertyName("expectedVersion"), JsonRequired, Required]
    public Guid ExpectedVersion { get; init; }
    [JsonPropertyName("confirmed"), JsonRequired, Required, Range(typeof(bool), "true", "true")]
    public bool Confirmed { get; init; }
}

[JsonNumberHandling(JsonNumberHandling.Strict)]
[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed class HireAction
{
    [JsonPropertyName("expectedVersion"), JsonRequired, Required]
    public Guid ExpectedVersion { get; init; }
}

// ============================================================================

// ======================== DTO Response ======================================
[JsonNumberHandling(JsonNumberHandling.Strict)]
[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed class HireCreated
{
    [JsonPropertyName("id"), JsonRequired, Required]
    public Guid Id { get; init; }
    [JsonPropertyName("version"), JsonRequired, Required]
    public Guid Version { get; init; }
    [JsonPropertyName("status"), JsonRequired, Required, RegularExpression(@"^(PENDING|NEGOTIATING|ACCEPTED|REJECTED|CANCELLED|COMPLETED)$")]
    public string Status { get; init; } = null!;
    [JsonPropertyName("conversationId"), JsonRequired, Required]
    public Guid ConversationId { get; init; }
}

[JsonNumberHandling(JsonNumberHandling.Strict)]
[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed class HireResult
{
    [JsonPropertyName("id"), JsonRequired, Required]
    public Guid Id { get; init; }
    [JsonPropertyName("version"), JsonRequired, Required]
    public Guid Version { get; init; }
    [JsonPropertyName("status"), JsonRequired, Required, RegularExpression(@"^(PENDING|NEGOTIATING|ACCEPTED|REJECTED|CANCELLED|COMPLETED)$")]
    public string Status { get; init; } = null!;
}

[JsonNumberHandling(JsonNumberHandling.Strict)]
[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed class HireSummary
{
    [JsonPropertyName("id"), JsonRequired, Required]
    public Guid Id { get; init; }
    [JsonPropertyName("version"), JsonRequired, Required]
    public Guid Version { get; init; }
    [JsonPropertyName("status"), JsonRequired, Required, RegularExpression(@"^(PENDING|NEGOTIATING|ACCEPTED|REJECTED|CANCELLED|COMPLETED)$")]
    public string Status { get; init; } = null!;
    [JsonPropertyName("learner"), JsonRequired, Required]
    public HireIdentity Learner { get; init; } = null!;
    [JsonPropertyName("tutor"), JsonRequired, Required]
    public HireIdentity Tutor { get; init; } = null!;
    [JsonPropertyName("createdAt"), JsonRequired, Required]
    public DateTimeOffset CreatedAt { get; init; }
}

[JsonNumberHandling(JsonNumberHandling.Strict)]
[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed class HireDetail
{
    [JsonPropertyName("id"), JsonRequired, Required]
    public Guid Id { get; init; }
    [JsonPropertyName("version"), JsonRequired, Required]
    public Guid Version { get; init; }
    [JsonPropertyName("status"), JsonRequired, Required, RegularExpression(@"^(PENDING|NEGOTIATING|ACCEPTED|REJECTED|CANCELLED|COMPLETED)$")]
    public string Status { get; init; } = null!;
    [JsonPropertyName("learner"), JsonRequired, Required]
    public HireIdentity Learner { get; init; } = null!;
    [JsonPropertyName("tutor"), JsonRequired, Required]
    public HireIdentity Tutor { get; init; } = null!;
    [JsonPropertyName("createdAt"), JsonRequired, Required]
    public DateTimeOffset CreatedAt { get; init; }
    [JsonPropertyName("initialTerms"), JsonRequired, Required]
    public HireTermsDto InitialTerms { get; init; } = null!;
    [JsonPropertyName("currentTerms"), JsonRequired, Required]
    public HireTermsDto CurrentTerms { get; init; } = null!;
    [JsonPropertyName("finalAgreement"), JsonRequired]
    public HireAgreement? FinalAgreement { get; init; }
    [JsonPropertyName("proposals"), JsonRequired, Required]
    public HireProposal[] Proposals { get; init; } = null!;
    [JsonPropertyName("history"), JsonRequired, Required]
    public HireEvent[] History { get; init; } = null!;
    [JsonPropertyName("conversationId"), JsonRequired, Required]
    public Guid ConversationId { get; init; }
    [JsonPropertyName("allowedActions"), JsonRequired, Required]
    public string[] AllowedActions { get; init; } = null!;
}

[JsonNumberHandling(JsonNumberHandling.Strict)]
[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed class HirePage
{
    [JsonPropertyName("items"), JsonRequired, Required]
    public HireSummary[] Items { get; init; } = null!;
    [JsonPropertyName("nextCursor"), JsonRequired]
    public string? NextCursor { get; init; }
}

[JsonNumberHandling(JsonNumberHandling.Strict)]
[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed class HireProblem
{
    [JsonPropertyName("type"), JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull), JsonConverter(typeof(NonNullIfPresentConverter<string>))]
    public string? Type { get; init; }
    [JsonPropertyName("title"), JsonRequired, Required]
    public string Title { get; init; } = null!;
    [JsonPropertyName("status"), JsonRequired, Required]
    public int Status { get; init; }
    [JsonPropertyName("code"), JsonRequired, Required]
    public string Code { get; init; } = null!;
    [JsonPropertyName("errors"), JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull), JsonConverter(typeof(NonNullIfPresentConverter<Dictionary<string, string[]>>))]
    public Dictionary<string, string[]>? Errors { get; init; }
}
// ==============================================================

// Optional fields may be omitted; JSON null is accepted only where the OpenAPI schema says nullable.
public sealed class NonNullIfPresentConverter<T> : JsonConverter<T>
{
    public override bool HandleNull => true;
    public override T Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null) throw new JsonException("Omit the optional property instead of sending null.");
        return JsonSerializer.Deserialize<T>(ref reader, options)!;
    }
    public override void Write(Utf8JsonWriter writer, T value, JsonSerializerOptions options) =>
        JsonSerializer.Serialize(writer, value, options);
}
