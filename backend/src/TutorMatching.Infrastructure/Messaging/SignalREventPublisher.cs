using Microsoft.AspNetCore.SignalR;
using TutorMatching.Application.Abstractions;

namespace TutorMatching.Infrastructure.Messaging;

public sealed class SignalREventPublisher<THub> : IEventPublisher where THub : Hub
{
    private readonly IHubContext<THub> _hubContext;

    public SignalREventPublisher(IHubContext<THub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task PublishMessageCreatedAsync(Guid conversationId, Guid messageId, IEnumerable<Guid> recipientUserIds, CancellationToken cancellationToken = default)
    {
        var payload = new
        {
            schemaVersion = 1,
            eventId = Guid.NewGuid(),
            conversationId,
            messageId
        };

        foreach (var userId in recipientUserIds)
        {
            await _hubContext.Clients.Group($"user:{userId}")
                .SendAsync("MessageCreated", payload, cancellationToken);
        }
    }

    public async Task PublishMessagesReadAsync(Guid conversationId, IEnumerable<Guid> participantUserIds, CancellationToken cancellationToken = default)
    {
        var payload = new
        {
            schemaVersion = 1,
            eventId = Guid.NewGuid(),
            conversationId
        };

        foreach (var userId in participantUserIds)
        {
            await _hubContext.Clients.Group($"user:{userId}")
                .SendAsync("MessagesRead", payload, cancellationToken);
        }
    }

    public async Task PublishNotificationsChangedAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var payload = new
        {
            schemaVersion = 1,
            eventId = Guid.NewGuid()
        };

        await _hubContext.Clients.Group($"user:{userId}")
            .SendAsync("NotificationsChanged", payload, cancellationToken);
    }
}
