using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorMatching.Domain.Tutors;

namespace TutorMatching.Infrastructure.Persistence.Configurations;

public sealed class TutorSubjectConfiguration : IEntityTypeConfiguration<TutorSubject>
{
    public void Configure(EntityTypeBuilder<TutorSubject> builder)
    {
        builder.ToTable("TutorSubjects");
        builder.HasKey(x => new { x.TutorProfileId, x.SubjectId });

        builder.Property(x => x.LevelDescription)
            .HasMaxLength(256);

        builder.Property(x => x.CreatedAt)
            .HasColumnType("timestamp with time zone")
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .IsRequired();

        builder.HasOne(x => x.TutorProfile)
            .WithMany()
            .HasForeignKey(x => x.TutorProfileId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Subject)
            .WithMany()
            .HasForeignKey(x => x.SubjectId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
