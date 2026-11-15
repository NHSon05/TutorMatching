using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using TutorMatching.Api.IntegrationTests.Fixtures;
using TutorMatching.Domain.Notifications;

namespace TutorMatching.Api.IntegrationTests.Messaging;

[Collection("PostgreSQL API")]
public sealed class NotificationEndpointTests(PostgreSqlFixture postgres)
{
    [Fact]
    public async Task HireCreationNotifiesOnlyTheTutorAndListIsOwnerScoped()
    {
        await using var f = await MessagingFixture.CreateAsync(postgres);
        using var tutor = await f.CreateClientAsync(f.Tutor);
        using var response = await tutor.GetAsync("/api/v1/notifications");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains("no-store", response.Headers.CacheControl!.ToString());
        var page = (await response.Content.ReadFromJsonAsync<JsonObject>())!;
        var item = Assert.Single(page["items"]!.AsArray())!;
        Assert.Equal("HIRE_REQUEST_CREATED", item["type"]!.GetValue<string>());
        Assert.False(item["isRead"]!.GetValue<bool>());
        Assert.Null(item["readAt"]);
        Assert.Equal(1, page["unreadCount"]!.GetValue<int>());
        Assert.Null(page["nextCursor"]);
        Assert.False(string.IsNullOrEmpty(page["readAllBoundary"]!.GetValue<string>()));

        using var learner = await f.CreateClientAsync(f.Learner);
        var learnerPage = (await learner.GetFromJsonAsync<JsonObject>("/api/v1/notifications"))!;
        Assert.Empty(learnerPage["items"]!.AsArray());
        var count = (await learner.GetFromJsonAsync<JsonObject>("/api/v1/notifications/unread-count"))!;
        Assert.Equal(0, count["unreadCount"]!.GetValue<int>());
        Assert.NotNull(count["asOf"]);

        using var anonymous = f.Factory.CreateApiClient();
        using var denied = await anonymous.GetAsync("/api/v1/notifications");
        Assert.Equal(HttpStatusCode.Unauthorized, denied.StatusCode);
    }

    [Fact]
    public async Task OpenResolvesTheHireRequestMarksReadOnceAndHidesOtherOwnersItems()
    {
        await using var f = await MessagingFixture.CreateAsync(postgres);
        var id = await OnlyNotificationIdAsync(f, f.Tutor.Id);
        using var tutor = await f.CreateClientAsync(f.Tutor);

        using var opened = await Post(tutor, $"/api/v1/notifications/{id}/open");
        Assert.Equal(HttpStatusCode.OK, opened.StatusCode);
        var result = (await opened.Content.ReadFromJsonAsync<JsonObject>())!;
        Assert.False(result["unavailable"]!.GetValue<bool>());
        Assert.Equal("HIRE_REQUEST", result["target"]!["kind"]!.GetValue<string>());
        Assert.Equal(f.HireRequestId, result["target"]!["id"]!.GetValue<Guid>());
        Assert.True(result["notification"]!["isRead"]!.GetValue<bool>());
        var firstReadAt = result["notification"]!["readAt"]!.GetValue<DateTimeOffset>();

        f.Factory.Clock.Advance(TimeSpan.FromSeconds(1));
        using var reread = await Post(tutor, $"/api/v1/notifications/{id}/read");
        Assert.Equal(HttpStatusCode.OK, reread.StatusCode);
        var again = (await reread.Content.ReadFromJsonAsync<JsonObject>())!;
        Assert.Equal(firstReadAt, again["readAt"]!.GetValue<DateTimeOffset>());

        using var outsider = await f.CreateClientAsync(f.OutsiderTutor);
        foreach (var action in new[] { "open", "read" })
        {
            using var hidden = await Post(outsider, $"/api/v1/notifications/{id}/{action}");
            Assert.Equal(HttpStatusCode.NotFound, hidden.StatusCode);
        }
        using var missing = await Post(tutor, $"/api/v1/notifications/{Guid.NewGuid()}/open");
        Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);
        using var noCsrf = await Post(tutor, $"/api/v1/notifications/{id}/read", csrf: false);
        Assert.Equal(HttpStatusCode.BadRequest, noCsrf.StatusCode);
    }

    [Fact]
    public async Task OpenReportsUnavailableForInaccessibleTargetsAndMapsMessageNotifications()
    {
        await using var f = await MessagingFixture.CreateAsync(postgres);
        var now = f.Factory.Clock.GetUtcNow();
        var foreign = Guid.NewGuid();
        var orphan = Guid.NewGuid();
        var message = Guid.NewGuid();
        await f.WithDbAsync(async db =>
        {
            var messageId = await db.Messages.Where(m => m.ConversationId == f.ConversationId && m.SenderUserId == f.Learner.Id)
                .Select(m => m.Id).FirstAsync();
            db.Notifications.AddRange(
                // Points at a request the tutor does not participate in.
                new Notification { Id = foreign, UserId = f.Tutor.Id, TypeCode = "HIRE_REQUEST_CREATED", Title = "x", HireRequestId = f.SecondHireRequestId, CreatedAt = now },
                new Notification { Id = orphan, UserId = f.Tutor.Id, TypeCode = "HIRE_REQUEST_CANCELLED", Title = "x", CreatedAt = now },
                // Legacy type code written by the outbox worker before the contract name was adopted.
                new Notification { Id = message, UserId = f.Tutor.Id, TypeCode = "NEW_MESSAGE", Title = "x", MessageId = messageId, CreatedAt = now });
            return await db.SaveChangesAsync();
        });
        using var tutor = await f.CreateClientAsync(f.Tutor);
        foreach (var id in new[] { foreign, orphan })
        {
            using var response = await Post(tutor, $"/api/v1/notifications/{id}/open");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var result = (await response.Content.ReadFromJsonAsync<JsonObject>())!;
            Assert.True(result["unavailable"]!.GetValue<bool>());
            Assert.Null(result["target"]);
            Assert.True(result["notification"]!["isRead"]!.GetValue<bool>());
        }
        using var opened = await Post(tutor, $"/api/v1/notifications/{message}/open");
        var conversation = (await opened.Content.ReadFromJsonAsync<JsonObject>())!;
        Assert.Equal("MESSAGE_CREATED", conversation["notification"]!["type"]!.GetValue<string>());
        Assert.Equal("CONVERSATION", conversation["target"]!["kind"]!.GetValue<string>());
        Assert.Equal(f.ConversationId, conversation["target"]!["id"]!.GetValue<Guid>());
        Assert.Equal(f.HireRequestId, conversation["target"]!["hireRequestId"]!.GetValue<Guid>());
    }

    [Fact]
    public async Task ReadAllLeavesArrivalsAfterTheBoundaryUnreadAndRejectsAnotherOwnersBoundary()
    {
        await using var f = await MessagingFixture.CreateAsync(postgres);
        using var tutor = await f.CreateClientAsync(f.Tutor);
        var boundary = (await tutor.GetFromJsonAsync<JsonObject>("/api/v1/notifications"))!["readAllBoundary"]!.GetValue<string>();

        f.Factory.Clock.Advance(TimeSpan.FromSeconds(10));
        await AddNotificationsAsync(f, f.Tutor.Id, 1);

        using var outsider = await f.CreateClientAsync(f.OutsiderTutor);
        using var foreign = await Post(outsider, "/api/v1/notifications/read-all", new JsonObject { ["boundary"] = boundary });
        Assert.Equal(HttpStatusCode.BadRequest, foreign.StatusCode);
        using var malformed = await Post(tutor, "/api/v1/notifications/read-all", new JsonObject { ["boundary"] = "not-a-boundary" });
        Assert.Equal(HttpStatusCode.BadRequest, malformed.StatusCode);

        using var response = await Post(tutor, "/api/v1/notifications/read-all", new JsonObject { ["boundary"] = boundary });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = (await response.Content.ReadFromJsonAsync<JsonObject>())!;
        Assert.Equal(1, result["changedCount"]!.GetValue<int>());
        Assert.Equal(1, result["unreadCount"]!.GetValue<int>());

        // The outsider's own notification is untouched by either call.
        var outsiderCount = (await outsider.GetFromJsonAsync<JsonObject>("/api/v1/notifications/unread-count"))!;
        Assert.Equal(1, outsiderCount["unreadCount"]!.GetValue<int>());
    }

    [Fact]
    public async Task PagesAreStableNewestFirstAndCursorsAreBoundToOwnerAndFilter()
    {
        await using var f = await MessagingFixture.CreateAsync(postgres);
        await AddNotificationsAsync(f, f.Tutor.Id, 4);
        using var tutor = await f.CreateClientAsync(f.Tutor);

        var first = (await tutor.GetFromJsonAsync<JsonObject>("/api/v1/notifications?pageSize=3"))!;
        var cursor = first["nextCursor"]!.GetValue<string>();
        // An arrival between pages must not shift or duplicate items on the next page.
        f.Factory.Clock.Advance(TimeSpan.FromMinutes(1));
        await AddNotificationsAsync(f, f.Tutor.Id, 1);
        var second = (await tutor.GetFromJsonAsync<JsonObject>($"/api/v1/notifications?pageSize=3&cursor={cursor}"))!;
        Assert.Null(second["nextCursor"]);
        var items = first["items"]!.AsArray().Concat(second["items"]!.AsArray()).ToArray();
        Assert.Equal(5, items.Length);
        Assert.Equal(5, items.Select(x => x!["id"]!.GetValue<Guid>()).Distinct().Count());
        var times = items.Select(x => x!["createdAt"]!.GetValue<DateTimeOffset>()).ToArray();
        Assert.Equal(times.OrderDescending(), times);

        using var wrongFilter = await tutor.GetAsync($"/api/v1/notifications?pageSize=3&unreadOnly=true&cursor={cursor}");
        Assert.Equal(HttpStatusCode.BadRequest, wrongFilter.StatusCode);
        using var outsider = await f.CreateClientAsync(f.OutsiderTutor);
        using var wrongOwner = await outsider.GetAsync($"/api/v1/notifications?pageSize=3&cursor={cursor}");
        Assert.Equal(HttpStatusCode.BadRequest, wrongOwner.StatusCode);
        using var malformed = await tutor.GetAsync("/api/v1/notifications?cursor=%%%");
        Assert.Equal(HttpStatusCode.BadRequest, malformed.StatusCode);

        var unread = (await tutor.GetFromJsonAsync<JsonObject>("/api/v1/notifications?unreadOnly=true&pageSize=100"))!;
        Assert.Equal(6, unread["items"]!.AsArray().Count);
        Assert.Equal(6, unread["unreadCount"]!.GetValue<int>());
    }

    [Fact]
    public async Task ProposalNotifiesTheOtherParticipant()
    {
        await using var f = await MessagingFixture.CreateAsync(postgres);
        using var tutor = await f.CreateClientAsync(f.Tutor);
        var detail = (await tutor.GetFromJsonAsync<JsonObject>($"/api/v1/hire-requests/{f.HireRequestId}"))!;
        using var proposed = await Post(tutor, $"/api/v1/hire-requests/{f.HireRequestId}/proposals", new JsonObject
        {
            ["expectedVersion"] = detail["version"]!.GetValue<string>(),
            ["priceVnd"] = 170000
        });
        Assert.Equal(HttpStatusCode.OK, proposed.StatusCode);
        using var learner = await f.CreateClientAsync(f.Learner);
        var page = (await learner.GetFromJsonAsync<JsonObject>("/api/v1/notifications"))!;
        Assert.Equal("HIRE_REQUEST_PROPOSED", Assert.Single(page["items"]!.AsArray())!["type"]!.GetValue<string>());
    }

    private static Task<Guid> OnlyNotificationIdAsync(MessagingFixture f, Guid userId) =>
        f.WithDbAsync(db => db.Notifications.Where(n => n.UserId == userId).Select(n => n.Id).SingleAsync());

    private static Task<int> AddNotificationsAsync(MessagingFixture f, Guid userId, int count) => f.WithDbAsync(db =>
    {
        for (var i = 0; i < count; i++)
        {
            f.Factory.Clock.Advance(TimeSpan.FromSeconds(1));
            db.Notifications.Add(new Notification
            {
                Id = Guid.NewGuid(), UserId = userId, TypeCode = "HIRE_REQUEST_PROPOSED", Title = $"Synthetic {i}",
                HireRequestId = null, CreatedAt = f.Factory.Clock.GetUtcNow()
            });
        }
        return db.SaveChangesAsync();
    });

    [Fact]
    public async Task MessageActivityIsBadgedOnMessengerNotTheBellAndClearsWhenMessagesAreRead()
    {
        await using var f = await MessagingFixture.CreateAsync(postgres);
        // Fixture: the learner has exactly one unread incoming message (from the tutor) in the first conversation.
        var unreadMessageId = await f.WithDbAsync(db => db.Messages
            .Where(m => m.ConversationId == f.ConversationId && m.SenderUserId == f.Tutor.Id && m.ReadAt == null)
            .Select(m => m.Id).SingleAsync());
        await f.WithDbAsync(db =>
        {
            var now = f.Factory.Clock.GetUtcNow();
            db.Notifications.Add(new Notification
            {
                Id = Guid.NewGuid(), UserId = f.Learner.Id, TypeCode = "MESSAGE_CREATED", Title = "Tin nhắn mới",
                MessageId = unreadMessageId, CreatedAt = now
            });
            db.Notifications.Add(new Notification
            {
                Id = Guid.NewGuid(), UserId = f.Learner.Id, TypeCode = "NEW_MESSAGE", Title = "Legacy message",
                CreatedAt = now
            });
            db.Notifications.Add(new Notification
            {
                Id = Guid.NewGuid(), UserId = f.Learner.Id, TypeCode = "HIRE_REQUEST_PROPOSED", Title = "Đề xuất mới",
                CreatedAt = now
            });
            return db.SaveChangesAsync();
        });
        using var learner = await f.CreateClientAsync(f.Learner);

        var count = (await learner.GetFromJsonAsync<JsonObject>("/api/v1/notifications/unread-count"))!;
        Assert.Equal(1, count["unreadCount"]!.GetValue<int>());
        Assert.Equal(1, count["messageUnreadCount"]!.GetValue<int>());
        var page = (await learner.GetFromJsonAsync<JsonObject>("/api/v1/notifications"))!;
        Assert.Equal(3, page["items"]!.AsArray().Count);
        Assert.Equal(1, page["unreadCount"]!.GetValue<int>());

        using var read = await Post(learner, $"/api/v1/conversations/{f.ConversationId}/read",
            new JsonObject { ["messageIds"] = new JsonArray(unreadMessageId) });
        Assert.Equal(HttpStatusCode.OK, read.StatusCode);

        count = (await learner.GetFromJsonAsync<JsonObject>("/api/v1/notifications/unread-count"))!;
        Assert.Equal(0, count["messageUnreadCount"]!.GetValue<int>());
        Assert.Equal(1, count["unreadCount"]!.GetValue<int>());
        Assert.True(await f.WithDbAsync(db => db.Notifications.AnyAsync(n =>
            n.MessageId == unreadMessageId && n.IsRead && n.ReadAt != null)));

        // Each participant counts only incoming unread messages in their own conversations: the tutor has one
        // unread learner message in the first conversation; the other tutor only the second conversation's message.
        foreach (var actor in new[] { f.Tutor, f.OutsiderTutor })
        {
            using var client = await f.CreateClientAsync(actor);
            var own = (await client.GetFromJsonAsync<JsonObject>("/api/v1/notifications/unread-count"))!;
            Assert.Equal(1, own["messageUnreadCount"]!.GetValue<int>());
        }
    }

    private static async Task<HttpResponseMessage> Post(HttpClient client, string path, JsonObject? body = null, bool csrf = true)
    {
        using var message = new HttpRequestMessage(HttpMethod.Post, path);
        if (body is not null) message.Content = JsonContent.Create(body);
        if (csrf)
        {
            var token = await client.GetFromJsonAsync<JsonObject>("/api/v1/auth/csrf");
            message.Headers.Add(token!["headerName"]!.GetValue<string>(), token["requestToken"]!.GetValue<string>());
        }
        return await client.SendAsync(message);
    }
}
