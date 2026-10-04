using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using TutorMatching.Domain.Users;
using TutorMatching.Infrastructure.Auditing;
using TutorMatching.Infrastructure.Persistence.Configurations;

namespace TutorMatching.Infrastructure.Persistence;

public sealed class ApplicationDbContext(
    DbContextOptions<ApplicationDbContext> options)
    : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>(options)
{
    private static readonly Guid AdminRoleId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid LearnerRoleId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid TutorRoleId = Guid.Parse("33333333-3333-3333-3333-333333333333");

    public DbSet<AuditEvent> AuditEvents => Set<AuditEvent>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.ApplyConfiguration(new ApplicationUserConfiguration());
        builder.ApplyConfiguration(new AuditEventConfiguration());

        builder.Entity<IdentityUserRole<Guid>>()
            .HasIndex(userRole => userRole.UserId)
            .IsUnique()
            .HasDatabaseName("UX_AspNetUserRoles_UserId");

        builder.Entity<IdentityRole<Guid>>().HasData(
            CreateRole(AdminRoleId, AccountRole.ADMIN),
            CreateRole(LearnerRoleId, AccountRole.LEARNER),
            CreateRole(TutorRoleId, AccountRole.TUTOR));
    }

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        ApplyAccountInvariants();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override Task<int> SaveChangesAsync(
        bool acceptAllChangesOnSuccess,
        CancellationToken cancellationToken = default)
    {
        ApplyAccountInvariants();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    private static IdentityRole<Guid> CreateRole(Guid id, AccountRole role)
    {
        var name = role.ToString();
        return new IdentityRole<Guid>
        {
            Id = id,
            Name = name,
            NormalizedName = name,
            ConcurrencyStamp = id.ToString("N"),
        };
    }

    private void ApplyAccountInvariants()
    {
        var now = DateTimeOffset.UtcNow;

        foreach (var entry in ChangeTracker.Entries<ApplicationUser>())
        {
            if (entry.State is not (EntityState.Added or EntityState.Modified))
            {
                continue;
            }

            entry.Entity.FullName = entry.Entity.FullName.Trim();
            entry.Entity.PhoneNumber = string.IsNullOrWhiteSpace(entry.Entity.PhoneNumber)
                ? null
                : entry.Entity.PhoneNumber.Trim();
            entry.Entity.UpdatedAt = now;

            if (entry.State == EntityState.Added && entry.Entity.CreatedAt == default)
            {
                entry.Entity.CreatedAt = now;
            }
        }

        foreach (var entry in ChangeTracker.Entries<AuditEvent>())
        {
            if (entry.State == EntityState.Added && entry.Entity.CreatedAt == default)
            {
                entry.Entity.CreatedAt = now;
            }
        }
    }
}
