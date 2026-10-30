using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using TutorMatching.Api.IntegrationTests.Fixtures;

namespace TutorMatching.Api.IntegrationTests.Hiring;

[Collection("PostgreSQL API")]
public sealed class NegotiationEndpointTests(PostgreSqlFixture postgres)
{
    private static async Task<JsonObject> Create(HiringFixture f)
    {
        using var learner = await f.CreateClientAsync(f.Learner);
        using var response = await CreateHireRequestTests.Send(learner, CreateHireRequestTests.Payload(f), Guid.NewGuid());
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonObject>())!;
    }
    private static async Task<HttpResponseMessage> Send(HttpClient client, JsonObject state, string action, JsonObject body, bool csrf = true)
    {
        body["expectedVersion"] = state["version"]!.DeepClone();
        using var message = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/hire-requests/{state["id"]}/{action}") { Content = JsonContent.Create(body) };
        if (csrf) { var token = (await client.GetFromJsonAsync<JsonObject>("/api/v1/auth/csrf"))!;
            message.Headers.Add(token["headerName"]!.GetValue<string>(), token["requestToken"]!.GetValue<string>()); }
        return await client.SendAsync(message);
    }
    private static async Task<JsonObject> Propose(HttpClient client, JsonObject state, int price)
    {
        using var response = await Send(client, state, "proposals", new() { ["priceVnd"] = price });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonObject>())!;
    }
    private static Task<JsonObject?> Detail(HttpClient client, JsonObject state) => client.GetFromJsonAsync<JsonObject>($"/api/v1/hire-requests/{state["id"]}");

    [Fact]
    public async Task BothParticipantsExchangeImmutableTermsAndOnlyLatestRecipientAccepts()
    {
        await using var f = await HiringFixture.CreateAsync(postgres);
        var original = await Create(f);
        using var tutor = await f.CreateClientAsync(f.Tutor); using var learner = await f.CreateClientAsync(f.Learner);
        var first = await Propose(tutor, original, 170000);
        Assert.Equal(HttpStatusCode.Conflict, (await Send(tutor, first, "accept", new() { ["proposalSequence"] = 1 })).StatusCode);
        var firstDetail = (await Detail(learner, first))!;
        Assert.Contains("accept", firstDetail["allowedActions"]!.AsArray().Select(x => x!.GetValue<string>()));
        using var response = await Send(learner, first, "proposals", new() { ["schedules"] = JsonNode.Parse("[{\"dayOfWeek\":1,\"startTime\":\"19:00\",\"endTime\":\"20:00\"}]"), ["note"] = "Later time" });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var second = (await response.Content.ReadFromJsonAsync<JsonObject>())!;
        Assert.NotEqual(first["version"]!.ToString(), second["version"]!.ToString());
        Assert.Equal(HttpStatusCode.Conflict, (await Send(tutor, second, "accept", new() { ["proposalSequence"] = 1 })).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await Send(tutor, second, "accept", new() { ["proposalSequence"] = null })).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await Send(learner, second, "accept", new() { ["proposalSequence"] = 2 })).StatusCode);
        var detail = (await Detail(tutor, second))!;
        Assert.Equal(new[] { 1, 2 }, detail["proposals"]!.AsArray().Select(p => p!["sequence"]!.GetValue<int>()));
        Assert.Equal(170000, detail["currentTerms"]!["priceVnd"]!.GetValue<int>());
        Assert.Equal(150000, detail["initialTerms"]!["priceVnd"]!.GetValue<int>());
        Assert.Equal("18:00", detail["proposals"]![0]!["terms"]!["schedules"]![0]!["startTime"]!.ToString());
        Assert.Equal("NEGOTIATING", detail["history"]![2]!["fromStatus"]!.ToString());
        Assert.Equal(HttpStatusCode.OK, (await Send(tutor, second, "accept", new() { ["proposalSequence"] = 2 })).StatusCode);
        var final = (await Detail(learner, second))!;
        Assert.Equal(2, final["finalAgreement"]!["proposalSequence"]!.GetValue<int>());
        Assert.Equal("19:00", final["finalAgreement"]!["terms"]!["schedules"]![0]!["startTime"]!.ToString());
        Assert.Equal(new[] { "cancel", "complete" }, final["allowedActions"]!.AsArray().Select(a => a!.GetValue<string>()));
        Assert.Equal(HttpStatusCode.Conflict, (await Send(learner, final, "proposals", new() { ["priceVnd"] = 190000 })).StatusCode);
        await f.WithDbAsync(async db => {
            Assert.Equal(2, await db.Negotiations.CountAsync()); Assert.Equal(2, await db.NegotiationSchedules.CountAsync());
            Assert.Equal(4, await db.RequestStatusHistories.CountAsync()); Assert.Equal(4, await db.Notifications.CountAsync());
            Assert.Equal(1, await db.Conversations.CountAsync());
            Assert.Equal(2, await db.Notifications.CountAsync(n => n.UserId == f.Learner.Id));
            return true;
        });
    }

    [Theory]
    [InlineData("{}")] [InlineData("{\"priceVnd\":0}")] [InlineData("{\"priceVnd\":150000}")]
    [InlineData("{\"schedules\":[]}")] [InlineData("{\"priceVnd\":1.5}")]
    [InlineData("{\"schedules\":[{\"dayOfWeek\":1,\"startTime\":\"18:00\",\"endTime\":\"19:00\"}]}")]
    public async Task InvalidOrUnchangedProposalsDoNotWrite(string json)
    {
        await using var f = await HiringFixture.CreateAsync(postgres); var state = await Create(f);
        using var tutor = await f.CreateClientAsync(f.Tutor);
        Assert.Equal(HttpStatusCode.BadRequest, (await Send(tutor, state, "proposals", JsonNode.Parse(json)!.AsObject())).StatusCode);
        Assert.Equal(0, await f.WithDbAsync(db => db.Negotiations.CountAsync()));
        Assert.Equal(state["version"]!.ToString(), (await Detail(tutor, state))!["version"]!.ToString());
    }

    [Fact]
    public async Task OwnershipRoleAndCsrfPreventWrites()
    {
        await using var f = await HiringFixture.CreateAsync(postgres); var state = await Create(f);
        foreach (var actor in new[] { f.OtherLearner, f.OtherTutor, f.Admin }) {
            using var client = await f.CreateClientAsync(actor);
            var expected = actor == f.Admin ? HttpStatusCode.Forbidden : HttpStatusCode.NotFound;
            Assert.Equal(expected, (await Send(client, state, "proposals", new() { ["priceVnd"] = 170000 })).StatusCode);
            Assert.Equal(expected, (await Send(client, state, "accept", new() { ["proposalSequence"] = 1 })).StatusCode);
        }
        using var tutor = await f.CreateClientAsync(f.Tutor);
        Assert.Equal(HttpStatusCode.BadRequest, (await Send(tutor, state, "proposals", new() { ["priceVnd"] = 170000 }, false)).StatusCode);
        using var anonymous = f.Factory.CreateApiClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await Send(anonymous, state, "proposals", new() { ["priceVnd"] = 170000 }, false)).StatusCode);
        Assert.Equal(0, await f.WithDbAsync(db => db.Negotiations.CountAsync()));
    }

    [Fact]
    public async Task AvailabilityAndFutureDateAreRevalidated()
    {
        await using var f = await HiringFixture.CreateAsync(postgres); var state = await Create(f);
        using var tutor = await f.CreateClientAsync(f.Tutor); using var learner = await f.CreateClientAsync(f.Learner);
        state = await Propose(tutor, state, 170000);
        await f.WithDbAsync(async db => { await db.AvailabilitySlots.Where(s => s.TutorProfileId == f.TutorProfileId).ExecuteUpdateAsync(u => u.SetProperty(s => s.IsActive, false)); return true; });
        Assert.Equal(HttpStatusCode.Conflict, (await Send(learner, state, "accept", new() { ["proposalSequence"] = 1 })).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await Send(learner, state, "proposals", new() { ["priceVnd"] = 160000 })).StatusCode);
        f.Factory.Clock.Advance(TimeSpan.FromDays(60));
        using var renewedLearner = await f.CreateClientAsync(f.Learner);
        Assert.Equal(HttpStatusCode.BadRequest, (await Send(renewedLearner, state, "proposals", new() { ["priceVnd"] = 160000 })).StatusCode);
        Assert.Equal(1, await f.WithDbAsync(db => db.Negotiations.CountAsync()));
    }

    [Fact]
    public async Task NotificationFailureRollsBackProposalAndAcceptance()
    {
        await using var f = await HiringFixture.CreateAsync(postgres); var initial = await Create(f);
        using var tutor = await f.CreateClientAsync(f.Tutor); using var learner = await f.CreateClientAsync(f.Learner);
        await using (await f.FailNotificationWritesAsync())
            Assert.Equal(HttpStatusCode.InternalServerError, (await Send(tutor, initial, "proposals", new() { ["priceVnd"] = 170000 })).StatusCode);
        Assert.Equal(0, await f.WithDbAsync(db => db.Negotiations.CountAsync()));
        Assert.Equal(initial["version"]!.ToString(), (await Detail(tutor, initial))!["version"]!.ToString());
        var state = await Propose(tutor, initial, 170000);
        await using (await f.FailNotificationWritesAsync())
            Assert.Equal(HttpStatusCode.InternalServerError, (await Send(learner, state, "accept", new() { ["proposalSequence"] = 1 })).StatusCode);
        Assert.Equal(state["version"]!.ToString(), (await Detail(tutor, state))!["version"]!.ToString());
        Assert.Equal(HttpStatusCode.OK, (await Send(learner, state, "accept", new() { ["proposalSequence"] = 1 })).StatusCode);
    }

    [Fact]
    public async Task ConcurrentCounterAndAcceptanceHaveOneWinner()
    {
        await using var f = await HiringFixture.CreateAsync(postgres); var initial = await Create(f);
        using var tutor = await f.CreateClientAsync(f.Tutor); using var learner = await f.CreateClientAsync(f.Learner);
        var state = await Propose(tutor, initial, 170000);
        var responses = await Task.WhenAll(Send(tutor, state, "proposals", new() { ["priceVnd"] = 180000 }),
            Send(learner, state, "accept", new() { ["proposalSequence"] = 1 }));
        Assert.Single(responses, r => r.StatusCode == HttpStatusCode.OK);
        Assert.Single(responses, r => r.StatusCode == HttpStatusCode.Conflict);
        Assert.Equal(3, await f.WithDbAsync(db => db.RequestStatusHistories.CountAsync()));
        Assert.Equal(3, await f.WithDbAsync(db => db.Notifications.CountAsync()));
    }
}
