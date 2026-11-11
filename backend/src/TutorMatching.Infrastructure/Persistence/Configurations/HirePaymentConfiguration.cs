using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorMatching.Domain.Hiring;

namespace TutorMatching.Infrastructure.Persistence.Configurations;

public sealed class HirePaymentConfiguration : IEntityTypeConfiguration<HirePayment>
{
    public void Configure(EntityTypeBuilder<HirePayment> builder)
    {
        builder.ToTable("HirePayments", t =>
        {
            t.HasCheckConstraint(
                "ck_hire_payment_amounts",
                "unit_price_vnd > 0 AND billing_sessions > 0 AND amount_vnd = unit_price_vnd * billing_sessions");
            t.HasCheckConstraint(
                "ck_hire_payment_status",
                "status_code IN ('PENDING','PAID','FAILED','CANCELLED','REFUNDED')");
        });

        builder.HasKey(x => x.Id);

        builder.Property(x => x.UnitPriceVnd).IsRequired();
        builder.Property(x => x.BillingSessions).IsRequired();
        builder.Property(x => x.AmountVnd).IsRequired();

        builder.Property(x => x.ProviderCode)
            .HasMaxLength(32)
            .HasDefaultValue("VIETQR_SANDBOX")
            .IsRequired();

        builder.Property(x => x.TransferReference)
            .HasMaxLength(64)
            .IsRequired();

        builder.Property(x => x.QrPayload)
            .HasMaxLength(1000)
            .IsRequired();

        builder.Property(x => x.StatusCode)
            .HasMaxLength(24)
            .HasDefaultValue("PENDING")
            .IsRequired();

        builder.Property(x => x.PaidAt)
            .HasColumnType("timestamp with time zone");

        builder.Property(x => x.CreatedAt)
            .HasColumnType("timestamp with time zone")
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .IsRequired();

        builder.Property(x => x.UpdatedAt)
            .HasColumnType("timestamp with time zone")
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .IsRequired();

        builder.HasIndex(x => new { x.PayerUserId, x.IdempotencyKey })
            .IsUnique();

        builder.HasIndex(x => new { x.HireRequestId, x.CreatedAt });

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(x => x.PayerUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
