using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using TutorMatching.Api.IntegrationTests.Fixtures;

namespace TutorMatching.Api.IntegrationTests.Hiring;

// Seeded tutor availability: Mon/Wed/Fri 18:00–21:00. An ACCEPTED request's agreed windows are busy.
[Collection("PostgreSQL API")]
public sealed class TutorBusyScheduleTests(PostgreSqlFixture postgres)
{
    [Fact]
    public async Task AcceptedScheduleBlocksOverlappingRequestsAndIsShownOnTheTutorDetail()
    {
        await using var f = await HiringFixture.CreateAsync(postgres);
        var first = await Create(f, f.Learner, "18:00", "19:00");
        using var tutor = await f.CreateClientAsync(f.Tutor);
        Assert.Equal(HttpStatusCode.OK, (await Act(tutor, first, "accept", new() { ["proposalSequence"] = null })).StatusCode);

        using var other = await f.CreateClientAsync(f.OtherLearner);
        using var overlapping = await CreateHireRequestTests.Send(other, Body(f, "18:30", "19:30"), Guid.NewGuid());
        Assert.Equal(HttpStatusCode.Conflict, overlapping.StatusCode);
        Assert.Equal("schedule_busy", (await overlapping.Content.ReadFromJsonAsync<JsonObject>())!["code"]!.GetValue<string>());

        // Touching the end of the booked window is free.
        using var adjacent = await CreateHireRequestTests.Send(other, Body(f, "19:00", "20:00"), Guid.NewGuid());
        Assert.Equal(HttpStatusCode.Created, adjacent.StatusCode);

        using var anonymous = f.Factory.CreateApiClient();
        var detail = (await anonymous.GetFromJsonAsync<JsonObject>($"/api/v1/tutors/{f.TutorProfileId}"))!;
        var busy = Assert.Single(detail["busyWindows"]!.AsArray())!;
        Assert.Equal(1, busy["dayOfWeek"]!.GetValue<int>());
        Assert.Equal("18:00", busy["startTime"]!.GetValue<string>());
        Assert.Equal("19:00", busy["endTime"]!.GetValue<string>());
        // Only day/time is exposed; nothing identifies the learner or the request.
        Assert.Equal(["dayOfWeek", "endTime", "startTime"], busy.AsObject().Select(p => p.Key).Order().ToArray());
    }

    [Fact]
    public async Task SecondPendingRequestForTheSameTimeCannotBeAcceptedUntilTheFirstIsCancelled()
    {
        await using var f = await HiringFixture.CreateAsync(postgres);
        var first = await Create(f, f.Learner, "18:00", "19:00");
        var second = await Create(f, f.OtherLearner, "18:00", "19:00");
        using var tutor = await f.CreateClientAsync(f.Tutor);

        using var acceptedFirst = await Act(tutor, first, "accept", new() { ["proposalSequence"] = null });
        Assert.Equal(HttpStatusCode.OK, acceptedFirst.StatusCode);
        first["version"] = (await acceptedFirst.Content.ReadFromJsonAsync<JsonObject>())!["version"]!.DeepClone();

        using var blocked = await Act(tutor, second, "accept", new() { ["proposalSequence"] = null });
        Assert.Equal(HttpStatusCode.Conflict, blocked.StatusCode);
        Assert.Equal("schedule_busy", (await blocked.Content.ReadFromJsonAsync<JsonObject>())!["code"]!.GetValue<string>());

        // A proposal into the booked window is rejected as well.
        using var learner2 = await f.CreateClientAsync(f.OtherLearner);
        using var proposal = await Act(learner2, second, "proposals", new()
        {
            ["schedules"] = new JsonArray(new JsonObject { ["dayOfWeek"] = 1, ["startTime"] = "18:30", ["endTime"] = "19:30" })
        });
        Assert.Equal(HttpStatusCode.Conflict, proposal.StatusCode);

        using var cancelled = await Act(tutor, first, "cancel", new() { ["confirmed"] = true, ["reason"] = "Đổi lịch" });
        Assert.Equal(HttpStatusCode.OK, cancelled.StatusCode);
        using var accepted = await Act(tutor, second, "accept", new() { ["proposalSequence"] = null });
        Assert.Equal(HttpStatusCode.OK, accepted.StatusCode);
    }

    private static JsonObject Body(HiringFixture f, string start, string end)
    {
        var body = CreateHireRequestTests.Payload(f);
        body["schedules"] = new JsonArray(new JsonObject { ["dayOfWeek"] = 1, ["startTime"] = start, ["endTime"] = end });
        return body;
    }

    private static async Task<JsonObject> Create(HiringFixture f, HiringActor learner, string start, string end)
    {
        using var client = await f.CreateClientAsync(learner);
        using var response = await CreateHireRequestTests.Send(client, Body(f, start, end), Guid.NewGuid());
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonObject>())!;
    }

    private static async Task<HttpResponseMessage> Act(HttpClient client, JsonObject request, string action, JsonObject body)
    {
        body["expectedVersion"] = request["version"]!.DeepClone();
        using var message = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/hire-requests/{request["id"]}/{action}")
        {
            Content = JsonContent.Create(body)
        };
        var token = (await client.GetFromJsonAsync<JsonObject>("/api/v1/auth/csrf"))!;
        message.Headers.Add(token["headerName"]!.GetValue<string>(), token["requestToken"]!.GetValue<string>());
        return await client.SendAsync(message);
    }
}
