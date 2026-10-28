using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using TutorMatching.Domain.Catalog;
using TutorMatching.Domain.Content;
using TutorMatching.Domain.Courses;
using TutorMatching.Domain.Hiring;
using TutorMatching.Domain.Locations;
using TutorMatching.Domain.Messaging;
using TutorMatching.Domain.Notifications;
using TutorMatching.Domain.Tutors;
using TutorMatching.Domain.Users;
using TutorMatching.Infrastructure.Auditing;
using TutorMatching.Infrastructure.Persistence.Configurations;

namespace TutorMatching.Infrastructure.Persistence;

public sealed class ApplicationDbContext(
    DbContextOptions<ApplicationDbContext> options)
    : IdentityUserContext<ApplicationUser, Guid>(options)
{
    public DbSet<AuditEvent> AuditEvents => Set<AuditEvent>();
    public DbSet<TokenSession> TokenSessions => Set<TokenSession>();
    public DbSet<SessionRefreshToken> SessionRefreshTokens => Set<SessionRefreshToken>();
    public DbSet<TutorProfile> TutorProfiles => Set<TutorProfile>();
    public DbSet<Province> Provinces => Set<Province>();
    public DbSet<District> Districts => Set<District>();
    public DbSet<Subject> Subjects => Set<Subject>();
    public DbSet<TutorSubject> TutorSubjects => Set<TutorSubject>();
    public DbSet<AvailabilitySlot> AvailabilitySlots => Set<AvailabilitySlot>();
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<TutorProfileReview> TutorProfileReviews => Set<TutorProfileReview>();
    public DbSet<HireCreateOperation> HireCreateOperations => Set<HireCreateOperation>();
    public DbSet<HireRequest> HireRequests => Set<HireRequest>();
    public DbSet<RequestSchedule> RequestSchedules => Set<RequestSchedule>();
    public DbSet<Negotiation> Negotiations => Set<Negotiation>();
    public DbSet<NegotiationSchedule> NegotiationSchedules => Set<NegotiationSchedule>();
    public DbSet<RequestStatusHistory> RequestStatusHistories => Set<RequestStatusHistory>();
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<Article> Articles => Set<Article>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.ApplyConfiguration(new ApplicationUserConfiguration());
        builder.ApplyConfiguration(new AuditEventConfiguration());
        builder.ApplyConfiguration(new TutorProfileConfiguration());
        builder.ApplyConfiguration(new ProvinceConfiguration());
        builder.ApplyConfiguration(new DistrictConfiguration());
        builder.ApplyConfiguration(new SubjectConfiguration());
        builder.ApplyConfiguration(new TutorSubjectConfiguration());
        builder.ApplyConfiguration(new AvailabilitySlotConfiguration());
        builder.ApplyConfiguration(new CourseConfiguration());
        builder.ApplyConfiguration(new TutorProfileReviewConfiguration());
        builder.ApplyConfiguration(new HireRequestConfiguration());
        builder.ApplyConfiguration(new HireCreateOperationConfiguration());
        builder.ApplyConfiguration(new RequestScheduleConfiguration());
        builder.ApplyConfiguration(new NegotiationConfiguration());
        builder.ApplyConfiguration(new NegotiationScheduleConfiguration());
        builder.ApplyConfiguration(new RequestStatusHistoryConfiguration());
        builder.ApplyConfiguration(new ConversationConfiguration());
        builder.ApplyConfiguration(new MessageConfiguration());
        builder.ApplyConfiguration(new NotificationConfiguration());
        builder.ApplyConfiguration(new ArticleConfiguration());
        builder.ApplyConfiguration(new PasswordResetTokenConfiguration());
        builder.Entity<TokenSession>(entity =>
        {
            entity.ToTable("TokenSessions");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.SecurityStamp).HasMaxLength(256).IsRequired();
            entity.Property(x => x.Role).HasMaxLength(16).IsRequired();
            entity.HasOne<ApplicationUser>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });
        builder.Entity<SessionRefreshToken>(entity =>
        {
            entity.ToTable("SessionRefreshTokens");
            entity.HasKey(x => x.TokenHash);
            entity.Property(x => x.TokenHash).HasMaxLength(64);
            entity.HasOne<TokenSession>().WithMany().HasForeignKey(x => x.SessionId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<TeachingLevel>(e =>
        {
            e.ToTable("TeachingLevels"); e.HasKey(x => x.Code);
            e.Property(x => x.Code).HasMaxLength(32);
            e.Property(x => x.Name).HasMaxLength(100).IsRequired();
        });
        builder.Entity<TutorSubjectLevel>(e =>
        {
            e.ToTable("TutorSubjectLevels");
            e.HasKey(x => new { x.TutorProfileId, x.SubjectId, x.LevelCode });
            e.Property(x => x.LevelCode).HasMaxLength(32);
            e.HasOne<TutorSubject>().WithMany().HasForeignKey(x => new { x.TutorProfileId, x.SubjectId }).HasConstraintName("fk_tutor_subject_levels_tutor_subjects").OnDelete(DeleteBehavior.Cascade);
            e.HasOne<TeachingLevel>().WithMany().HasForeignKey(x => x.LevelCode).OnDelete(DeleteBehavior.Restrict);
        });
        builder.Entity<TutorProfile>().Property(x => x.Version).IsConcurrencyToken();
        builder.Entity<TutorProfile>().Property(x => x.NormalizedDisplayName).HasMaxLength(100);
        SnakeCaseNaming.Apply(builder);
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

    private void ApplyAccountInvariants()
    {
        var now = DateTimeOffset.UtcNow;
        ApplyHiringInvariants();

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

        if (ChangeTracker.Entries<TutorProfileReview>().Any(e => e.State is EntityState.Modified or EntityState.Deleted))
            throw new InvalidOperationException("Tutor review history is immutable.");

        foreach (var entry in ChangeTracker.Entries<AuditEvent>())
        {
            if (entry.State == EntityState.Added && entry.Entity.CreatedAt == default)
            {
                entry.Entity.CreatedAt = now;
            }
        }

        foreach (var entry in ChangeTracker.Entries<TutorProfile>())
        {
            if (entry.State is not (EntityState.Added or EntityState.Modified))
            {
                continue;
            }

            entry.Entity.Version = Guid.NewGuid();
            var name = ChangeTracker.Entries<ApplicationUser>().FirstOrDefault(u => u.Entity.Id == entry.Entity.UserId)?.Entity.FullName;
            if (name is not null) entry.Entity.NormalizedDisplayName = NormalizeSearchName(name);
            entry.Entity.UpdatedAt = now;
            if (entry.State == EntityState.Added && entry.Entity.CreatedAt == default)
            {
                entry.Entity.CreatedAt = now;
            }
        }
    }
    private void ApplyHiringInvariants()
    {
        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.Entity is Negotiation or NegotiationSchedule or RequestStatusHistory or HireCreateOperation or RequestSchedule)
            {
                if (entry.State is EntityState.Modified or EntityState.Deleted)
                    throw new InvalidOperationException("Hiring history and initial schedules are immutable.");
                if (entry.State == EntityState.Added && entry.Entity is RequestSchedule schedule &&
                    !ChangeTracker.Entries<HireRequest>().Any(r => r.State == EntityState.Added && r.Entity.Id == schedule.HireRequestId))
                    throw new InvalidOperationException("Cannot append to persisted initial schedules.");
                if (entry.State == EntityState.Added && entry.Entity is NegotiationSchedule proposalSchedule &&
                    !ChangeTracker.Entries<Negotiation>().Any(n => n.State == EntityState.Added && n.Entity.Id == proposalSchedule.NegotiationId))
                    throw new InvalidOperationException("Cannot append to a persisted proposal snapshot.");
                if (entry.State == EntityState.Added && entry.Entity is RequestStatusHistory { ActorUserId: null, IsLegacy: false })
                    throw new InvalidOperationException("New hiring events require an actor.");
            }
        }
        foreach (var entry in ChangeTracker.Entries<HireRequest>().Where(e => e.State == EntityState.Modified))
        {
            foreach (var name in new[] { nameof(HireRequest.InitialTerms), nameof(HireRequest.ListedPriceVnd),
                nameof(HireRequest.RequesterUserId), nameof(HireRequest.TutorProfileId), nameof(HireRequest.IsLegacy) })
                if (entry.Property(name).IsModified) throw new InvalidOperationException("Initial hiring terms and participants are immutable.");
            if (entry.Property(x => x.FinalAgreement).OriginalValue is not null && entry.Property(x => x.FinalAgreement).IsModified)
                throw new InvalidOperationException("Accepted hiring agreement is immutable.");
            entry.Entity.Version = Guid.NewGuid();
        }
    }

    public static string NormalizeSearchName(string value)
    {
        var decomposed = value.Trim().ToLowerInvariant().Replace('đ', 'd').Normalize(System.Text.NormalizationForm.FormD);
        return string.Concat(decomposed.Where(c => System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c) != System.Globalization.UnicodeCategory.NonSpacingMark))
            .Normalize(System.Text.NormalizationForm.FormC);
    }

}
