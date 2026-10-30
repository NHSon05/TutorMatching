using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using TutorMatching.Api.IntegrationTests.Fixtures;
using TutorMatching.Domain.Hiring;
using TutorMatching.Domain.Messaging;
using TutorMatching.Domain.Tutors;

namespace TutorMatching.Api.IntegrationTests.Hiring;

[Collection("PostgreSQL API")]
public sealed class HireQueryTests(PostgreSqlFixture postgres)
{
    private static readonly string[] Statuses = ["PENDING", "NEGOTIATING", "ACCEPTED", "REJECTED", "CANCELLED", "COMPLETED"];
    private static async Task<Guid[]> Seed(HiringFixture f, int count = 6, bool sameStatus = false, DateTimeOffset? timestamp = null)
    {
        return await f.WithDbAsync(async db => {
            var ids = new List<Guid>();
            var now = timestamp ?? f.Factory.Clock.GetUtcNow();
            for (var i = 0; i < count; i++) {
                var id = Guid.NewGuid(); ids.Add(id);
                var terms = new HireTerms(f.FutureStartDate, 1, 60, "ONLINE", null, null, null, 150000,
                    [new WeeklyWindow(1, new TimeOnly(18, 0), new TimeOnly(19, 0))]);
                var status = sameStatus ? "PENDING" : Statuses[i % Statuses.Length];
                var request = new HireRequest { Id = id, RequesterUserId = f.Learner.Id, TutorProfileId = f.TutorProfileId,
                    SubjectId = f.SubjectId, StartDate = terms.StartDate, SessionsPerWeek = 1, DurationMinutes = 60,
                    ProposedPriceVnd = 150000, ListedPriceVnd = 150000, StatusCode = status, InitialTerms = terms,
                    CreatedAt = now, UpdatedAt = now, NextEventSequence = 3 };
                if (status is "ACCEPTED" or "COMPLETED") request.FinalAgreement = new FinalAgreement(terms, f.Tutor.Id, now, null, null, null);
                request.Schedules.Add(new RequestSchedule { Id = Guid.NewGuid(), HireRequestId = id, DayOfWeek = 1, StartTime = new(18,0), EndTime = new(19,0) });
                db.HireRequests.Add(request);
                db.Conversations.Add(new Conversation { Id = Guid.NewGuid(), HireRequestId = id, CreatedAt = now });
                // Deliberately reverse insertion order and tie times; sequence must determine read order.
                db.RequestStatusHistories.Add(new RequestStatusHistory { Id = Guid.NewGuid(), HireRequestId = id,
                    Sequence = 2, ActorUserId = f.Tutor.Id, FromStatusCode = "PENDING", ToStatusCode = status, CreatedAt = now });
                db.RequestStatusHistories.Add(new RequestStatusHistory { Id = Guid.NewGuid(), HireRequestId = id,
                    Sequence = 1, ActorUserId = f.Learner.Id, FromStatusCode = null, ToStatusCode = "PENDING", CreatedAt = now });
            }
            await db.SaveChangesAsync(); return ids.ToArray();
        });
    }
    private static async Task<JsonObject> Page(HttpClient client, string query = "") =>
        (await client.GetFromJsonAsync<JsonObject>("/api/v1/hire-requests" + query))!;
    private static Guid[] Ids(JsonObject page) => page["items"]!.AsArray().Select(x => Guid.Parse(x!["id"]!.ToString())).ToArray();
    private static string Cursor(JsonObject page) => Uri.EscapeDataString(page["nextCursor"]!.GetValue<string>());

    [Fact]
    public async Task TiedTimestampsUseUuidTieBreakerAndNewerInsertDoesNotShiftPages()
    {
        await using var f = await HiringFixture.CreateAsync(postgres);
        var ids = await Seed(f, 5, true);
        using var client = await f.CreateClientAsync(f.Learner);
        var first = await Page(client, "?pageSize=2");
        var added = await Seed(f, 1, true, f.Factory.Clock.GetUtcNow().AddSeconds(1));
        var second = await Page(client, "?pageSize=2&cursor=" + Cursor(first));
        var third = await Page(client, "?pageSize=2&cursor=" + Cursor(second));
        var read = Ids(first).Concat(Ids(second)).Concat(Ids(third)).ToArray();
        Assert.Equal(ids.OrderDescending(), read);
        Assert.DoesNotContain(added[0], read); Assert.Null(third["nextCursor"]);
        Assert.Equal(added[0], Ids(await Page(client, "?pageSize=1"))[0]);
    }

    [Fact]
    public async Task FilterMembershipUsesCurrentStateWithoutDuplicatingSeenRows()
    {
        await using var f = await HiringFixture.CreateAsync(postgres); var ids = await Seed(f, 4, true);
        using var client = await f.CreateClientAsync(f.Tutor);
        var first = await Page(client, "?status=PENDING&pageSize=1");
        var removed = ids.OrderDescending().Skip(1).First();
        await f.WithDbAsync(async db => { var r = await db.HireRequests.SingleAsync(r => r.Id == removed); r.StatusCode = "REJECTED"; await db.SaveChangesAsync(); return true; });
        var next = await Page(client, "?status=PENDING&pageSize=100&cursor=" + Cursor(first));
        Assert.DoesNotContain(removed, Ids(next)); Assert.DoesNotContain(Ids(first)[0], Ids(next));
        Assert.Equal(2, Ids(next).Length);
        Assert.Equal(new[] { removed }, Ids(await Page(client, "?status=REJECTED")));
    }

    [Theory]
    [InlineData("?cursor=not-base64")]
    [InlineData("?cursor=e30=")]
    [InlineData("?cursor=bnVsbA==")]
    [InlineData("?status=UNKNOWN")]
    [InlineData("?pageSize=0")]
    [InlineData("?pageSize=101")]
    [InlineData("?pageSize=abc")]
    public async Task InvalidPaginationReturnsFieldValidation(string query)
    {
        await using var f = await HiringFixture.CreateAsync(postgres);
        using var client = await f.CreateClientAsync(f.Learner);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.GetAsync("/api/v1/hire-requests" + query)).StatusCode);
    }

    [Fact]
    public async Task DefaultAndMaximumPageSizeAndFilterBoundCursor()
    {
        await using var f = await HiringFixture.CreateAsync(postgres); await Seed(f, 21, true);
        using var client = await f.CreateClientAsync(f.Learner);
        var page = await Page(client); Assert.Equal(20, Ids(page).Length);
        Assert.Single(Ids(await Page(client, "?cursor=" + Cursor(page))));
        Assert.Equal(21, Ids(await Page(client, "?pageSize=100")).Length);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.GetAsync("/api/v1/hire-requests?status=PENDING&cursor=" + Cursor(page))).StatusCode);
        var filtered = await Page(client, "?status=PENDING&pageSize=1");
        Assert.Equal(HttpStatusCode.BadRequest, (await client.GetAsync("/api/v1/hire-requests?cursor=" + Cursor(filtered))).StatusCode);
    }

    [Fact]
    public async Task BothRolesSeeAllSixStatesInOrderAndOutsidersCannotUseAnOwnersCursor()
    {
        await using var f = await HiringFixture.CreateAsync(postgres); var ids = await Seed(f);
        using var learner = await f.CreateClientAsync(f.Learner); using var tutor = await f.CreateClientAsync(f.Tutor);
        foreach (var client in new[] { learner, tutor }) {
            Assert.Equal(ids.OrderDescending(), Ids(await Page(client)));
            foreach (var status in Statuses) {
                var page = await Page(client, "?status=" + status); Assert.Single(Ids(page));
                var detail = (await client.GetFromJsonAsync<JsonObject>($"/api/v1/hire-requests/{Ids(page)[0]}"))!;
                Assert.Equal(status, detail["status"]!.ToString());
                Assert.Equal(new[] { 1, 2 }, detail["history"]!.AsArray().Select(e => e!["sequence"]!.GetValue<int>()));
                foreach (var forbidden in new[] { "email", "phoneNumber", "password", "securityStamp", "dateOfBirth", "refreshToken" }) {
                    Assert.DoesNotContain(forbidden, detail.ToJsonString(), StringComparison.OrdinalIgnoreCase);
                    Assert.DoesNotContain(forbidden, page.ToJsonString(), StringComparison.OrdinalIgnoreCase);
                }
            }
        }
        var cursor = Cursor(await Page(learner, "?pageSize=1"));
        foreach (var actor in new[] { f.OtherLearner, f.OtherTutor }) {
            using var unrelated = await f.CreateClientAsync(actor);
            Assert.Empty(Ids(await Page(unrelated, "?cursor=" + cursor)));
            Assert.Equal(HttpStatusCode.NotFound, (await unrelated.GetAsync($"/api/v1/hire-requests/{ids[0]}")).StatusCode);
        }
    }
}
