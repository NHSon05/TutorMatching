using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorMatching.Domain.Messaging;

namespace TutorMatching.Infrastructure.Persistence.Configurations;

public sealed class MessageNotificationOutboxConfiguration : IEntityTypeConfiguration<MessageNotificationOutbox>
{
    public void Configure(EntityTypeBuilder<MessageNotificationOutbox> builder)
    {
        builder.ToTable("MessageNotificationOutboxes");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.CreatedAt)
            .HasColumnType("timestamp with time zone")
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .IsRequired();

        builder.Property(x => x.NextAttemptAt)
            .HasColumnType("timestamp with time zone");

        builder.Property(x => x.DeliveredAt)
            .HasColumnType("timestamp with time zone");

        builder.HasIndex(x => new { x.MessageId, x.RecipientUserId })
            .IsUnique();

        builder.HasOne(x => x.Message)
            .WithMany()
            .HasForeignKey(x => x.MessageId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(x => x.RecipientUserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
