using System.Text;
using Microsoft.EntityFrameworkCore;
using TutorMatching.Application.Abstractions;
using TutorMatching.Application.Messaging;
using TutorMatching.Domain.Messaging;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Infrastructure.Messaging;

public sealed class MessagingService : IMessagingService
{
    private readonly ApplicationDbContext _db;
    private readonly ICurrentUser _currentUser;
    private readonly IEventPublisher _eventPublisher;

    public MessagingService(
        ApplicationDbContext db,
        ICurrentUser currentUser,
        IEventPublisher eventPublisher)
    {
        _db = db;
        _currentUser = currentUser;
        _eventPublisher = eventPublisher;
    }

    public async Task<ConversationPageDto> GetConversationsAsync(string? cursor, int pageSize, CancellationToken ct = default)
    {
        if (_currentUser.UserId is not { } actorId)
        {
            return new ConversationPageDto([], null);
        }

        pageSize = Math.Clamp(pageSize, 1, 100);

        DateTimeOffset? cursorCreatedAt = null;
        Guid? cursorId = null;
        if (!string.IsNullOrWhiteSpace(cursor))
        {
            ParseCursor(cursor, out cursorCreatedAt, out cursorId);
        }

        var query = _db.Conversations
            .AsNoTracking()
            .Include(c => c.HireRequest)
                .ThenInclude(hr => hr!.TutorProfile)
            .Where(c => c.HireRequest != null &&
                (c.HireRequest.RequesterUserId == actorId ||
                 (c.HireRequest.TutorProfile != null && c.HireRequest.TutorProfile.UserId == actorId)));

        if (cursorCreatedAt.HasValue && cursorId.HasValue)
        {
            query = query.Where(c => c.CreatedAt < cursorCreatedAt.Value ||
                                    (c.CreatedAt == cursorCreatedAt.Value && c.Id < cursorId.Value));
        }

        var conversations = await query
            .OrderByDescending(c => c.CreatedAt)
            .ThenByDescending(c => c.Id)
            .Take(pageSize + 1)
            .ToListAsync(ct);

        string? nextCursor = null;
        if (conversations.Count > pageSize)
        {
            var nextItem = conversations[pageSize];
            nextCursor = CreateCursor(nextItem.CreatedAt, nextItem.Id);
            conversations = conversations.Take(pageSize).ToList();
        }

        var conversationIds = conversations.Select(c => c.Id).ToList();

        // Count unread for recipient
        var unreadCounts = await _db.Messages
            .AsNoTracking()
            .Where(m => conversationIds.Contains(m.ConversationId) &&
                        m.SenderUserId != actorId &&
                        m.ReadAt == null &&
                        m.DeletedAt == null)
            .GroupBy(m => m.ConversationId)
            .Select(g => new { ConversationId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.ConversationId, x => x.Count, ct);

        // Fetch participant names and avatars
        var otherUserIds = conversations.Select(c =>
        {
            var isRequester = c.HireRequest!.RequesterUserId == actorId;
            return isRequester ? c.HireRequest.TutorProfile!.UserId : c.HireRequest.RequesterUserId;
        }).Distinct().ToList();

        var tutorUserIds = conversations
            .Where(c => c.HireRequest?.TutorProfile != null)
            .Select(c => c.HireRequest!.TutorProfile!.UserId)
            .Distinct();

        var relevantUserIds = otherUserIds.Concat(tutorUserIds).Distinct().ToList();

        var users = await _db.Users
            .AsNoTracking()
            .Where(u => relevantUserIds.Contains(u.Id))
            .ToDictionaryAsync(
                u => u.Id,
                u => new
                {
                    DisplayName = string.IsNullOrWhiteSpace(u.FullName) ? (u.Email ?? "Người dùng") : u.FullName,
                    u.AvatarUrl
                },
                ct);

        var items = conversations.Select(c =>
        {
            var isRequester = c.HireRequest!.RequesterUserId == actorId;
            var tutorUserId = c.HireRequest.TutorProfile?.UserId;
            var otherId = isRequester ? (tutorUserId ?? Guid.Empty) : c.HireRequest.RequesterUserId;
            var otherUserData = users.GetValueOrDefault(otherId);
            var displayName = otherUserData?.DisplayName ?? "Người dùng";
            var unread = unreadCounts.GetValueOrDefault(c.Id, 0);

            var tutorAvatar = c.HireRequest.TutorProfile?.AvatarUrl;
            if (string.IsNullOrWhiteSpace(tutorAvatar) && tutorUserId.HasValue)
            {
                tutorAvatar = users.GetValueOrDefault(tutorUserId.Value)?.AvatarUrl;
            }

            var otherAvatar = isRequester ? tutorAvatar : otherUserData?.AvatarUrl;

            return new ConversationSummaryDto(
                c.Id,
                c.HireRequestId,
                c.HireRequest.StatusCode,
                new ParticipantSummary(otherId, displayName, otherAvatar),
                c.CreatedAt,
                c.ClosedAt,
                unread,
                c.ClosedAt == null,
                tutorAvatar);
        }).ToList();

        return new ConversationPageDto(items, nextCursor);
    }

    public async Task<ConversationSummaryDto?> GetConversationByIdAsync(Guid conversationId, CancellationToken ct = default)
    {
        if (_currentUser.UserId is not { } actorId)
        {
            return null;
        }

        var conv = await _db.Conversations
            .AsNoTracking()
            .Include(c => c.HireRequest)
                .ThenInclude(hr => hr!.TutorProfile)
            .FirstOrDefaultAsync(c => c.Id == conversationId, ct);

        if (conv?.HireRequest == null)
        {
            return null;
        }

        var isRequester = conv.HireRequest.RequesterUserId == actorId;
        var isTutor = conv.HireRequest.TutorProfile?.UserId == actorId;
        if (!isRequester && !isTutor)
        {
            return null;
        }

        var otherId = isRequester ? conv.HireRequest.TutorProfile!.UserId : conv.HireRequest.RequesterUserId;
        var otherUser = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == otherId, ct);

        var displayName = string.IsNullOrWhiteSpace(otherUser?.FullName)
            ? (otherUser?.Email ?? "Người dùng")
            : otherUser.FullName;

        var tutorAvatar = conv.HireRequest.TutorProfile?.AvatarUrl;
        if (string.IsNullOrWhiteSpace(tutorAvatar))
        {
            var tutorUserId = conv.HireRequest.TutorProfile?.UserId;
            if (isRequester)
            {
                tutorAvatar = otherUser?.AvatarUrl;
            }
            else if (tutorUserId.HasValue)
            {
                var tutorUser = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == tutorUserId.Value, ct);
                tutorAvatar = tutorUser?.AvatarUrl;
            }
        }

        var otherAvatar = isRequester ? tutorAvatar : otherUser?.AvatarUrl;

        var unread = await _db.Messages
            .AsNoTracking()
            .CountAsync(m => m.ConversationId == conversationId &&
                             m.SenderUserId != actorId &&
                             m.ReadAt == null &&
                             m.DeletedAt == null, ct);

        return new ConversationSummaryDto(
            conv.Id,
            conv.HireRequestId,
            conv.HireRequest.StatusCode,
            new ParticipantSummary(otherId, displayName, otherAvatar),
            conv.CreatedAt,
            conv.ClosedAt,
            unread,
            conv.ClosedAt == null,
            tutorAvatar);
    }

    public async Task<MessagePageDto?> GetMessagesAsync(Guid conversationId, string? cursor, int pageSize, CancellationToken ct = default)
    {
        if (_currentUser.UserId is not { } actorId)
        {
            return null;
        }

        pageSize = Math.Clamp(pageSize, 1, 100);

        var conv = await _db.Conversations
            .AsNoTracking()
            .Include(c => c.HireRequest)
                .ThenInclude(hr => hr!.TutorProfile)
            .FirstOrDefaultAsync(c => c.Id == conversationId, ct);

        if (conv?.HireRequest == null)
        {
            return null;
        }

        var isRequester = conv.HireRequest.RequesterUserId == actorId;
        var isTutor = conv.HireRequest.TutorProfile?.UserId == actorId;
        if (!isRequester && !isTutor)
        {
            return null;
        }

        DateTimeOffset? cursorSentAt = null;
        Guid? cursorId = null;
        if (!string.IsNullOrWhiteSpace(cursor))
        {
            ParseCursor(cursor, out cursorSentAt, out cursorId);
        }

        var query = _db.Messages
            .AsNoTracking()
            .Where(m => m.ConversationId == conversationId && m.DeletedAt == null);

        if (cursorSentAt.HasValue && cursorId.HasValue)
        {
            query = query.Where(m => m.SentAt < cursorSentAt.Value ||
                                    (m.SentAt == cursorSentAt.Value && m.Id < cursorId.Value));
        }

        var messages = await query
            .OrderByDescending(m => m.SentAt)
            .ThenByDescending(m => m.Id)
            .Take(pageSize + 1)
            .ToListAsync(ct);

        string? nextCursor = null;
        if (messages.Count > pageSize)
        {
            var nextItem = messages[pageSize];
            nextCursor = CreateCursor(nextItem.SentAt, nextItem.Id);
            messages = messages.Take(pageSize).ToList();
        }

        var senderIds = messages.Select(m => m.SenderUserId).Distinct().ToList();
        var senders = await _db.Users
            .AsNoTracking()
            .Where(u => senderIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => string.IsNullOrWhiteSpace(u.FullName) ? (u.Email ?? "Người dùng") : u.FullName, ct);

        var items = messages.Select(m => new MessageDto(
            m.Id,
            m.ConversationId,
            new MessageSenderDto(m.SenderUserId, senders.GetValueOrDefault(m.SenderUserId, "Người dùng")),
            m.Content,
            m.SentAt,
            m.ReadAt,
            m.ClientMessageId)).ToList();

        return new MessagePageDto(items, nextCursor);
    }

    public async Task<(MessageDto? Message, bool Conflict, bool Replay, string? Error)> SendMessageAsync(
        Guid conversationId,
        SendMessageRequest request,
        CancellationToken ct = default)
    {
        if (_currentUser.UserId is not { } actorId)
        {
            return (null, false, false, "unauthorized");
        }

        if (request.ClientMessageId == Guid.Empty)
        {
            return (null, false, false, "client_message_id_required");
        }

        var trimmedContent = (request.Content ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(trimmedContent))
        {
            return (null, false, false, "content_required");
        }

        if (trimmedContent.Length > 4000)
        {
            return (null, false, false, "content_too_long");
        }

        var conv = await _db.Conversations
            .Include(c => c.HireRequest)
                .ThenInclude(hr => hr!.TutorProfile)
            .FirstOrDefaultAsync(c => c.Id == conversationId, ct);

        if (conv?.HireRequest == null)
        {
            return (null, false, false, "not_found");
        }

        var isRequester = conv.HireRequest.RequesterUserId == actorId;
        var isTutor = conv.HireRequest.TutorProfile?.UserId == actorId;
        if (!isRequester && !isTutor)
        {
            return (null, false, false, "not_found");
        }

        if (conv.ClosedAt != null)
        {
            return (null, false, false, "conversation_closed");
        }

        var otherId = isRequester ? conv.HireRequest.TutorProfile!.UserId : conv.HireRequest.RequesterUserId;

        // Idempotency check with ClientMessageId
        var existing = await _db.Messages
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.ConversationId == conversationId &&
                                     m.SenderUserId == actorId &&
                                     m.ClientMessageId == request.ClientMessageId, ct);

        if (existing != null)
        {
            var senderUser = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == actorId, ct);
            var senderName = string.IsNullOrWhiteSpace(senderUser?.FullName) ? (senderUser?.Email ?? "Người dùng") : senderUser.FullName;

            if (existing.Content == trimmedContent)
            {
                var replayDto = new MessageDto(
                    existing.Id,
                    existing.ConversationId,
                    new MessageSenderDto(existing.SenderUserId, senderName),
                    existing.Content,
                    existing.SentAt,
                    existing.ReadAt,
                    existing.ClientMessageId);

                return (replayDto, false, true, null);
            }

            return (null, true, false, "conflict_content_mismatch");
        }

        var now = DateTimeOffset.UtcNow;
        var message = new Message
        {
            Id = Guid.NewGuid(),
            ConversationId = conversationId,
            SenderUserId = actorId,
            ClientMessageId = request.ClientMessageId,
            Content = trimmedContent,
            SentAt = now
        };

        var outbox = new MessageNotificationOutbox
        {
            Id = Guid.NewGuid(),
            MessageId = message.Id,
            RecipientUserId = otherId,
            CreatedAt = now
        };

        _db.Messages.Add(message);
        _db.MessageNotificationOutboxes.Add(outbox);
        await _db.SaveChangesAsync(ct);

        var sender = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == actorId, ct);
        var authorName = string.IsNullOrWhiteSpace(sender?.FullName) ? (sender?.Email ?? "Người dùng") : sender.FullName;

        var messageDto = new MessageDto(
            message.Id,
            message.ConversationId,
            new MessageSenderDto(actorId, authorName),
            message.Content,
            message.SentAt,
            message.ReadAt,
            message.ClientMessageId);

        // Publish SignalR event post-commit
        await _eventPublisher.PublishMessageCreatedAsync(conversationId, message.Id, [otherId], ct);

        return (messageDto, false, false, null);
    }

    public async Task<MarkReadResultDto?> MarkReadAsync(Guid conversationId, MarkReadRequest request, CancellationToken ct = default)
    {
        if (_currentUser.UserId is not { } actorId)
        {
            return null;
        }

        var conv = await _db.Conversations
            .Include(c => c.HireRequest)
                .ThenInclude(hr => hr!.TutorProfile)
            .FirstOrDefaultAsync(c => c.Id == conversationId, ct);

        if (conv?.HireRequest == null)
        {
            return null;
        }

        var isRequester = conv.HireRequest.RequesterUserId == actorId;
        var isTutor = conv.HireRequest.TutorProfile?.UserId == actorId;
        if (!isRequester && !isTutor)
        {
            return null;
        }

        if (request.MessageIds == null || request.MessageIds.Count == 0)
        {
            return new MarkReadResultDto(DateTimeOffset.UtcNow, 0);
        }

        var targetIds = request.MessageIds.Take(100).ToList();
        var now = DateTimeOffset.UtcNow;

        var unreadMessages = await _db.Messages
            .Where(m => m.ConversationId == conversationId &&
                        m.SenderUserId != actorId &&
                        m.ReadAt == null &&
                        targetIds.Contains(m.Id))
            .ToListAsync(ct);

        if (unreadMessages.Count > 0)
        {
            foreach (var m in unreadMessages)
            {
                m.ReadAt = now;
            }

            await _db.SaveChangesAsync(ct);

            var otherId = isRequester ? conv.HireRequest.TutorProfile!.UserId : conv.HireRequest.RequesterUserId;
            await _eventPublisher.PublishMessagesReadAsync(conversationId, [otherId], ct);
        }

        return new MarkReadResultDto(now, unreadMessages.Count);
    }

    private static string CreateCursor(DateTimeOffset timestamp, Guid id)
    {
        var raw = $"{timestamp.ToUnixTimeMilliseconds()}:{id}";
        return Convert.ToBase64String(Encoding.UTF8.GetBytes(raw));
    }

    private static void ParseCursor(string cursor, out DateTimeOffset? timestamp, out Guid? id)
    {
        timestamp = null;
        id = null;
        try
        {
            var raw = Encoding.UTF8.GetString(Convert.FromBase64String(cursor));
            var parts = raw.Split(':');
            if (parts.Length == 2 &&
                long.TryParse(parts[0], out var ms) &&
                Guid.TryParse(parts[1], out var parsedId))
            {
                timestamp = DateTimeOffset.FromUnixTimeMilliseconds(ms);
                id = parsedId;
            }
        }
        catch
        {
            // invalid cursor will be ignored
        }
    }
}
