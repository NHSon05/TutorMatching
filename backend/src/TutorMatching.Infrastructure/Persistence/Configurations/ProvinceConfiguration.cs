using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorMatching.Domain.Locations;

namespace TutorMatching.Infrastructure.Persistence.Configurations;

public sealed class ProvinceConfiguration : IEntityTypeConfiguration<Province>
{
    public void Configure(EntityTypeBuilder<Province> builder)
    {
        builder.ToTable("Provinces");
        builder.HasKey(x => x.ProvinceCode);

        builder.Property(x => x.ProvinceCode)
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(x => x.ProvinceName)
            .HasMaxLength(100)
            .IsRequired();

        builder.HasIndex(x => x.ProvinceName)
            .IsUnique();

        builder.Property(x => x.IsActive)
            .IsRequired();

        builder.HasMany(x => x.Districts)
            .WithOne(x => x.Province)
            .HasForeignKey(x => x.ProvinceCode)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
