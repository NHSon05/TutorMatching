using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorMatching.Domain.Hiring;

namespace TutorMatching.Infrastructure.Persistence.Configurations;

public sealed class NegotiationScheduleConfiguration : IEntityTypeConfiguration<NegotiationSchedule>
{
    public void Configure(EntityTypeBuilder<NegotiationSchedule> builder)
    {
        builder.ToTable("NegotiationSchedules", t => t.HasCheckConstraint("ck_negotiationschedule_window", "day_of_week BETWEEN 1 AND 7 AND start_time < end_time"));
        builder.HasKey(x => x.Id);

        builder.Property(x => x.DayOfWeek)
            .IsRequired();

        builder.Property(x => x.StartTime)
            .HasColumnType("time without time zone")
            .IsRequired();

        builder.Property(x => x.EndTime)
            .HasColumnType("time without time zone")
            .IsRequired();

        builder.HasOne(x => x.Negotiation)
            .WithMany(x => x.Schedules)
            .HasForeignKey(x => x.NegotiationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
