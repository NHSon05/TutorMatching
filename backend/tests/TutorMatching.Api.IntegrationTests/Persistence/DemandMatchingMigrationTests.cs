using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using TutorMatching.Api.IntegrationTests.Fixtures;
using TutorMatching.Domain.Content;
using TutorMatching.Domain.Notifications;
using TutorMatching.Domain.Tutors;
using TutorMatching.Domain.Users;
using TutorMatching.Infrastructure.Persistence;
using Xunit;

namespace TutorMatching.Api.IntegrationTests.Persistence;

[Collection("PostgreSQL API")]
public sealed class DemandMatchingMigrationTests(PostgreSqlFixture fixture)
{
    [Fact]
    public async Task Migration_CreatesAllSprint006TablesAndUniqueIndexes()
    {
        await using var factory = await fixture.CreateFactoryAsync();
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var connection = (NpgsqlConnection)db.Database.GetDbConnection();
        if (connection.State != System.Data.ConnectionState.Open)
        {
            await connection.OpenAsync();
        }

        string[] expectedTables =
        [
            "demand_posts",
            "extracted_demand_details",
            "tutor_matching_profiles",
            "post_match_notifications",
            "retention_cleanup_logs",
        ];

        foreach (var table in expectedTables)
        {
            await using var cmd = new NpgsqlCommand(
                """
                SELECT EXISTS (
                    SELECT 1
                    FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = @table
                );
                """,
                connection);
            cmd.Parameters.AddWithValue("table", table);
            var exists = (bool)(await cmd.ExecuteScalarAsync())!;
            Assert.True(exists, $"Expected table '{table}' to exist after migration.");
        }

        string[] expectedUniqueIndexes =
        [
            "uq_extracted_demand_details_post_id",
            "uq_tutor_matching_profiles_tutor",
            "uq_post_match_notifications_detail_tutor",
        ];

        foreach (var indexName in expectedUniqueIndexes)
        {
            await using var cmd = new NpgsqlCommand(
                """
                SELECT EXISTS (
                    SELECT 1
                    FROM pg_indexes
                    WHERE schemaname = 'public' AND indexname = @indexName
                );
                """,
                connection);
            cmd.Parameters.AddWithValue("indexName", indexName);
            var exists = (bool)(await cmd.ExecuteScalarAsync())!;
            Assert.True(exists, $"Expected unique index '{indexName}' to exist after migration.");
        }
    }

    [Fact]
    public async Task CascadeDelete_DeletingDemandPost_RemovesExtractedDetailsAndMatchNotifications()
    {
        await using var factory = await fixture.CreateFactoryAsync();
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var email = $"tutor.{Guid.NewGuid():N}@example.com";
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = email,
            NormalizedUserName = email.ToUpperInvariant(),
            Email = email,
            NormalizedEmail = email.ToUpperInvariant(),
            FullName = "Nguyễn Văn A",
            Role = AccountRole.TUTOR,
            Status = AccountStatus.ACTIVE,
            SecurityStamp = Guid.NewGuid().ToString("N"),
            ConcurrencyStamp = Guid.NewGuid().ToString("N"),
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };
        db.Users.Add(user);

        var tutorProfile = new TutorProfile
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            NormalizedDisplayName = "nguyen van a",
            Status = TutorProfileStatus.APPROVED,
            CurrentStep = 6,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
            ApprovedAt = DateTimeOffset.UtcNow,
        };
        db.TutorProfiles.Add(tutorProfile);

        var post = DemandPost.Create(
            actorFingerprint: "ip:127.0.0.1",
            contentHash: "cascade_test_hash_1234567890",
            rawContent: "Tìm gia sư Toán lớp 9 tại Cầu Giấy, Hà Nội, học phí 250k/buổi");
        post.MarkExtracted();
        db.DemandPosts.Add(post);

        var detail = ExtractedDemandDetail.Create(
            demandPostId: post.Id,
            subjectId: null,
            subjectNameRaw: "Toán",
            gradeLevel: 9,
            tuitionFeeVnd: 250_000,
            feePeriod: "PER_SESSION",
            isFeeNegotiable: false,
            sessionsPerWeek: 2,
            teachingMode: "OFFLINE",
            provinceCode: null,
            districtCode: null,
            rawAddress: "Cầu Giấy",
            isLocationAmbiguous: true,
            scheduleNotes: null,
            confidenceScore: 0.90m,
            extractedJson: """{"subject":"Toán"}""");
        db.ExtractedDemandDetails.Add(detail);

        var notification = new PostMatchNotification
        {
            Id = Guid.NewGuid(),
            ExtractedDemandDetailId = detail.Id,
            TutorProfileId = tutorProfile.Id,
            MatchScore = 0.88m,
            IsRead = false,
            SentAt = DateTimeOffset.UtcNow,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        db.PostMatchNotifications.Add(notification);

        await db.SaveChangesAsync();

        // Act: Delete parent demand_post
        db.DemandPosts.Remove(post);
        await db.SaveChangesAsync();

        // Assert: Child extracted_demand_detail and post_match_notification are cascade-deleted
        Assert.False(await db.ExtractedDemandDetails.AnyAsync(x => x.Id == detail.Id));
        Assert.False(await db.PostMatchNotifications.AnyAsync(x => x.Id == notification.Id));
    }
}
