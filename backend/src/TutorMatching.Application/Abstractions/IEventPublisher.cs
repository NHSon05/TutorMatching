namespace TutorMatching.Application.Abstractions;

public interface IEventPublisher
{
    Task PublishMessageCreatedAsync(Guid conversationId, Guid messageId, IEnumerable<Guid> recipientUserIds, CancellationToken cancellationToken = default);
    Task PublishMessagesReadAsync(Guid conversationId, IEnumerable<Guid> participantUserIds, CancellationToken cancellationToken = default);
    Task PublishNotificationsChangedAsync(Guid userId, CancellationToken cancellationToken = default);
}
