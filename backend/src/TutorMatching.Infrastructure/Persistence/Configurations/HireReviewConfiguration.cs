using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorMatching.Domain.Hiring;
using TutorMatching.Domain.Tutors;

namespace TutorMatching.Infrastructure.Persistence.Configurations;

public sealed class HireReviewConfiguration : IEntityTypeConfiguration<HireReview>
{
    public void Configure(EntityTypeBuilder<HireReview> builder)
    {
        builder.ToTable("HireReviews", t =>
        {
            t.HasCheckConstraint("ck_hire_review_rating", "rating BETWEEN 1 AND 5");
        });

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Rating).IsRequired();

        builder.Property(x => x.Comment)
            .HasMaxLength(1000);

        builder.Property(x => x.TutorReply)
            .HasMaxLength(1000);

        builder.Property(x => x.TutorRepliedAt)
            .HasColumnType("timestamp with time zone");

        builder.Property(x => x.IsVisible)
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

        builder.HasIndex(x => x.HireRequestId)
            .IsUnique();

        builder.HasIndex(x => new { x.TutorProfileId, x.IsVisible, x.CreatedAt });

        builder.HasOne<TutorProfile>()
            .WithMany()
            .HasForeignKey(x => x.TutorProfileId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(x => x.ReviewerUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
