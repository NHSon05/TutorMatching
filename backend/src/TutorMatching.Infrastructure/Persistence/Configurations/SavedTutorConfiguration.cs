using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorMatching.Domain.Tutors;

namespace TutorMatching.Infrastructure.Persistence.Configurations;

public sealed class SavedTutorConfiguration : IEntityTypeConfiguration<SavedTutor>
{
    public void Configure(EntityTypeBuilder<SavedTutor> builder)
    {
        builder.ToTable("SavedTutors");
        builder.HasKey(x => new { x.UserId, x.TutorProfileId });
        builder.Property(x => x.CreatedAt).HasColumnType("timestamp with time zone").IsRequired();
        // Bookmarks disappear with the account or the profile; they carry no business history.
        builder.HasOne<ApplicationUser>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<TutorProfile>().WithMany().HasForeignKey(x => x.TutorProfileId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(x => new { x.UserId, x.CreatedAt });
        builder.HasIndex(x => x.TutorProfileId);
    }
}
