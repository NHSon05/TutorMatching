using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorMatching.Domain.Locations;

namespace TutorMatching.Infrastructure.Persistence.Configurations;

public sealed class DistrictConfiguration : IEntityTypeConfiguration<District>
{
    public void Configure(EntityTypeBuilder<District> builder)
    {
        builder.ToTable("Districts");
        builder.HasKey(x => x.DistrictCode);

        builder.Property(x => x.DistrictCode)
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(x => x.ProvinceCode)
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(x => x.DistrictName)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(x => x.IsActive)
            .IsRequired();

        builder.HasIndex(x => new { x.ProvinceCode, x.DistrictName });

        builder.HasOne(x => x.Province)
            .WithMany(x => x.Districts)
            .HasForeignKey(x => x.ProvinceCode)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
