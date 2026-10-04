using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorMatching.Domain.Users;

namespace TutorMatching.Infrastructure.Persistence.Configurations;

public sealed class ApplicationUserConfiguration : IEntityTypeConfiguration<ApplicationUser>
{
    public void Configure(EntityTypeBuilder<ApplicationUser> builder)
    {
        builder.ToTable("UserAccounts", table =>
        {
            table.HasCheckConstraint(
                "CK_UserAccounts_FullName_Trimmed_Length",
                "\"FullName\" = btrim(\"FullName\") AND char_length(\"FullName\") BETWEEN 2 AND 100");
            table.HasCheckConstraint(
                "CK_UserAccounts_DateOfBirth_Past",
                "\"DateOfBirth\" IS NULL OR \"DateOfBirth\" < CURRENT_DATE");
            table.HasCheckConstraint(
                "CK_UserAccounts_Status_Canonical",
                "\"Status\" IN ('ACTIVE', 'LOCKED', 'INACTIVE')");
        });

        builder.Property(user => user.Email)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(user => user.NormalizedEmail)
            .IsRequired()
            .HasMaxLength(256);

        builder.HasIndex(user => user.NormalizedEmail)
            .IsUnique()
            .HasDatabaseName("UX_UserAccounts_NormalizedEmail");

        builder.Property(user => user.FullName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(user => user.PhoneNumber)
            .HasMaxLength(32);

        builder.HasIndex(user => user.PhoneNumber)
            .IsUnique()
            .HasFilter("\"PhoneNumber\" IS NOT NULL")
            .HasDatabaseName("UX_UserAccounts_PhoneNumber");

        builder.Property(user => user.DateOfBirth)
            .HasColumnType("date");

        builder.Property(user => user.AvatarUrl)
            .HasMaxLength(2048);

        builder.Property(user => user.Status)
            .HasConversion<string>()
            .HasMaxLength(16)
            .IsRequired();

        builder.Property(user => user.CreatedAt)
            .HasColumnType("timestamp with time zone")
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .IsRequired();

        builder.Property(user => user.UpdatedAt)
            .HasColumnType("timestamp with time zone")
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .IsRequired();

        builder.Property(user => user.LastLoginAt)
            .HasColumnType("timestamp with time zone");

        builder.Property(user => user.DeletedAt)
            .HasColumnType("timestamp with time zone");
    }
}
