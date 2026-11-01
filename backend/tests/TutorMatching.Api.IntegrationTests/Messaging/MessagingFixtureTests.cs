using System.Net;
using Microsoft.EntityFrameworkCore;
using TutorMatching.Api.IntegrationTests.Authentication;
using TutorMatching.Api.IntegrationTests.Fixtures;
using TutorMatching.Domain.Users;

namespace TutorMatching.Api.IntegrationTests.Messaging;

[Collection("PostgreSQL API")]
public sealed class MessagingFixtureTests(PostgreSqlFixture postgres)
{
    [Fact]
    public async Task SeedsSeparateRequestParticipantsTiedMessageHistoryAndLockedAccount()
    {
        await using var fixture = await MessagingFixture.CreateAsync(postgres);
        foreach (var actor in new[] { fixture.Learner, fixture.Tutor, fixture.OutsiderLearner, fixture.OutsiderTutor, fixture.Admin })
        {
            using var client = await fixture.CreateClientAsync(actor);
            using var response = await client.GetAsync($"/api/v1/users/me/access/{actor.Role}");
            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        }
        using var anonymous = fixture.Factory.CreateApiClient();
        using var denied = await SessionEndpointTests.Post(anonymous, "login", new
        {
            email = fixture.LockedAccount.Email, password = MessagingFixture.Password
        });
        Assert.Equal(HttpStatusCode.Unauthorized, denied.StatusCode);
        await fixture.WithDbAsync(async db =>
        {
            Assert.Equal(AccountStatus.LOCKED, (await db.Users.SingleAsync(u => u.Id == fixture.LockedAccount.Id)).Status);
            var requests = await db.HireRequests.Include(r => r.TutorProfile).ToListAsync();
            Assert.Equal(2, requests.Count);
            var primary = Assert.Single(requests, r => r.Id == fixture.HireRequestId);
            Assert.Equal(fixture.Learner.Id, primary.RequesterUserId);
            Assert.Equal(fixture.Tutor.Id, primary.TutorProfile!.UserId);
            var secondary = Assert.Single(requests, r => r.Id == fixture.SecondHireRequestId);
            Assert.Equal(fixture.OutsiderLearner.Id, secondary.RequesterUserId);
            Assert.Equal(fixture.OutsiderTutor.Id, secondary.TutorProfile!.UserId);
            Assert.Equal(2, await db.Conversations.CountAsync());
            Assert.Equal(2, await db.RequestStatusHistories.CountAsync());
            Assert.Equal(2, await db.Notifications.CountAsync());
            var messages = await db.Messages.Where(m => m.ConversationId == fixture.ConversationId).ToListAsync();
            Assert.Equal(4, messages.Count);
            Assert.Single(messages.Select(m => m.SentAt).Distinct());
            Assert.Equal(2, messages.Count(m => m.SenderUserId == fixture.Learner.Id));
            Assert.Equal(2, messages.Count(m => m.SenderUserId == fixture.Tutor.Id));
            Assert.Equal(2, messages.Count(m => m.ReadAt is not null));
            Assert.Single(await db.Messages.Where(m => m.ConversationId == fixture.SecondConversationId).ToListAsync());
            return true;
        });
    }

    [Fact]
    public async Task FactoriesKeepActorsRequestsAndMessagesIsolated()
    {
        await using var first = await MessagingFixture.CreateAsync(postgres);
        await using var second = await MessagingFixture.CreateAsync(postgres);
        Assert.NotEqual(first.ConversationId, second.ConversationId);
        await second.WithDbAsync(async db =>
        {
            Assert.False(await db.Users.AnyAsync(u => u.Id == first.Learner.Id));
            Assert.False(await db.Conversations.AnyAsync(c => c.Id == first.ConversationId));
            Assert.Equal(5, await db.Messages.CountAsync());
            return true;
        });
    }
}
