namespace TutorMatching.Application.Messaging;

public interface IMessagingService
{
    Task<ConversationPageDto> GetConversationsAsync(string? cursor, int pageSize, CancellationToken ct = default);
    Task<ConversationSummaryDto?> GetConversationByIdAsync(Guid conversationId, CancellationToken ct = default);
    Task<MessagePageDto?> GetMessagesAsync(Guid conversationId, string? cursor, int pageSize, CancellationToken ct = default);
    Task<(MessageDto? Message, bool Conflict, bool Replay, string? Error)> SendMessageAsync(Guid conversationId, SendMessageRequest request, CancellationToken ct = default);
    Task<MarkReadResultDto?> MarkReadAsync(Guid conversationId, MarkReadRequest request, CancellationToken ct = default);
}
