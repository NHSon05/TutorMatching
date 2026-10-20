using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorMatching.Domain.Notifications;

namespace TutorMatching.Infrastructure.Persistence.Configurations;

public sealed class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("Notifications");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.TypeCode)
            .HasMaxLength(64)
            .IsRequired();

        builder.Property(x => x.Title)
            .HasMaxLength(256)
            .IsRequired();

        builder.Property(x => x.Body)
            .HasMaxLength(2000);

        builder.Property(x => x.IsRead)
            .IsRequired();

        builder.Property(x => x.ReadAt)
            .HasColumnType("timestamp with time zone");

        builder.Property(x => x.CreatedAt)
            .HasColumnType("timestamp with time zone")
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .IsRequired();

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.HireRequest)
            .WithMany()
            .HasForeignKey(x => x.HireRequestId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(x => x.Message)
            .WithMany()
            .HasForeignKey(x => x.MessageId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(x => x.TutorProfile)
            .WithMany()
            .HasForeignKey(x => x.TutorProfileId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
