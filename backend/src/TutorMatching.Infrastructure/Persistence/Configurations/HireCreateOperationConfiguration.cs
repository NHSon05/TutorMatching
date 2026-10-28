using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorMatching.Domain.Hiring;

namespace TutorMatching.Infrastructure.Persistence.Configurations;

public sealed class HireCreateOperationConfiguration : IEntityTypeConfiguration<HireCreateOperation>
{
    public void Configure(EntityTypeBuilder<HireCreateOperation> builder)
    {
        builder.ToTable("HireCreateOperations", t => t.HasCheckConstraint("ck_hire_operation_fingerprint", "payload_fingerprint ~ '^[0-9a-f]{64}$'"));
        builder.HasKey(x => new { x.LearnerId, x.IdempotencyKey });
        builder.HasIndex(x => x.RequestId).IsUnique();
        builder.Property(x => x.PayloadFingerprint).HasMaxLength(64).IsRequired();
        builder.Property(x => x.Outcome).JsonSnapshot();
        builder.Property(x => x.Outcome).IsRequired();
        builder.HasOne<ApplicationUser>().WithMany().HasForeignKey(x => x.LearnerId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<HireRequest>().WithOne().HasForeignKey<HireCreateOperation>(x => x.RequestId).OnDelete(DeleteBehavior.Restrict);
    }
}
