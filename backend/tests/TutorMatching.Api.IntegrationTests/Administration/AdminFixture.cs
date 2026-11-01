using System.Net;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using TutorMatching.Api.IntegrationTests.Authentication;
using TutorMatching.Api.IntegrationTests.Fixtures;
using TutorMatching.Api.IntegrationTests.Hiring;
using TutorMatching.Api.IntegrationTests.Messaging;
using TutorMatching.Domain.Catalog;
using TutorMatching.Domain.Content;
using TutorMatching.Domain.Users;
using TutorMatching.Infrastructure.Auditing;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Api.IntegrationTests.Administration;

/// <summary>Administrative scenarios share synthetic business history, never developer or deployed data.</summary>
internal sealed class AdminFixture : IAsyncDisposable
{
    private const string Password = "Synthetic-admin-123!";
    public const string TeachingLevelCode = "SPRINT4-LEVEL";
    public MessagingFixture Messaging { get; }
    public ApiWebApplicationFactory Factory => Messaging.Factory;
    public HiringActor Admin => Messaging.Admin;
    public HiringActor SecondAdmin { get; private set; } = null!;
    public Guid SubjectId => Messaging.SubjectId;
    public Guid InactiveSubjectId { get; } = Guid.NewGuid();
    public Guid DraftArticleId { get; } = Guid.NewGuid();
    public Guid PublishedArticleId { get; } = Guid.NewGuid();
    public Guid HiddenArticleId { get; } = Guid.NewGuid();

    private AdminFixture(MessagingFixture messaging) => Messaging = messaging;

    public static async Task<AdminFixture> CreateAsync(PostgreSqlFixture postgres)
    {
        var fixture = new AdminFixture(await MessagingFixture.CreateAsync(postgres));
        try { await fixture.SeedAsync(); return fixture; }
        catch { await fixture.DisposeAsync(); throw; }
    }

    public Task<T> WithDbAsync<T>(Func<ApplicationDbContext, Task<T>> action) => Messaging.WithDbAsync(action);

    public async Task<HttpClient> CreateClientAsync(HiringActor actor)
    {
        if (actor.Id != SecondAdmin.Id) return await Messaging.CreateClientAsync(actor);
        var client = Factory.CreateApiClient();
        try
        {
            using var response = await SessionEndpointTests.Post(client, "login", new { email = actor.Email, password = Password });
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            return client;
        }
        catch { client.Dispose(); throw; }
    }

    private async Task SeedAsync()
    {
        await using var scope = Factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var now = Factory.Clock.GetUtcNow();
        var admin = new ApplicationUser
        {
            Id = Guid.NewGuid(), UserName = "second-admin@example.test", Email = "second-admin@example.test",
            FullName = "Synthetic second administrator", Role = AccountRole.ADMIN, Status = AccountStatus.ACTIVE,
            CreatedAt = now, UpdatedAt = now
        };
        var result = await users.CreateAsync(admin, Password);
        Assert.True(result.Succeeded, string.Join(", ", result.Errors.Select(e => e.Code)));
        SecondAdmin = new HiringActor(admin.Id, admin.Email, admin.Role);
        db.Subjects.Add(new Subject
        {
            Id = InactiveSubjectId, Name = "Synthetic inactive subject", IsActive = false, CreatedAt = now, UpdatedAt = now
        });
        db.Set<TeachingLevel>().Add(new TeachingLevel { Code = TeachingLevelCode, Name = "Synthetic teaching level" });
        foreach (var (id, status) in new[] { (DraftArticleId, "DRAFT"), (PublishedArticleId, "PUBLISHED"), (HiddenArticleId, "HIDDEN") })
        {
            db.Articles.Add(new Article
            {
                Id = id, AuthorUserId = Admin.Id, Title = $"Synthetic {status.ToLowerInvariant()} article",
                Slug = $"synthetic-{status.ToLowerInvariant()}", Summary = "Synthetic article summary",
                Content = "Synthetic plain-text article content", StatusCode = status,
                PublishedAt = status == "DRAFT" ? null : now.AddDays(-1), CreatedAt = now.AddDays(-2), UpdatedAt = now
            });
            db.AuditEvents.Add(new AuditEvent
            {
                Id = Guid.NewGuid(), ActorUserId = Admin.Id, Action = $"ARTICLE_{status}",
                EntityType = "Article", EntityId = id.ToString(), CreatedAt = now
            });
        }
        await db.SaveChangesAsync();
    }

    public ValueTask DisposeAsync() => Messaging.DisposeAsync();
}
