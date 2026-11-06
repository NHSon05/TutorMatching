using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorMatching.Domain.Content;
using TutorMatching.Domain.Notifications;
using TutorMatching.Domain.Tutors;

namespace TutorMatching.Infrastructure.Persistence.Configurations;

public sealed class DemandPostConfiguration : IEntityTypeConfiguration<DemandPost>
{
    public void Configure(EntityTypeBuilder<DemandPost> builder)
    {
        builder.ToTable("demand_posts", table =>
        {
            table.HasCheckConstraint(
                "ck_demand_posts_raw_content_len",
                "char_length(raw_content) BETWEEN 10 AND 2000");
            table.HasCheckConstraint(
                "ck_demand_posts_status",
                "status IN ('PENDING', 'EXTRACTED', 'FAILED', 'DUPLICATE', 'REJECTED')");
        });

        builder.HasKey(x => x.Id);

        builder.Property(x => x.ActorFingerprint)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(x => x.ContentHash)
            .HasMaxLength(64)
            .IsRequired();

        builder.Property(x => x.RawContent)
            .IsRequired();

        builder.Property(x => x.Status)
            .HasConversion<string>()
            .HasMaxLength(30)
            .HasDefaultValue(PostStatus.PENDING)
            .IsRequired();

        builder.Property(x => x.ExpiresAt)
            .HasColumnType("timestamp with time zone")
            .IsRequired();

        builder.Property(x => x.CreatedAt)
            .HasColumnType("timestamp with time zone")
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .IsRequired();

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(x => x.RequesterUserId)
            .HasConstraintName("fk_demand_posts_user_accounts_requester_user_id")
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(x => new { x.ActorFingerprint, x.ContentHash, x.CreatedAt })
            .HasDatabaseName("idx_demand_posts_actor_hash");

        builder.HasIndex(x => x.ExpiresAt)
            .HasDatabaseName("idx_demand_posts_expires_at");

        builder.HasIndex(x => x.CreatedAt)
            .HasDatabaseName("idx_demand_posts_created_at");

        builder.HasIndex(x => new { x.Status, x.CreatedAt })
            .HasDatabaseName("idx_demand_posts_status");
    }
}

public sealed class ExtractedDemandDetailConfiguration : IEntityTypeConfiguration<ExtractedDemandDetail>
{
    public void Configure(EntityTypeBuilder<ExtractedDemandDetail> builder)
    {
        builder.ToTable("extracted_demand_details", table =>
        {
            table.HasCheckConstraint(
                "ck_extracted_demand_details_grade_level",
                "grade_level IS NULL OR (grade_level BETWEEN 1 AND 12)");
            table.HasCheckConstraint(
                "ck_extracted_demand_details_tuition_fee",
                "tuition_fee_vnd >= 0");
            table.HasCheckConstraint(
                "ck_extracted_demand_details_fee_period",
                "fee_period IN ('PER_SESSION', 'PER_MONTH', 'TOTAL')");
            table.HasCheckConstraint(
                "ck_extracted_demand_details_sessions",
                "sessions_per_week IS NULL OR (sessions_per_week BETWEEN 1 AND 21)");
            table.HasCheckConstraint(
                "ck_extracted_demand_details_teaching_mode",
                "teaching_mode IN ('ONLINE', 'OFFLINE', 'HYBRID')");
            table.HasCheckConstraint(
                "ck_extracted_demand_details_confidence",
                "confidence_score BETWEEN 0.00 AND 1.00");
        });

        builder.HasKey(x => x.Id);

        builder.Property(x => x.SubjectNameRaw)
            .HasMaxLength(100);

        builder.Property(x => x.TuitionFeeVnd)
            .HasDefaultValue(0)
            .IsRequired();

        builder.Property(x => x.FeePeriod)
            .HasMaxLength(20)
            .HasDefaultValue("PER_SESSION")
            .IsRequired();

        builder.Property(x => x.IsFeeNegotiable)
            .HasDefaultValue(false)
            .IsRequired();

        builder.Property(x => x.TeachingMode)
            .HasMaxLength(20)
            .HasDefaultValue("OFFLINE")
            .IsRequired();

        builder.Property(x => x.ProvinceCode)
            .HasMaxLength(32);

        builder.Property(x => x.DistrictCode)
            .HasMaxLength(32);

        builder.Property(x => x.IsLocationAmbiguous)
            .HasDefaultValue(false)
            .IsRequired();

        builder.Property(x => x.ConfidenceScore)
            .HasPrecision(3, 2)
            .HasDefaultValue(0.00m)
            .IsRequired();

        builder.Property(x => x.ExtractedJson)
            .HasColumnType("jsonb")
            .IsRequired();

        var floatListComparer = new ValueComparer<List<float>?>(
            (a, b) => ReferenceEquals(a, b) || (a != null && b != null && a.SequenceEqual(b)),
            v => v == null ? 0 : v.Aggregate(0, (hash, item) => HashCode.Combine(hash, item.GetHashCode())),
            v => v == null ? null : v.ToList());

        builder.Property(x => x.Embedding)
            .HasConversion(
                v => v == null ? null : JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => string.IsNullOrWhiteSpace(v)
                    ? null
                    : JsonSerializer.Deserialize<List<float>>(v, (JsonSerializerOptions?)null))
            .Metadata.SetValueComparer(floatListComparer);

        builder.Property(x => x.Embedding)
            .HasColumnType("jsonb");

        builder.Property(x => x.CreatedAt)
            .HasColumnType("timestamp with time zone")
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .IsRequired();

        builder.HasOne(x => x.DemandPost)
            .WithOne(x => x.ExtractedDetail)
            .HasForeignKey<ExtractedDemandDetail>(x => x.DemandPostId)
            .HasConstraintName("fk_extracted_demand_details_demand_posts")
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Subject)
            .WithMany()
            .HasForeignKey(x => x.SubjectId)
            .HasConstraintName("fk_extracted_demand_details_subjects")
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(x => x.Province)
            .WithMany()
            .HasForeignKey(x => x.ProvinceCode)
            .HasConstraintName("fk_extracted_demand_details_provinces")
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(x => x.District)
            .WithMany()
            .HasForeignKey(x => x.DistrictCode)
            .HasConstraintName("fk_extracted_demand_details_districts")
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(x => x.DemandPostId)
            .IsUnique()
            .HasDatabaseName("uq_extracted_demand_details_post_id");

        builder.HasIndex(x => new { x.SubjectId, x.GradeLevel, x.ProvinceCode, x.DistrictCode })
            .HasDatabaseName("idx_extracted_demand_details_matching");

        builder.HasIndex(x => x.IsLocationAmbiguous)
            .HasDatabaseName("idx_extracted_demand_details_ambiguous");
    }
}

public sealed class TutorMatchingProfileConfiguration : IEntityTypeConfiguration<TutorMatchingProfile>
{
    public void Configure(EntityTypeBuilder<TutorMatchingProfile> builder)
    {
        builder.ToTable("tutor_matching_profiles", table =>
        {
            table.HasCheckConstraint(
                "ck_tutor_matching_profiles_min_fee",
                "min_tuition_fee_vnd >= 0");
            table.HasCheckConstraint(
                "ck_tutor_matching_profiles_max_fee",
                "max_tuition_fee_vnd IS NULL OR max_tuition_fee_vnd >= min_tuition_fee_vnd");
        });

        builder.HasKey(x => x.Id);

        builder.Property(x => x.PreferredSubjects)
            .HasColumnType("uuid[]")
            .IsRequired();

        builder.Property(x => x.PreferredGrades)
            .HasColumnType("integer[]")
            .IsRequired();

        builder.Property(x => x.MinTuitionFeeVnd)
            .HasDefaultValue(0)
            .IsRequired();

        builder.Property(x => x.PreferredProvinceCode)
            .HasMaxLength(32);

        builder.Property(x => x.PreferredDistrictCodes)
            .HasColumnType("varchar(32)[]")
            .IsRequired();

        builder.Property(x => x.ReceiveAllDistricts)
            .HasDefaultValue(false)
            .IsRequired();

        builder.Property(x => x.TeachingModes)
            .HasColumnType("varchar(20)[]")
            .IsRequired();

        builder.Property(x => x.IsActive)
            .HasDefaultValue(true)
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
            .WithOne()
            .HasForeignKey<TutorMatchingProfile>(x => x.TutorProfileId)
            .HasConstraintName("fk_tutor_matching_profiles_tutor_profiles")
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.PreferredProvince)
            .WithMany()
            .HasForeignKey(x => x.PreferredProvinceCode)
            .HasConstraintName("fk_tutor_matching_profiles_provinces")
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(x => x.TutorProfileId)
            .IsUnique()
            .HasDatabaseName("uq_tutor_matching_profiles_tutor");

        builder.HasIndex(x => x.IsActive)
            .HasDatabaseName("idx_tutor_matching_profiles_active");
    }
}

public sealed class PostMatchNotificationConfiguration : IEntityTypeConfiguration<PostMatchNotification>
{
    public void Configure(EntityTypeBuilder<PostMatchNotification> builder)
    {
        builder.ToTable("post_match_notifications", table =>
        {
            table.HasCheckConstraint(
                "ck_post_match_notifications_score",
                "match_score BETWEEN 0.00 AND 1.00");
        });

        builder.HasKey(x => x.Id);

        builder.Property(x => x.MatchScore)
            .HasPrecision(3, 2)
            .HasDefaultValue(1.00m)
            .IsRequired();

        builder.Property(x => x.IsRead)
            .HasDefaultValue(false)
            .IsRequired();

        builder.Property(x => x.SentAt)
            .HasColumnType("timestamp with time zone")
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .IsRequired();

        builder.Property(x => x.ReadAt)
            .HasColumnType("timestamp with time zone");

        builder.Property(x => x.CreatedAt)
            .HasColumnType("timestamp with time zone")
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .IsRequired();

        builder.HasOne(x => x.ExtractedDemandDetail)
            .WithMany()
            .HasForeignKey(x => x.ExtractedDemandDetailId)
            .HasConstraintName("fk_post_match_notifications_extracted_demand_details")
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.TutorProfile)
            .WithMany()
            .HasForeignKey(x => x.TutorProfileId)
            .HasConstraintName("fk_post_match_notifications_tutor_profiles")
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.ExtractedDemandDetailId, x.TutorProfileId })
            .IsUnique()
            .HasDatabaseName("uq_post_match_notifications_detail_tutor");

        builder.HasIndex(x => new { x.TutorProfileId, x.IsRead, x.CreatedAt })
            .HasDatabaseName("idx_post_match_notifications_tutor");

        builder.HasIndex(x => x.CreatedAt)
            .HasDatabaseName("idx_post_match_notifications_created");
    }
}

public sealed class RetentionCleanupLogConfiguration : IEntityTypeConfiguration<RetentionCleanupLog>
{
    public void Configure(EntityTypeBuilder<RetentionCleanupLog> builder)
    {
        builder.ToTable("retention_cleanup_logs", table =>
        {
            table.HasCheckConstraint(
                "ck_retention_cleanup_logs_status",
                "status IN ('SUCCESS', 'FAILED')");
        });

        builder.HasKey(x => x.Id);

        builder.Property(x => x.CleanupDate)
            .HasColumnType("date")
            .IsRequired();

        builder.Property(x => x.PostsDeletedCount)
            .HasDefaultValue(0)
            .IsRequired();

        builder.Property(x => x.NotificationsDeletedCount)
            .HasDefaultValue(0)
            .IsRequired();

        builder.Property(x => x.DurationMs)
            .HasDefaultValue(0)
            .IsRequired();

        builder.Property(x => x.Status)
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(x => x.ExecutedAt)
            .HasColumnType("timestamp with time zone")
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .IsRequired();
    }
}
