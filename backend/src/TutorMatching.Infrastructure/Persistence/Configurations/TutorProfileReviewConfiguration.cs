using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorMatching.Domain.Tutors;

namespace TutorMatching.Infrastructure.Persistence.Configurations;

public sealed class TutorProfileReviewConfiguration : IEntityTypeConfiguration<TutorProfileReview>
{
    public void Configure(EntityTypeBuilder<TutorProfileReview> builder)
    {
        builder.ToTable("TutorProfileReviews");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.FromStatusCode)
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(x => x.ToStatusCode)
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(x => x.Note)
            .HasMaxLength(4000);

        builder.Property(x => x.ReviewedAt)
            .HasColumnType("timestamp with time zone")
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .IsRequired();

        builder.HasOne(x => x.TutorProfile)
            .WithMany()
            .HasForeignKey(x => x.TutorProfileId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(x => x.ReviewerUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
