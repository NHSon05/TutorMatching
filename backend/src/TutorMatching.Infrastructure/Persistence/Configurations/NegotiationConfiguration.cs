using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorMatching.Domain.Hiring;

namespace TutorMatching.Infrastructure.Persistence.Configurations;

public sealed class NegotiationConfiguration : IEntityTypeConfiguration<Negotiation>
{
    public void Configure(EntityTypeBuilder<Negotiation> builder)
    {
        builder.ToTable("Negotiations");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Note)
            .HasMaxLength(2000);

        builder.Property(x => x.ResponseStatusCode)
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(x => x.RespondedAt)
            .HasColumnType("timestamp with time zone");

        builder.Property(x => x.CreatedAt)
            .HasColumnType("timestamp with time zone")
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .IsRequired();

        builder.HasOne(x => x.HireRequest)
            .WithMany(x => x.Negotiations)
            .HasForeignKey(x => x.HireRequestId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(x => x.SenderUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.Schedules)
            .WithOne(x => x.Negotiation)
            .HasForeignKey(x => x.NegotiationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
