using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorMatching.Domain.Hiring;

namespace TutorMatching.Infrastructure.Persistence.Configurations;

public sealed class HireRequestConfiguration : IEntityTypeConfiguration<HireRequest>
{
    public void Configure(EntityTypeBuilder<HireRequest> builder)
    {
        builder.ToTable("HireRequests");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.StartDate)
            .HasColumnType("date")
            .IsRequired();

        builder.Property(x => x.SessionsPerWeek)
            .IsRequired();

        builder.Property(x => x.DurationMinutes)
            .IsRequired();

        builder.Property(x => x.TeachingModeCode)
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(x => x.ProvinceCode)
            .HasMaxLength(32);

        builder.Property(x => x.DistrictCode)
            .HasMaxLength(32);

        builder.Property(x => x.LocationDetail)
            .HasMaxLength(500);

        builder.Property(x => x.ProposedPriceVnd)
            .IsRequired();

        builder.Property(x => x.StatusCode)
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(x => x.Note)
            .HasMaxLength(2000);

        builder.Property(x => x.CancelReason)
            .HasMaxLength(1000);

        builder.Property(x => x.AcceptedAt)
            .HasColumnType("timestamp with time zone");

        builder.Property(x => x.CompletedAt)
            .HasColumnType("timestamp with time zone");

        builder.Property(x => x.CreatedAt)
            .HasColumnType("timestamp with time zone")
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .IsRequired();

        builder.Property(x => x.UpdatedAt)
            .HasColumnType("timestamp with time zone")
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .IsRequired();

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(x => x.RequesterUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.TutorProfile)
            .WithMany()
            .HasForeignKey(x => x.TutorProfileId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Subject)
            .WithMany()
            .HasForeignKey(x => x.SubjectId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Course)
            .WithMany()
            .HasForeignKey(x => x.CourseId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(x => x.Province)
            .WithMany()
            .HasForeignKey(x => x.ProvinceCode)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(x => x.District)
            .WithMany()
            .HasForeignKey(x => x.DistrictCode)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(x => x.Schedules)
            .WithOne(x => x.HireRequest)
            .HasForeignKey(x => x.HireRequestId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.Negotiations)
            .WithOne(x => x.HireRequest)
            .HasForeignKey(x => x.HireRequestId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.StatusHistories)
            .WithOne(x => x.HireRequest)
            .HasForeignKey(x => x.HireRequestId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
