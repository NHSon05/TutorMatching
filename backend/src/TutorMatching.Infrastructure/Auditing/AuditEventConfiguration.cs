using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Infrastructure.Auditing;

public sealed class AuditEventConfiguration : IEntityTypeConfiguration<AuditEvent>
{
    public void Configure(EntityTypeBuilder<AuditEvent> builder)
    {
        builder.ToTable("AuditEvents");
        builder.HasKey(auditEvent => auditEvent.Id);

        builder.Property(auditEvent => auditEvent.Action)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(auditEvent => auditEvent.EntityType)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(auditEvent => auditEvent.EntityId)
            .HasMaxLength(200);

        builder.Property(auditEvent => auditEvent.IpAddress)
            .HasMaxLength(64);

        builder.Property(auditEvent => auditEvent.CreatedAt)
            .HasColumnType("timestamp with time zone")
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .IsRequired();

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(auditEvent => auditEvent.ActorUserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
