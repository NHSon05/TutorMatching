using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using TutorMatching.Api.IntegrationTests.Fixtures;
using TutorMatching.Domain.Tutors;

namespace TutorMatching.Api.IntegrationTests.Hiring;

[Collection("PostgreSQL API")]
public sealed class TutorResponseTests(PostgreSqlFixture postgres)
{
    private static async Task<JsonObject> Create(HiringFixture f, bool alternate = false)
    {
        f.Factory.Clock.Advance(TimeSpan.FromSeconds(1));
        using var learner = await f.CreateClientAsync(f.Learner);
        var payload = CreateHireRequestTests.Payload(f);
        if (alternate) payload["priceVnd"] = 120000;
        using var response = await CreateHireRequestTests.Send(learner, payload, Guid.NewGuid());
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonObject>())!;
    }

    private static async Task<HttpResponseMessage> Respond(HttpClient client, JsonObject created, bool accept = true,
        string reason = "Không phù hợp lịch dạy", bool csrf = true)
    {
        var body = new JsonObject { ["expectedVersion"] = created["version"]!.GetValue<string>() };
        if (accept) body["proposalSequence"] = null; else body["reason"] = reason;
        using var message = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/hire-requests/{created["id"]}/{(accept ? "accept" : "reject")}") { Content = JsonContent.Create(body) };
        if (csrf)
        {
            var token = await client.GetFromJsonAsync<JsonObject>("/api/v1/auth/csrf");
            message.Headers.Add(token!["headerName"]!.GetValue<string>(), token["requestToken"]!.GetValue<string>());
        }
        return await client.SendAsync(message);
    }

    [Theory]
    [InlineData(false)] [InlineData(true)]
    public async Task AcceptFreezesInitialTermsAndReturnsCommittedVersion(bool alternate)
    {
        await using var f = await HiringFixture.CreateAsync(postgres);
        var created = await Create(f, alternate);
        using var tutor = await f.CreateClientAsync(f.Tutor);
        using var response = await Respond(tutor, created);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = (await response.Content.ReadFromJsonAsync<JsonObject>())!;
        Assert.Equal("ACCEPTED", result["status"]!.GetValue<string>());
        Assert.NotEqual(created["version"]!.GetValue<string>(), result["version"]!.GetValue<string>());
        await f.WithDbAsync(async db =>
        {
            var request = await db.HireRequests.SingleAsync();
            Assert.Equal(request.Version.ToString(), result["version"]!.GetValue<string>());
            Assert.Equal(alternate ? 120000 : 150000, request.FinalAgreement!.Terms.PriceVnd);
            Assert.Equal(f.Tutor.Id, request.FinalAgreement.AcceptedBy);
            Assert.Equal(2, await db.RequestStatusHistories.CountAsync());
            Assert.Equal(2, await db.Notifications.CountAsync());
            Assert.Single(await db.Conversations.ToListAsync());
            Assert.Single(await db.HireCreateOperations.ToListAsync());
            var notification = await db.Notifications.SingleAsync(n => n.TypeCode == "HIRE_REQUEST_ACCEPTED");
            Assert.Equal(f.Learner.Id, notification.UserId);
            (await db.TutorProfiles.SingleAsync(p => p.Id == f.TutorProfileId)).SessionRateVnd = 999999;
            await db.SaveChangesAsync();
            return true;
        });
        var detail = (await tutor.GetFromJsonAsync<JsonObject>($"/api/v1/hire-requests/{created["id"]}"))!;
        Assert.Equal(alternate ? 120000 : 150000, detail["finalAgreement"]!["terms"]!["priceVnd"]!.GetValue<int>());
        Assert.Empty(detail["allowedActions"]!.AsArray());
        Assert.Empty(detail["proposals"]!.AsArray());
        Assert.Equal(new[] { 1, 2 }, detail["history"]!.AsArray().Select(e => e!["sequence"]!.GetValue<int>()));
        Assert.Equal(HttpStatusCode.Conflict, (await Respond(tutor, created)).StatusCode);
    }

    [Fact]
    public async Task RejectionWorksAfterOfferingHiddenAndRecordsReason()
    {
        await using var f = await HiringFixture.CreateAsync(postgres);
        var created = await Create(f);
        await f.WithDbAsync(async db => { (await db.TutorProfiles.SingleAsync(p => p.Id == f.TutorProfileId)).Status = TutorProfileStatus.DRAFT; await db.SaveChangesAsync(); return true; });
        using var tutor = await f.CreateClientAsync(f.Tutor);
        var detail = (await tutor.GetFromJsonAsync<JsonObject>($"/api/v1/hire-requests/{created["id"]}"))!;
        Assert.Equal(new[] { "reject" }, detail["allowedActions"]!.AsArray().Select(x => x!.GetValue<string>()));
        Assert.Equal(HttpStatusCode.OK, (await Respond(tutor, created, false, "  Không phù hợp  ")).StatusCode);
        await f.WithDbAsync(async db =>
        {
            Assert.Equal("REJECTED", (await db.HireRequests.SingleAsync()).StatusCode);
            var history = await db.RequestStatusHistories.SingleAsync(e => e.Sequence == 2);
            Assert.Equal("Không phù hợp", history.Reason);
            Assert.Equal(f.Tutor.Id, history.ActorUserId);
            Assert.Equal(2, await db.Notifications.CountAsync());
            return true;
        });
    }

    [Fact]
    public async Task OwnershipRolesAndCsrfNeverLeakOrWrite()
    {
        await using var f = await HiringFixture.CreateAsync(postgres);
        var created = await Create(f);
        foreach (var actor in new[] { f.Learner, f.Tutor, f.OtherLearner, f.OtherTutor, f.Admin })
        {
            using var client = await f.CreateClientAsync(actor);
            var owned = actor == f.Learner || actor == f.Tutor;
            var expectedRead = actor == f.Admin ? HttpStatusCode.Forbidden : owned ? HttpStatusCode.OK : HttpStatusCode.NotFound;
            Assert.Equal(expectedRead, (await client.GetAsync($"/api/v1/hire-requests/{created["id"]}")).StatusCode);
            if (actor != f.Admin)
            {
                var page = (await client.GetFromJsonAsync<JsonObject>("/api/v1/hire-requests"))!;
                Assert.Equal(owned ? 1 : 0, page["items"]!.AsArray().Count);
                var json = page.ToJsonString();
                Assert.DoesNotContain("email", json, StringComparison.OrdinalIgnoreCase);
                Assert.DoesNotContain("password", json, StringComparison.OrdinalIgnoreCase);
            }
            if (actor != f.Tutor)
            {
                foreach (var accept in new[] { true, false })
                    Assert.Equal(actor == f.OtherTutor ? HttpStatusCode.NotFound : HttpStatusCode.Forbidden, (await Respond(client, created, accept)).StatusCode);
            }
        }
        using var anonymous = f.Factory.CreateApiClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync($"/api/v1/hire-requests/{created["id"]}")).StatusCode);
        using var tutor = await f.CreateClientAsync(f.Tutor);
        Assert.Equal(HttpStatusCode.BadRequest, (await Respond(tutor, created, csrf: false)).StatusCode);
        Assert.Equal(1, await f.WithDbAsync(db => db.RequestStatusHistories.CountAsync()));
        Assert.Equal(1, await f.WithDbAsync(db => db.Notifications.CountAsync()));
    }

    [Theory]
    [InlineData("")] [InlineData("   ")] [InlineData("overlong")]
    public async Task InvalidReasonNeverWrites(string reason)
    {
        await using var f = await HiringFixture.CreateAsync(postgres);
        var created = await Create(f);
        using var tutor = await f.CreateClientAsync(f.Tutor);
        Assert.Equal(HttpStatusCode.BadRequest, (await Respond(tutor, created, false, reason == "overlong" ? new string('x', 1001) : reason)).StatusCode);
        Assert.Equal(1, await f.WithDbAsync(db => db.RequestStatusHistories.CountAsync()));
    }

    [Fact]
    public async Task NotificationFailureRollsBackAndRetrySucceeds()
    {
        await using var f = await HiringFixture.CreateAsync(postgres);
        var created = await Create(f);
        using var tutor = await f.CreateClientAsync(f.Tutor);
        await using (await f.FailNotificationWritesAsync())
            Assert.Equal(HttpStatusCode.InternalServerError, (await Respond(tutor, created)).StatusCode);
        await f.WithDbAsync(async db =>
        {
            var request = await db.HireRequests.SingleAsync();
            Assert.Equal("PENDING", request.StatusCode);
            Assert.Equal(created["version"]!.GetValue<string>(), request.Version.ToString());
            Assert.Null(request.FinalAgreement);
            Assert.Equal(1, await db.Notifications.CountAsync());
            Assert.Equal(1, await db.RequestStatusHistories.CountAsync());
            return true;
        });
        Assert.Equal(HttpStatusCode.OK, (await Respond(tutor, created)).StatusCode);
    }

    [Fact]
    public async Task CompetingResponsesHaveExactlyOneWinner()
    {
        await using var f = await HiringFixture.CreateAsync(postgres);
        var created = await Create(f);
        using var first = await f.CreateClientAsync(f.Tutor);
        using var second = await f.CreateClientAsync(f.Tutor);
        var results = await Task.WhenAll(Respond(first, created), Respond(second, created, false));
        Assert.Single(results, r => r.StatusCode == HttpStatusCode.OK);
        Assert.Single(results, r => r.StatusCode == HttpStatusCode.Conflict);
        Assert.Equal(2, await f.WithDbAsync(db => db.RequestStatusHistories.CountAsync()));
        Assert.Equal(2, await f.WithDbAsync(db => db.Notifications.CountAsync()));
    }

    [Fact]
    public async Task PaginationIsBoundedScopedAndStableAcrossInserts()
    {
        await using var f = await HiringFixture.CreateAsync(postgres);
        await Create(f); await Create(f); await Create(f);
        using var tutor = await f.CreateClientAsync(f.Tutor);
        var first = (await tutor.GetFromJsonAsync<JsonObject>("/api/v1/hire-requests?pageSize=2&status=PENDING"))!;
        Assert.Equal(2, first["items"]!.AsArray().Count);
        var cursor = Uri.EscapeDataString(first["nextCursor"]!.GetValue<string>());
        await Create(f);
        var second = (await tutor.GetFromJsonAsync<JsonObject>($"/api/v1/hire-requests?pageSize=2&status=PENDING&cursor={cursor}"))!;
        Assert.Single(second["items"]!.AsArray());
        Assert.Null(second["nextCursor"]);
        Assert.DoesNotContain(second["items"]![0]!["id"]!.GetValue<string>(), first["items"]!.AsArray().Select(x => x!["id"]!.GetValue<string>()));
        foreach (var query in new[] { "pageSize=0", "pageSize=101", "status=invalid", "cursor=invalid", $"status=ACCEPTED&cursor={cursor}" })
            Assert.Equal(HttpStatusCode.BadRequest, (await tutor.GetAsync($"/api/v1/hire-requests?{query}")).StatusCode);
    }

    [Theory]
    [InlineData("UpperTime")]
    [InlineData("LastTime")]
    public async Task CursorWithNonUtcTimestampReturnsValidationError(string field)
    {
        await using var f = await HiringFixture.CreateAsync(postgres);
        await Create(f); await Create(f);
        using var tutor = await f.CreateClientAsync(f.Tutor);
        var page = (await tutor.GetFromJsonAsync<JsonObject>("/api/v1/hire-requests?pageSize=1"))!;
        var cursor = JsonNode.Parse(Convert.FromBase64String(page["nextCursor"]!.GetValue<string>()))!.AsObject();
        cursor[field] = DateTimeOffset.Parse(cursor[field]!.GetValue<string>()).ToOffset(TimeSpan.FromHours(7)).ToString("O");
        var encoded = Uri.EscapeDataString(Convert.ToBase64String(System.Text.Json.JsonSerializer.SerializeToUtf8Bytes(cursor)));
        using var response = await tutor.GetAsync($"/api/v1/hire-requests?cursor={encoded}");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var error = (await response.Content.ReadFromJsonAsync<JsonObject>())!;
        Assert.NotNull(error["errors"]!["cursor"]);
    }

    [Fact]
    public async Task ChangedAvailabilityBlocksAcceptButNotReject()
    {
        await using var f = await HiringFixture.CreateAsync(postgres);
        var created = await Create(f);
        await f.WithDbAsync(async db => { foreach (var slot in await db.AvailabilitySlots.Where(s => s.TutorProfileId == f.TutorProfileId).ToListAsync()) slot.IsActive = false; await db.SaveChangesAsync(); return true; });
        using var tutor = await f.CreateClientAsync(f.Tutor);
        Assert.Equal(HttpStatusCode.Conflict, (await Respond(tutor, created)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await Respond(tutor, created, false)).StatusCode);
    }
}
