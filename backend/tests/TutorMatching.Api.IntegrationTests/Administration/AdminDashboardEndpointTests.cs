using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using TutorMatching.Api.IntegrationTests.Fixtures;

namespace TutorMatching.Api.IntegrationTests.Administration;

[Collection("PostgreSQL API")]
public sealed class AdminDashboardEndpointTests(PostgreSqlFixture postgres)
{
    [Fact]
    public async Task SnapshotMatchesSourceRecordsWithCanonicalZeroKeysAndRealSubjectDemand()
    {
        await using var fixture = await AdminFixture.CreateAsync(postgres);
        using var admin = await fixture.CreateClientAsync(fixture.Admin);
        using var response = await admin.GetAsync("/api/v1/admin/dashboard");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(response.Headers.CacheControl?.NoStore);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();

        var (roles, profiles, requests, subjects) = await fixture.WithDbAsync(async db => (
            await db.Users.Where(u => u.DeletedAt == null).GroupBy(u => u.Role.ToString())
                .Select(g => new { g.Key, C = g.Count() }).ToDictionaryAsync(x => x.Key, x => x.C),
            await db.TutorProfiles.GroupBy(p => p.Status.ToString())
                .Select(g => new { g.Key, C = g.Count() }).ToDictionaryAsync(x => x.Key, x => x.C),
            await db.HireRequests.GroupBy(r => r.StatusCode)
                .Select(g => new { g.Key, C = g.Count() }).ToDictionaryAsync(x => x.Key, x => x.C),
            await db.HireRequests.GroupBy(r => r.SubjectId)
                .Select(g => new { g.Key, C = g.Count() }).ToDictionaryAsync(x => x.Key, x => x.C)));

        AssertGroup(body.GetProperty("usersByRole"), ["LEARNER", "TUTOR", "ADMIN"], roles);
        AssertGroup(body.GetProperty("tutorProfilesByStatus"), ["DRAFT", "PENDING_REVIEW", "APPROVED", "REJECTED"], profiles);
        AssertGroup(body.GetProperty("hireRequestsByStatus"),
            ["PENDING", "NEGOTIATING", "ACCEPTED", "REJECTED", "CANCELLED", "COMPLETED"], requests);
        Assert.Equal(0, body.GetProperty("tutorProfilesByStatus").GetProperty("REJECTED").GetInt32());
        Assert.Equal(2, body.GetProperty("usersByRole").GetProperty("ADMIN").GetInt32());

        var top = body.GetProperty("topSubjects").EnumerateArray().ToList();
        Assert.NotEmpty(top);
        Assert.True(top.Count <= 5);
        foreach (var subject in top)
            Assert.Equal(subjects[subject.GetProperty("subjectId").GetGuid()], subject.GetProperty("requestCount").GetInt32());
        Assert.Equal(fixture.SubjectId, top[0].GetProperty("subjectId").GetGuid());
        Assert.Equal(top.Select(t => t.GetProperty("requestCount").GetInt32()).OrderDescending(),
            top.Select(t => t.GetProperty("requestCount").GetInt32()));
        Assert.NotEqual(default, body.GetProperty("asOf").GetDateTimeOffset());
    }

    [Fact]
    public async Task NonAdminsAreDenied()
    {
        await using var fixture = await AdminFixture.CreateAsync(postgres);
        foreach (var actor in new[] { fixture.Messaging.Learner, fixture.Messaging.Tutor })
        {
            using var client = await fixture.CreateClientAsync(actor);
            using var response = await client.GetAsync("/api/v1/admin/dashboard");
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }
        using var anonymous = fixture.Factory.CreateApiClient();
        using var denied = await anonymous.GetAsync("/api/v1/admin/dashboard");
        Assert.Equal(HttpStatusCode.Unauthorized, denied.StatusCode);
    }

    [Fact]
    public async Task RuntimeDashboardMatchesThePublishedContract()
    {
        await using var factory = await postgres.CreateFactoryAsync();
        using var client = factory.CreateApiClient();
        var actual = JsonNode.Parse(await client.GetStringAsync("/openapi/v1.json"))!;
        var planned = JsonNode.Parse(await File.ReadAllTextAsync(Path.Combine(AppContext.BaseDirectory, "Contracts", "messaging-admin.json")))!;
        var contract = planned["paths"]!["/admin/dashboard"]!["get"]!;
        var generated = actual["paths"]!["/api/v1/admin/dashboard"]!["get"]!;
        Assert.Equal(contract["operationId"]!.GetValue<string>(), generated["operationId"]!.GetValue<string>());
        foreach (var status in contract["responses"]!.AsObject().Select(r => r.Key).Where(s => s != "200"))
            Assert.NotNull(generated["responses"]![status]!["content"]!["application/problem+json"]);
        var produced = Resolve(actual, generated["responses"]!["200"]!["content"]!["application/json"]!["schema"]!);
        Assert.Equal(Names(planned, planned["components"]!["schemas"]!["DashboardSnapshot"]!), Names(actual, produced));
        Assert.Equal(Names(planned, planned["components"]!["schemas"]!["SubjectDemand"]!),
            Names(actual, produced["properties"]!["topSubjects"]!["items"]!));
    }

    private static void AssertGroup(JsonElement group, string[] keys, Dictionary<string, int> source)
    {
        Assert.Equal(keys.Order(), group.EnumerateObject().Select(p => p.Name).Order());
        foreach (var key in keys) Assert.Equal(source.GetValueOrDefault(key), group.GetProperty(key).GetInt32());
    }

    private static string[] Names(JsonNode document, JsonNode schema) =>
        Resolve(document, schema)["properties"]!.AsObject().Select(x => x.Key).Order().ToArray();

    private static JsonNode Resolve(JsonNode document, JsonNode node)
    {
        while (node["$ref"] is { } reference)
            node = reference.GetValue<string>()[2..].Split('/').Aggregate(document, (current, part) => current[part]!);
        return node;
    }
}
