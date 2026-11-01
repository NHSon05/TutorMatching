using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TutorMatching.Application.Abstractions;
using TutorMatching.Domain.Notifications;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Infrastructure.Messaging;

public sealed class MessageNotificationOutboxWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<MessageNotificationOutboxWorker> _logger;

    public MessageNotificationOutboxWorker(
        IServiceProvider serviceProvider,
        ILogger<MessageNotificationOutboxWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessBatchAsync(stoppingToken);
            }
            catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogError(ex, "Error occurred processing message notification outbox batch");
            }

            await Task.Delay(TimeSpan.FromSeconds(3), stoppingToken);
        }
    }

    private async Task ProcessBatchAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var eventPublisher = scope.ServiceProvider.GetService<IEventPublisher>();

        var now = DateTimeOffset.UtcNow;
        var pendingItems = await db.MessageNotificationOutboxes
            .Where(x => x.DeliveredAt == null && (x.NextAttemptAt == null || x.NextAttemptAt <= now))
            .OrderBy(x => x.CreatedAt)
            .Take(20)
            .ToListAsync(cancellationToken);

        if (pendingItems.Count == 0)
        {
            return;
        }

        foreach (var item in pendingItems)
        {
            try
            {
                var existingNotification = await db.Notifications
                    .AnyAsync(n => n.UserId == item.RecipientUserId && n.MessageId == item.MessageId, cancellationToken);

                if (!existingNotification)
                {
                    var notification = new Notification
                    {
                        Id = Guid.NewGuid(),
                        UserId = item.RecipientUserId,
                        TypeCode = "NEW_MESSAGE",
                        Title = "Bạn có tin nhắn mới",
                        MessageId = item.MessageId,
                        IsRead = false,
                        CreatedAt = DateTimeOffset.UtcNow
                    };

                    db.Notifications.Add(notification);
                }

                item.DeliveredAt = DateTimeOffset.UtcNow;
                await db.SaveChangesAsync(cancellationToken);

                if (eventPublisher != null)
                {
                    await eventPublisher.PublishNotificationsChangedAsync(item.RecipientUserId, cancellationToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to deliver message notification outbox item {OutboxId}", item.Id);
                item.AttemptCount++;
                item.NextAttemptAt = DateTimeOffset.UtcNow.AddSeconds(Math.Min(60, Math.Pow(2, item.AttemptCount)));
                await db.SaveChangesAsync(cancellationToken);
            }
        }
    }
}
