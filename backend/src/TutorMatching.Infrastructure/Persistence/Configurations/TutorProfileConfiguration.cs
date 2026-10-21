using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorMatching.Domain.Tutors;

namespace TutorMatching.Infrastructure.Persistence.Configurations;

public sealed class TutorProfileConfiguration : IEntityTypeConfiguration<TutorProfile>
{
    public void Configure(EntityTypeBuilder<TutorProfile> builder)
    {
        builder.ToTable("TutorProfiles");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.TeachingModes).HasConversion(
            v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
            v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>()).HasColumnType("jsonb");
        builder.Property(x => x.UserId).IsRequired();
        builder.HasIndex(x => x.UserId).IsUnique();

        builder.Property(x => x.Status)
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(x => x.CurrentStep)
            .IsRequired();

        builder.Property(x => x.Subjects)
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>()
            )
            .HasColumnType("jsonb");

        builder.Property(x => x.Languages)
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>()
            )
            .HasColumnType("jsonb");

        builder.Property(x => x.TeachingLevels)
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>()
            )
            .HasColumnType("jsonb");

        builder.Property(x => x.AvatarUrl).HasMaxLength(2048);

        builder.Property(x => x.HasCertifications).IsRequired();

        builder.Property(x => x.Certifications)
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<List<TutorCertification>>(v, (JsonSerializerOptions?)null) ?? new List<TutorCertification>()
            )
            .HasColumnType("jsonb");

        builder.Property(x => x.EducationType).HasMaxLength(32);
        builder.Property(x => x.SchoolName).HasMaxLength(256);
        builder.Property(x => x.Degree).HasMaxLength(256);
        builder.Property(x => x.Specialization).HasMaxLength(256);

        builder.Property(x => x.Bio).HasMaxLength(4000);
        builder.Property(x => x.TeachingMethodology).HasMaxLength(4000);
        builder.Property(x => x.AchievementsAndResults).HasMaxLength(4000);

        builder.Property(x => x.IsNegotiable).IsRequired();

        builder.Property(x => x.CreatedAt)
            .HasColumnType("timestamp with time zone")
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .IsRequired();

        builder.Property(x => x.UpdatedAt)
            .HasColumnType("timestamp with time zone")
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .IsRequired();

        builder.Property(x => x.SubmittedAt)
            .HasColumnType("timestamp with time zone");

        builder.Property(x => x.ApprovedAt)
            .HasColumnType("timestamp with time zone");

        builder.Property(x => x.ProvinceCode).HasMaxLength(32);
        builder.Property(x => x.DistrictCode).HasMaxLength(32);

        builder.HasOne<TutorMatching.Domain.Locations.Province>()
            .WithMany()
            .HasForeignKey(x => x.ProvinceCode)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne<TutorMatching.Domain.Locations.District>()
            .WithMany()
            .HasForeignKey(x => x.DistrictCode)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne<ApplicationUser>()
            .WithOne()
            .HasForeignKey<TutorProfile>(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
