namespace TutorMatching.Application.Messaging;

public record ParticipantSummary(Guid Id, string DisplayName, string? AvatarUrl = null);

public record ConversationSummaryDto(
    Guid Id,
    Guid HireRequestId,
    string RequestStatus,
    ParticipantSummary OtherParticipant,
    DateTimeOffset CreatedAt,
    DateTimeOffset? ClosedAt,
    int UnreadCount,
    bool CanSend,
    string? AvatarUrl = null)
{
    public string? TutorAvatarUrl => AvatarUrl;
}

public record ConversationPageDto(
    IReadOnlyList<ConversationSummaryDto> Items,
    string? NextCursor);

public record MessageSenderDto(Guid Id, string DisplayName);

public record MessageDto(
    Guid Id,
    Guid ConversationId,
    MessageSenderDto Sender,
    string Content,
    DateTimeOffset SentAt,
    DateTimeOffset? ReadAt,
    Guid? ClientMessageId);

public record MessagePageDto(
    IReadOnlyList<MessageDto> Items,
    string? NextCursor);

public record SendMessageRequest(Guid ClientMessageId, string Content);

public record MarkReadRequest(IReadOnlyList<Guid> MessageIds);

public record MarkReadResultDto(DateTimeOffset ReadAt, int ChangedCount);
