using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorMatching.Domain.Hiring;

namespace TutorMatching.Infrastructure.Persistence.Configurations;

public sealed class HireRequestConfiguration : IEntityTypeConfiguration<HireRequest>
{
    public void Configure(EntityTypeBuilder<HireRequest> builder)
    {
        builder.ToTable("HireRequests", t =>
        {
            t.HasCheckConstraint("ck_hire_request_values", "sessions_per_week BETWEEN 1 AND 21 AND duration_minutes BETWEEN 30 AND 240 AND proposed_price_vnd > 0 AND (listed_price_vnd IS NULL OR listed_price_vnd > 0) AND latest_proposal_sequence >= 0 AND next_event_sequence > 0");
            t.HasCheckConstraint("ck_hire_request_status", "status_code IN ('PENDING','NEGOTIATING','ACCEPTED','REJECTED','CANCELLED','COMPLETED')");
            t.HasCheckConstraint("ck_hire_request_mode", "teaching_mode_code IN ('ONLINE','OFFLINE','HYBRID')");
            t.HasCheckConstraint("ck_hire_request_snapshot", "initial_terms IS NOT NULL AND (is_legacy OR listed_price_vnd IS NOT NULL) AND (status_code NOT IN ('ACCEPTED','COMPLETED') OR final_agreement IS NOT NULL)");
        });
        builder.Property(x => x.Version).IsConcurrencyToken();
        builder.Property(x => x.InitialTerms).JsonSnapshot();
        builder.Property(x => x.InitialTerms).IsRequired();
        builder.Property(x => x.FinalAgreement).JsonSnapshot();
        builder.HasIndex(x => new { x.RequesterUserId, x.StatusCode, x.CreatedAt, x.Id });
        builder.HasIndex(x => new { x.TutorProfileId, x.StatusCode, x.CreatedAt, x.Id });
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
