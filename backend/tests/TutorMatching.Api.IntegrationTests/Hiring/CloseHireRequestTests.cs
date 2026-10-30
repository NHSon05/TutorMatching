using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using TutorMatching.Api.IntegrationTests.Fixtures;
using TutorMatching.Domain.Tutors;

namespace TutorMatching.Api.IntegrationTests.Hiring;

[Collection("PostgreSQL API")]
public sealed class CloseHireRequestTests(PostgreSqlFixture postgres)
{
    private static async Task<JsonObject> Create(HiringFixture f, string status = "ACCEPTED")
    {
        using var learner = await f.CreateClientAsync(f.Learner);
        var payload = CreateHireRequestTests.Payload(f);
        if (status == "NEGOTIATING") payload["priceVnd"] = 120000;
        using var created = await CreateHireRequestTests.Send(learner, payload, Guid.NewGuid());
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var request = (await created.Content.ReadFromJsonAsync<JsonObject>())!;
        if (status is "PENDING" or "NEGOTIATING") return request;
        using var tutor = await f.CreateClientAsync(f.Tutor);
        using var accepted = await Send(tutor, request, "accept", new() { ["proposalSequence"] = null });
        Assert.Equal(HttpStatusCode.OK, accepted.StatusCode);
        request = (await accepted.Content.ReadFromJsonAsync<JsonObject>())!;
        if (status != "ACCEPTED")
        {
            // Terminal fixtures exercise invalid actions independently of their creation path.
            await f.WithDbAsync(async db => {
                var entity = await db.HireRequests.SingleAsync(r => r.Id == Guid.Parse(request["id"]!.GetValue<string>()));
                entity.StatusCode = status;
                await db.SaveChangesAsync();
                request["version"] = entity.Version.ToString();
                return true;
            });
        }
        return request;
    }

    private static async Task<HttpResponseMessage> Send(HttpClient client, JsonObject request, string action,
        JsonObject? fields = null, bool csrf = true)
    {
        var body = fields?.DeepClone().AsObject() ?? new JsonObject { ["confirmed"] = true, ["reason"] = "  Kết thúc theo thỏa thuận  " };
        body["expectedVersion"] = request["version"]!.GetValue<string>();
        using var message = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/hire-requests/{request["id"]}/{action}") { Content = JsonContent.Create(body) };
        if (csrf)
        {
            var token = await client.GetFromJsonAsync<JsonObject>("/api/v1/auth/csrf");
            message.Headers.Add(token!["headerName"]!.GetValue<string>(), token["requestToken"]!.GetValue<string>());
        }
        return await client.SendAsync(message);
    }

    public static IEnumerable<object[]> Matrix() =>
        from status in new[] { "PENDING", "NEGOTIATING", "ACCEPTED", "REJECTED", "CANCELLED", "COMPLETED" }
        from tutor in new[] { false, true }
        from action in new[] { "cancel", "complete" }
        select new object[] { status, tutor, action };

    [Theory, MemberData(nameof(Matrix))]
    public async Task ParticipantStateActionMatrixIsAtomic(string status, bool asTutor, string action)
    {
        await using var f = await HiringFixture.CreateAsync(postgres);
        var request = await Create(f, status);
        var actor = asTutor ? f.Tutor : f.Learner;
        using var client = await f.CreateClientAsync(actor);
        var allowed = action == "complete" ? status == "ACCEPTED" : status == "ACCEPTED" || !asTutor && status is "PENDING" or "NEGOTIATING";
        var before = await client.GetFromJsonAsync<JsonObject>($"/api/v1/hire-requests/{request["id"]}");
        Assert.Equal(allowed, before!["allowedActions"]!.AsArray().Any(a => a!.GetValue<string>() == action));
        var count = await f.WithDbAsync(db => db.Notifications.CountAsync());
        using var response = await Send(client, request, action);
        Assert.Equal(allowed ? HttpStatusCode.OK : HttpStatusCode.Conflict, response.StatusCode);
        await f.WithDbAsync(async db => {
            var entity = await db.HireRequests.SingleAsync();
            Assert.Equal(allowed ? action == "cancel" ? "CANCELLED" : "COMPLETED" : status, entity.StatusCode);
            Assert.Equal(count + (allowed ? 1 : 0), await db.Notifications.CountAsync());
            Assert.Equal(count + (allowed ? 1 : 0), await db.RequestStatusHistories.CountAsync());
            if (allowed)
            {
                var history = await db.RequestStatusHistories.OrderByDescending(e => e.Sequence).FirstAsync();
                Assert.Equal(actor.Id, history.ActorUserId);
                Assert.Equal("Kết thúc theo thỏa thuận", history.Reason);
                Assert.Equal(f.Factory.Clock.GetUtcNow(), history.CreatedAt);
                var notification = await db.Notifications.SingleAsync(n => n.TypeCode == (action == "cancel" ? "HIRE_REQUEST_CANCELLED" : "HIRE_REQUEST_COMPLETED"));
                Assert.Equal(asTutor ? f.Learner.Id : f.Tutor.Id, notification.UserId);
                Assert.Equal(action == "complete" ? f.Factory.Clock.GetUtcNow() : (DateTimeOffset?)null, entity.CompletedAt);
                Assert.NotEqual(request["version"]!.GetValue<string>(), entity.Version.ToString());
            }
            return true;
        });
        var after = await client.GetFromJsonAsync<JsonObject>($"/api/v1/hire-requests/{request["id"]}");
        Assert.True(JsonNode.DeepEquals(before["initialTerms"], after!["initialTerms"]));
        Assert.True(JsonNode.DeepEquals(before["finalAgreement"], after["finalAgreement"]));
        if (allowed) Assert.Empty(after["allowedActions"]!.AsArray());
    }

    [Theory]
    [InlineData("cancel")] [InlineData("complete")]
    public async Task ValidationAndSecurityDenialsNeverWrite(string action)
    {
        await using var f = await HiringFixture.CreateAsync(postgres);
        var request = await Create(f);
        using var learner = await f.CreateClientAsync(f.Learner);
        var invalid = new List<JsonObject> {
            new() { ["reason"] = "Reason" }, new() { ["confirmed"] = false, ["reason"] = "Reason" },
            new() { ["confirmed"] = true, ["reason"] = "" }, new() { ["confirmed"] = true, ["reason"] = "   " },
            new() { ["confirmed"] = true, ["reason"] = new string('x', 1001) },
            new() { ["confirmed"] = true, ["reason"] = null }, new() { ["confirmed"] = true, ["extra"] = true }
        };
        if (action == "cancel") invalid.Add(new() { ["confirmed"] = true });
        foreach (var fields in invalid)
        {
            using var response = await Send(learner, request, action, fields);
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }
        using var missingCsrf = await Send(learner, request, action, csrf: false);
        Assert.Equal(HttpStatusCode.BadRequest, missingCsrf.StatusCode);
        foreach (var actor in new[] { f.OtherLearner, f.OtherTutor, f.Admin })
        {
            using var client = await f.CreateClientAsync(actor);
            using var response = await Send(client, request, action);
            Assert.Equal(actor == f.Admin ? HttpStatusCode.Forbidden : HttpStatusCode.NotFound, response.StatusCode);
        }
        using var anonymous = f.Factory.CreateApiClient();
        using var unauthenticated = await Send(anonymous, request, action, csrf: false);
        Assert.Equal(HttpStatusCode.Unauthorized, unauthenticated.StatusCode);
        Assert.Equal(2, await f.WithDbAsync(db => db.Notifications.CountAsync()));
        Assert.Equal(2, await f.WithDbAsync(db => db.RequestStatusHistories.CountAsync()));
        Assert.Equal("ACCEPTED", await f.WithDbAsync(db => db.HireRequests.Select(r => r.StatusCode).SingleAsync()));
    }

    [Theory]
    [InlineData("cancel")] [InlineData("complete")]
    public async Task NotificationFailureRollsBackAndLostResponseRetryCannotDuplicate(string action)
    {
        await using var f = await HiringFixture.CreateAsync(postgres);
        var request = await Create(f);
        using var client = await f.CreateClientAsync(f.Learner);
        await using (await f.FailNotificationWritesAsync())
        {
            using var failed = await Send(client, request, action);
            Assert.Equal(HttpStatusCode.InternalServerError, failed.StatusCode);
        }
        await f.WithDbAsync(async db => {
            var entity = await db.HireRequests.SingleAsync();
            Assert.Equal("ACCEPTED", entity.StatusCode);
            Assert.Equal(request["version"]!.GetValue<string>(), entity.Version.ToString());
            Assert.Null(entity.CompletedAt); Assert.Null(entity.CancelReason);
            Assert.NotNull(entity.FinalAgreement);
            Assert.Equal(2, await db.RequestStatusHistories.CountAsync());
            Assert.Equal(2, await db.Notifications.CountAsync());
            return true;
        });
        using var success = await Send(client, request, action);
        Assert.Equal(HttpStatusCode.OK, success.StatusCode);
        using var retry = await Send(client, request, action);
        Assert.Equal(HttpStatusCode.Conflict, retry.StatusCode);
        Assert.Equal("version_conflict", (await retry.Content.ReadFromJsonAsync<JsonObject>())!["code"]!.GetValue<string>());
        var refreshed = (await client.GetFromJsonAsync<JsonObject>($"/api/v1/hire-requests/{request["id"]}"))!;
        using var repeated = await Send(client, refreshed, action);
        Assert.Equal(HttpStatusCode.Conflict, repeated.StatusCode);
        Assert.Equal(3, await f.WithDbAsync(db => db.Notifications.CountAsync()));
        Assert.Equal(3, await f.WithDbAsync(db => db.RequestStatusHistories.CountAsync()));
    }

    [Theory]
    [InlineData("cancel", "PENDING", false)]
    [InlineData("cancel", "NEGOTIATING", false)]
    [InlineData("cancel", "ACCEPTED", true)]
    [InlineData("complete", "ACCEPTED", false)]
    public async Task ReasonOmissionAndMaximumLengthFollowContract(string action, string status, bool includeReason)
    {
        await using var f = await HiringFixture.CreateAsync(postgres);
        var request = await Create(f, status);
        using var client = await f.CreateClientAsync(f.Learner);
        var fields = new JsonObject { ["confirmed"] = true };
        if (includeReason) fields["reason"] = new string('x', 1000);
        using var response = await Send(client, request, action, fields);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var reason = await f.WithDbAsync(db => db.RequestStatusHistories.OrderByDescending(e => e.Sequence).Select(e => e.Reason).FirstAsync());
        Assert.Equal(includeReason ? new string('x', 1000) : null, reason);
    }

    [Fact]
    public async Task CompetingCancelAndCompleteHaveExactlyOneWinner()
    {
        await using var f = await HiringFixture.CreateAsync(postgres);
        var request = await Create(f);
        using var learner = await f.CreateClientAsync(f.Learner);
        using var tutor = await f.CreateClientAsync(f.Tutor);
        var responses = await Task.WhenAll(Send(learner, request, "cancel"), Send(tutor, request, "complete"));
        Assert.Single(responses, r => r.StatusCode == HttpStatusCode.OK);
        Assert.Single(responses, r => r.StatusCode == HttpStatusCode.Conflict);
        foreach (var response in responses) response.Dispose();
        Assert.Equal(3, await f.WithDbAsync(db => db.Notifications.CountAsync()));
        Assert.Equal(3, await f.WithDbAsync(db => db.RequestStatusHistories.CountAsync()));
    }

    [Theory]
    [InlineData(false)] [InlineData(true)]
    public async Task ExpiredOpenRequestsCanBeCancelledOrRejectedDespiteHiddenOffering(bool reject)
    {
        await using var f = await HiringFixture.CreateAsync(postgres);
        var request = await Create(f, "NEGOTIATING");
        f.Factory.Clock.Advance(TimeSpan.FromDays(10));
        await f.WithDbAsync(async db => {
            (await db.TutorProfiles.SingleAsync(p => p.Id == f.TutorProfileId)).Status = TutorProfileStatus.DRAFT;
            foreach (var slot in await db.AvailabilitySlots.ToListAsync()) slot.IsActive = false;
            await db.SaveChangesAsync(); return true;
        });
        using var client = await f.CreateClientAsync(reject ? f.Tutor : f.Learner);
        using var response = await Send(client, request, reject ? "reject" : "cancel",
            reject ? new() { ["reason"] = "Expired" } : new() { ["confirmed"] = true });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(2, await f.WithDbAsync(db => db.RequestStatusHistories.CountAsync()));
    }
}
