namespace TutorMatching.Application.Notifications;

// All operations are scoped to the authenticated caller; no caller-supplied owner is accepted.
// Failures throw NotificationException with codes: unauthorized, not_found, invalid_cursor, invalid_boundary.
public interface INotificationService
{
    Task<NotificationPageDto> ListAsync(bool unreadOnly, string? cursor, int pageSize, CancellationToken ct = default);
    Task<UnreadNotificationCountDto> GetUnreadCountAsync(CancellationToken ct = default);
    Task<NotificationDto> MarkReadAsync(Guid id, CancellationToken ct = default);
    Task<ReadAllNotificationsResultDto> MarkAllReadAsync(string? boundary, CancellationToken ct = default);
    Task<OpenNotificationResultDto> OpenAsync(Guid id, CancellationToken ct = default);
}
