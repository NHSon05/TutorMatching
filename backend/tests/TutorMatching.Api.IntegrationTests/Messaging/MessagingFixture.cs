using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorMatching.Api.IntegrationTests.Fixtures;
using TutorMatching.Api.IntegrationTests.Hiring;
using TutorMatching.Domain.Messaging;
using TutorMatching.Domain.Users;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Api.IntegrationTests.Messaging;

/// <summary>Synthetic request-scoped history in a fresh, migrated PostgreSQL Testcontainer database.</summary>
internal sealed class MessagingFixture : IAsyncDisposable
{
    internal const string Password = "Synthetic-messaging-123!";
    private readonly HiringFixture hiring;
    public ApiWebApplicationFactory Factory => hiring.Factory;
    public HiringActor Learner => hiring.Learner;
    public HiringActor Tutor => hiring.Tutor;
    public HiringActor OutsiderLearner => hiring.OtherLearner;
    public HiringActor OutsiderTutor => hiring.OtherTutor;
    public HiringActor Admin => hiring.Admin;
    public HiringActor LockedAccount { get; private set; } = null!;
    public Guid SubjectId => hiring.SubjectId;
    public Guid HireRequestId { get; private set; }
    public Guid SecondHireRequestId { get; private set; }
    public Guid ConversationId { get; private set; }
    public Guid SecondConversationId { get; private set; }

    private MessagingFixture(HiringFixture hiring) => this.hiring = hiring;

    public static async Task<MessagingFixture> CreateAsync(PostgreSqlFixture postgres)
    {
        var fixture = new MessagingFixture(await HiringFixture.CreateAsync(postgres));
        try { await fixture.SeedAsync(); return fixture; }
        catch { await fixture.DisposeAsync(); throw; }
    }

    public Task<T> WithDbAsync<T>(Func<ApplicationDbContext, Task<T>> action) => hiring.WithDbAsync(action);
    public Task<HttpClient> CreateClientAsync(HiringActor actor) => hiring.CreateClientAsync(actor);
    public Task<IAsyncDisposable> FailNotificationWritesAsync() => hiring.FailNotificationWritesAsync();

    private async Task SeedAsync()
    {
        async Task<Guid> CreateRequest(HiringActor learner, Guid tutorProfileId)
        {
            using var client = await hiring.CreateClientAsync(learner);
            var payload = CreateHireRequestTests.Payload(hiring);
            payload["tutorProfileId"] = tutorProfileId.ToString();
            using var response = await CreateHireRequestTests.Send(client, payload, Guid.NewGuid());
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            return (await response.Content.ReadFromJsonAsync<JsonObject>())!["id"]!.GetValue<Guid>();
        }
        HireRequestId = await CreateRequest(Learner, hiring.TutorProfileId);
        SecondHireRequestId = await CreateRequest(OutsiderLearner, hiring.OtherTutorProfileId);
        await using var scope = Factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var now = Factory.Clock.GetUtcNow();
        var locked = new ApplicationUser
        {
            Id = Guid.NewGuid(), UserName = "messaging-locked@example.test", Email = "messaging-locked@example.test",
            FullName = "Synthetic locked learner", Role = AccountRole.LEARNER, Status = AccountStatus.LOCKED,
            CreatedAt = now, UpdatedAt = now
        };
        var result = await users.CreateAsync(locked, Password);
        Assert.True(result.Succeeded, string.Join(", ", result.Errors.Select(e => e.Code)));
        LockedAccount = new HiringActor(locked.Id, locked.Email, locked.Role);
        ConversationId = await db.Conversations.Where(c => c.HireRequestId == HireRequestId).Select(c => c.Id).SingleAsync();
        SecondConversationId = await db.Conversations.Where(c => c.HireRequestId == SecondHireRequestId).Select(c => c.Id).SingleAsync();
        for (var i = 0; i < 4; i++)
            db.Messages.Add(new Message
            {
                Id = Guid.NewGuid(), ConversationId = ConversationId,
                SenderUserId = i % 2 == 0 ? Learner.Id : Tutor.Id,
                Content = $"Synthetic message {i + 1}", SentAt = now,
                ReadAt = i < 2 ? now.AddSeconds(1) : null
            });
        db.Messages.Add(new Message
        {
            Id = Guid.NewGuid(), ConversationId = SecondConversationId, SenderUserId = OutsiderLearner.Id,
            Content = "Synthetic second-request message", SentAt = now
        });
        await db.SaveChangesAsync();
    }

    public ValueTask DisposeAsync() => hiring.DisposeAsync();
}
