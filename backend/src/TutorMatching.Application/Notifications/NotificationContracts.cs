using System.Text.Json.Serialization;

namespace TutorMatching.Application.Notifications;

public sealed record NotificationDto(
    Guid Id,
    string Type,
    string Title,
    string? Body,
    DateTimeOffset CreatedAt,
    bool IsRead,
    DateTimeOffset? ReadAt);

public sealed record NotificationPageDto(
    IReadOnlyList<NotificationDto> Items,
    string? NextCursor,
    int UnreadCount,
    string ReadAllBoundary);

/// <param name="UnreadCount">Unread notifications shown on the bell; message notifications are excluded.</param>
/// <param name="MessageUnreadCount">Unread incoming messages across the caller's conversations (Messenger badge).</param>
public sealed record UnreadNotificationCountDto(int UnreadCount, int MessageUnreadCount, DateTimeOffset AsOf);

public sealed record ReadAllNotificationsRequest(string? Boundary);

public sealed record ReadAllNotificationsResultDto(int ChangedCount, int UnreadCount);

public sealed record NotificationTargetDto(
    string Kind,
    Guid Id,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] Guid? HireRequestId);

public sealed record OpenNotificationResultDto(
    NotificationDto Notification,
    NotificationTargetDto? Target,
    bool Unavailable);

public static class NotificationTargetKinds
{
    public const string HireRequest = "HIRE_REQUEST";
    public const string TutorProfile = "TUTOR_PROFILE";
    public const string Conversation = "CONVERSATION";
}

public static class NotificationTypes
{
    public const string MessageCreated = "MESSAGE_CREATED";

    // Rows written before the contract name was adopted by the message outbox worker.
    private const string LegacyMessageCreated = "NEW_MESSAGE";

    public static readonly IReadOnlyList<string> All =
    [
        "TUTOR_PROFILE_REVIEWED",
        "HIRE_REQUEST_CREATED",
        "HIRE_REQUEST_PROPOSED",
        "HIRE_REQUEST_ACCEPTED",
        "HIRE_REQUEST_REJECTED",
        "HIRE_REQUEST_CANCELLED",
        "HIRE_REQUEST_COMPLETED",
        "HIRE_PAYMENT_COMPLETED",
        "TUTOR_REVIEW_RECEIVED",
        "TUTOR_REVIEW_REPLIED",
        MessageCreated
    ];

    /// <summary>Stored type codes of message notifications (current and legacy); these never count on the bell.</summary>
    public static readonly IReadOnlyList<string> MessageTypeCodes = [MessageCreated, LegacyMessageCreated];

    public static string Normalize(string typeCode) =>
        typeCode == LegacyMessageCreated ? MessageCreated : typeCode;
}

public sealed class NotificationException(string code) : Exception(code)
{
    public string Code { get; } = code;
}
