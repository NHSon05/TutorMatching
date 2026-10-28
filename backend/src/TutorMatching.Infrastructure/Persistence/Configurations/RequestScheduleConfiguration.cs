using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorMatching.Domain.Hiring;

namespace TutorMatching.Infrastructure.Persistence.Configurations;

public sealed class RequestScheduleConfiguration : IEntityTypeConfiguration<RequestSchedule>
{
    public void Configure(EntityTypeBuilder<RequestSchedule> builder)
    {
        builder.ToTable("RequestSchedules", t => t.HasCheckConstraint("ck_requestschedule_window", "day_of_week BETWEEN 1 AND 7 AND start_time < end_time"));
        builder.HasKey(x => x.Id);

        builder.Property(x => x.DayOfWeek)
            .IsRequired();

        builder.Property(x => x.StartTime)
            .HasColumnType("time without time zone")
            .IsRequired();

        builder.Property(x => x.EndTime)
            .HasColumnType("time without time zone")
            .IsRequired();

        builder.Property(x => x.CreatedAt)
            .HasColumnType("timestamp with time zone")
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .IsRequired();

        builder.HasOne(x => x.HireRequest)
            .WithMany(x => x.Schedules)
            .HasForeignKey(x => x.HireRequestId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
