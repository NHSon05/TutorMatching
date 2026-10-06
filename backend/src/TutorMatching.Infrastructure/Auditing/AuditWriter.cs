using TutorMatching.Application.Abstractions;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Infrastructure.Auditing;

public sealed class AuditWriter(
    ApplicationDbContext dbContext,
    IClock clock
) : IAuditWriter
{
    public async Task WriteAsync(
        AccountAuditEntry entry,
        CancellationToken cancellationToken = default
    )
    {
        ArgumentNullException.ThrowIfNull(entry);

        if (!Enum.IsDefined(entry.Action))
        {
            throw new ArgumentOutOfRangeException(
                nameof(entry),
                "Unsupported audit action"
            );
        }

        var auditEvent = new AuditEvent
        {
            Id = Guid.NewGuid(),
            ActorUserId = entry.ActorUserId,
            Action = entry.Action.ToString(),
            EntityType = "UserAccount",
            EntityId = entry.TargetUserId?.ToString(),
            CreatedAt = clock.UtcNow
        };

        dbContext.AuditEvents.Add(auditEvent);

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}