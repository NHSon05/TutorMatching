using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorMatching.Domain.Hiring;

namespace TutorMatching.Infrastructure.Persistence.Configurations;

public sealed class RequestStatusHistoryConfiguration : IEntityTypeConfiguration<RequestStatusHistory>
{
    public void Configure(EntityTypeBuilder<RequestStatusHistory> builder)
    {
        builder.ToTable("RequestStatusHistory");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.FromStatusCode)
            .HasMaxLength(32);

        builder.Property(x => x.ToStatusCode)
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(x => x.Reason)
            .HasMaxLength(1000);

        builder.Property(x => x.CreatedAt)
            .HasColumnType("timestamp with time zone")
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .IsRequired();

        builder.HasOne(x => x.HireRequest)
            .WithMany(x => x.StatusHistories)
            .HasForeignKey(x => x.HireRequestId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(x => x.ActorUserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
