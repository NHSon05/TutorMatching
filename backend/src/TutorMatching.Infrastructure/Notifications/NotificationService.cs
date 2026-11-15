using System.Globalization;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TutorMatching.Application.Abstractions;
using TutorMatching.Application.Notifications;
using TutorMatching.Domain.Notifications;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Infrastructure.Notifications;

public sealed class NotificationService(
    ApplicationDbContext db,
    ICurrentUser currentUser,
    IClock clock,
    ILogger<NotificationService> logger,
    IEventPublisher? eventPublisher = null) : INotificationService
{
    private const string CursorVersion = "c1";
    private const string BoundaryVersion = "b1";

    public async Task<NotificationPageDto> ListAsync(bool unreadOnly, string? cursor, int pageSize, CancellationToken ct = default)
    {
        var owner = RequireOwner();
        pageSize = Math.Clamp(pageSize, 1, 100);

        var owned = db.Notifications.AsNoTracking().Where(n => n.UserId == owner);
        DateTimeOffset snapshot;
        DateTimeOffset? lastCreatedAt = null;
        Guid? lastId = null;
        if (string.IsNullOrWhiteSpace(cursor))
        {
            // The initial upper boundary keeps later pages and read-all bound to what this list showed.
            snapshot = await owned.MaxAsync(n => (DateTimeOffset?)n.CreatedAt, ct) ?? DateTimeOffset.UnixEpoch;
        }
        else
        {
            (snapshot, lastCreatedAt, lastId) = ParseCursor(cursor, owner, unreadOnly);
        }

        var query = owned.Where(n => n.CreatedAt <= snapshot);
        if (unreadOnly) query = query.Where(n => !n.IsRead);
        if (lastCreatedAt is { } at && lastId is { } id)
            query = query.Where(n => n.CreatedAt < at || (n.CreatedAt == at && n.Id < id));

        var rows = await query
            .OrderByDescending(n => n.CreatedAt)
            .ThenByDescending(n => n.Id)
            .Take(pageSize + 1)
            .ToListAsync(ct);

        string? nextCursor = null;
        if (rows.Count > pageSize)
        {
            rows.RemoveAt(pageSize);
            var last = rows[^1];
            nextCursor = CreateCursor(owner, unreadOnly, snapshot, last.CreatedAt, last.Id);
        }

        var unreadCount = await BellUnread(owned).CountAsync(ct);
        return new NotificationPageDto(rows.Select(ToDto).ToList(), nextCursor, unreadCount, CreateBoundary(owner, snapshot));
    }

    // Message notifications are surfaced on the Messenger icon, never on the bell badge.
    private static IQueryable<Notification> BellUnread(IQueryable<Notification> owned) =>
        owned.Where(n => !n.IsRead && !NotificationTypes.MessageTypeCodes.Contains(n.TypeCode));

    public async Task<UnreadNotificationCountDto> GetUnreadCountAsync(CancellationToken ct = default)
    {
        var owner = RequireOwner();
        var asOf = clock.UtcNow;
        var count = await BellUnread(db.Notifications.AsNoTracking().Where(n => n.UserId == owner)).CountAsync(ct);
        // Real unread messages (not message notifications), so the Messenger badge clears as soon as
        // the conversation is read.
        var messages = await db.Messages.AsNoTracking()
            .Where(m => m.SenderUserId != owner && m.ReadAt == null && m.DeletedAt == null)
            .Join(db.Conversations.AsNoTracking(), m => m.ConversationId, c => c.Id, (m, c) => c.HireRequestId)
            .Join(db.HireRequests.AsNoTracking(), id => id, r => r.Id, (_, r) => r)
            .Where(r => r.RequesterUserId == owner || r.TutorProfile!.UserId == owner)
            .CountAsync(ct);
        return new UnreadNotificationCountDto(count, messages, asOf);
    }

    public async Task<NotificationDto> MarkReadAsync(Guid id, CancellationToken ct = default)
    {
        var owner = RequireOwner();
        var notification = await FindOwnedAsync(owner, id, ct);
        if (MarkRead(notification))
        {
            await db.SaveChangesAsync(ct);
            await PublishChangedAsync(owner);
        }
        return ToDto(notification);
    }

    public async Task<ReadAllNotificationsResultDto> MarkAllReadAsync(string? boundary, CancellationToken ct = default)
    {
        var owner = RequireOwner();
        var upper = ParseBoundary(boundary, owner);
        var now = clock.UtcNow;
        // Arrivals after the boundary stay unread; existing ReadAt values are never overwritten.
        var changed = await db.Notifications
            .Where(n => n.UserId == owner && !n.IsRead && n.CreatedAt <= upper)
            .ExecuteUpdateAsync(s => s
                .SetProperty(n => n.IsRead, true)
                .SetProperty(n => n.ReadAt, n => n.ReadAt ?? now), ct);
        var unreadCount = await BellUnread(db.Notifications.AsNoTracking().Where(n => n.UserId == owner)).CountAsync(ct);
        if (changed > 0) await PublishChangedAsync(owner);
        return new ReadAllNotificationsResultDto(changed, unreadCount);
    }

    public async Task<OpenNotificationResultDto> OpenAsync(Guid id, CancellationToken ct = default)
    {
        var owner = RequireOwner();
        var notification = await FindOwnedAsync(owner, id, ct);
        var target = await ResolveTargetAsync(owner, notification, ct);
        if (MarkRead(notification))
        {
            await db.SaveChangesAsync(ct);
            await PublishChangedAsync(owner);
        }
        return new OpenNotificationResultDto(ToDto(notification), target, target is null);
    }

    // Rechecks the reference and current participation now; an absent or inaccessible target is
    // reported only as unavailable so the caller learns nothing about it.
    private async Task<NotificationTargetDto?> ResolveTargetAsync(Guid owner, Notification notification, CancellationToken ct)
    {
        if (notification.MessageId is { } messageId)
        {
            var conversation = await (
                from message in db.Messages.AsNoTracking()
                join conv in db.Conversations.AsNoTracking() on message.ConversationId equals conv.Id
                join request in db.HireRequests.AsNoTracking() on conv.HireRequestId equals request.Id
                join profile in db.TutorProfiles.AsNoTracking() on request.TutorProfileId equals profile.Id
                where message.Id == messageId && message.DeletedAt == null &&
                      (request.RequesterUserId == owner || profile.UserId == owner)
                select new { conv.Id, conv.HireRequestId }).SingleOrDefaultAsync(ct);
            return conversation is null
                ? null
                : new NotificationTargetDto(NotificationTargetKinds.Conversation, conversation.Id, conversation.HireRequestId);
        }

        if (notification.HireRequestId is { } requestId)
        {
            var accessible = await (
                from request in db.HireRequests.AsNoTracking()
                join profile in db.TutorProfiles.AsNoTracking() on request.TutorProfileId equals profile.Id
                where request.Id == requestId && (request.RequesterUserId == owner || profile.UserId == owner)
                select request.Id).AnyAsync(ct);
            return accessible ? new NotificationTargetDto(NotificationTargetKinds.HireRequest, requestId, requestId) : null;
        }

        if (notification.TutorProfileId is { } profileId)
        {
            var owns = await db.TutorProfiles.AsNoTracking().AnyAsync(p => p.Id == profileId && p.UserId == owner, ct);
            return owns ? new NotificationTargetDto(NotificationTargetKinds.TutorProfile, profileId, null) : null;
        }

        return null;
    }

    private async Task<Notification> FindOwnedAsync(Guid owner, Guid id, CancellationToken ct) =>
        await db.Notifications.SingleOrDefaultAsync(n => n.Id == id && n.UserId == owner, ct)
        ?? throw new NotificationException("not_found");

    private bool MarkRead(Notification notification)
    {
        if (notification.IsRead) return false;
        notification.IsRead = true;
        notification.ReadAt ??= clock.UtcNow;
        return true;
    }

    private Guid RequireOwner() =>
        currentUser.UserId ?? throw new NotificationException("unauthorized");

    // Push is a hint only; the committed read state is recovered through REST if this fails.
    private async Task PublishChangedAsync(Guid owner)
    {
        if (eventPublisher is null) return;
        try
        {
            await eventPublisher.PublishNotificationsChangedAsync(owner, CancellationToken.None);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to publish NotificationsChanged hint");
        }
    }

    private static NotificationDto ToDto(Notification n) => new(
        n.Id, NotificationTypes.Normalize(n.TypeCode), n.Title, n.Body, n.CreatedAt, n.IsRead, n.ReadAt);

    private static string CreateCursor(Guid owner, bool unreadOnly, DateTimeOffset snapshot, DateTimeOffset lastCreatedAt, Guid lastId) =>
        Encode(string.Join('|', CursorVersion, owner.ToString("N"), unreadOnly ? "1" : "0",
            snapshot.UtcTicks.ToString(CultureInfo.InvariantCulture),
            lastCreatedAt.UtcTicks.ToString(CultureInfo.InvariantCulture), lastId.ToString("N")));

    private static (DateTimeOffset Snapshot, DateTimeOffset LastCreatedAt, Guid LastId) ParseCursor(string cursor, Guid owner, bool unreadOnly)
    {
        var parts = Decode(cursor, "invalid_cursor").Split('|');
        if (parts.Length != 6 || parts[0] != CursorVersion ||
            !Guid.TryParseExact(parts[1], "N", out var cursorOwner) || cursorOwner != owner ||
            parts[2] != (unreadOnly ? "1" : "0") ||
            !TryParseTicks(parts[3], out var snapshot) || !TryParseTicks(parts[4], out var lastCreatedAt) ||
            !Guid.TryParseExact(parts[5], "N", out var lastId))
            throw new NotificationException("invalid_cursor");
        return (snapshot, lastCreatedAt, lastId);
    }

    private static string CreateBoundary(Guid owner, DateTimeOffset snapshot) =>
        Encode(string.Join('|', BoundaryVersion, owner.ToString("N"), snapshot.UtcTicks.ToString(CultureInfo.InvariantCulture)));

    private static DateTimeOffset ParseBoundary(string? boundary, Guid owner)
    {
        if (string.IsNullOrWhiteSpace(boundary)) throw new NotificationException("invalid_boundary");
        var parts = Decode(boundary, "invalid_boundary").Split('|');
        if (parts.Length != 3 || parts[0] != BoundaryVersion ||
            !Guid.TryParseExact(parts[1], "N", out var boundaryOwner) || boundaryOwner != owner ||
            !TryParseTicks(parts[2], out var upper))
            throw new NotificationException("invalid_boundary");
        return upper;
    }

    private static bool TryParseTicks(string value, out DateTimeOffset result)
    {
        result = default;
        if (!long.TryParse(value, NumberStyles.None, CultureInfo.InvariantCulture, out var ticks) ||
            ticks < DateTimeOffset.MinValue.UtcTicks || ticks > DateTimeOffset.MaxValue.UtcTicks)
            return false;
        result = new DateTimeOffset(ticks, TimeSpan.Zero);
        return true;
    }

    private static string Encode(string raw) =>
        Convert.ToBase64String(Encoding.UTF8.GetBytes(raw)).TrimEnd('=').Replace('+', '-').Replace('/', '_');

    private static string Decode(string token, string errorCode)
    {
        try
        {
            var base64 = token.Replace('-', '+').Replace('_', '/');
            base64 = base64.PadRight(base64.Length + (4 - base64.Length % 4) % 4, '=');
            return Encoding.UTF8.GetString(Convert.FromBase64String(base64));
        }
        catch (FormatException)
        {
            throw new NotificationException(errorCode);
        }
    }
}
