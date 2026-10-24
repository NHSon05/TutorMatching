using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorMatching.Domain.Tutors;

namespace TutorMatching.Infrastructure.Persistence.Configurations;

public sealed class AvailabilitySlotConfiguration : IEntityTypeConfiguration<AvailabilitySlot>
{
    public void Configure(EntityTypeBuilder<AvailabilitySlot> builder)
    {
        builder.ToTable("AvailabilitySlots");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.AvailabilityType)
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(x => x.SpecificDate)
            .HasColumnType("date");

        builder.Property(x => x.StartTime)
            .HasColumnType("time without time zone")
            .IsRequired();

        builder.Property(x => x.EndTime)
            .HasColumnType("time without time zone")
            .IsRequired();

        builder.Property(x => x.IsActive)
            .IsRequired();

        builder.Property(x => x.CreatedAt)
            .HasColumnType("timestamp with time zone")
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .IsRequired();

        builder.Property(x => x.UpdatedAt)
            .HasColumnType("timestamp with time zone")
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .IsRequired();

        builder.HasOne(x => x.TutorProfile)
            .WithMany()
            .HasForeignKey(x => x.TutorProfileId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.DayOfWeek, x.TutorProfileId, x.StartTime, x.EndTime })
            .HasFilter("is_active AND availability_type = 'WEEKLY'")
            .HasDatabaseName("ix_availability_slots_search");
    }
}
