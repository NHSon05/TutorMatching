using System.Text.Json.Nodes;
using TutorMatching.Api.IntegrationTests.Fixtures;

namespace TutorMatching.Api.IntegrationTests.Contracts;

// Runtime parity for the implemented US3 account-administration operations against the Sprint 4 contract.
[Collection("PostgreSQL API")]
public sealed class AdminUsersContractTests(PostgreSqlFixture fixture)
{
    [Fact]
    public async Task RuntimeAdminUserOperationsMatchThePublishedContract()
    {
        await using var factory = await fixture.CreateFactoryAsync();
        using var client = factory.CreateApiClient();
        var actual = JsonNode.Parse(await client.GetStringAsync("/openapi/v1.json"))!;
        var planned = JsonNode.Parse(await File.ReadAllTextAsync(Path.Combine(AppContext.BaseDirectory, "Contracts", "messaging-admin.json")))!;

        foreach (var (path, method) in new[] { ("/admin/users/{id}", "get"), ("/admin/users/{id}/status", "post") })
        {
            var contract = planned["paths"]![path]![method]!;
            var generated = actual["paths"]?["/api/v1" + path]?[method];
            Assert.True(generated is not null, $"Missing implemented operation: {method.ToUpperInvariant()} {path}");
            Assert.Equal(contract["operationId"]!.GetValue<string>(), generated!["operationId"]!.GetValue<string>());
            var security = (generated["security"] ?? actual["security"])!.ToJsonString();
            Assert.Contains("cookieAuth", security);
            if (method == "post") Assert.Contains("csrfHeader", security);
            foreach (var status in contract["responses"]!.AsObject().Select(r => r.Key).Where(s => s != "200"))
                Assert.NotNull(generated["responses"]![status]!["content"]!["application/problem+json"]);
            var wanted = Resolve(planned, contract["responses"]!["200"]!["content"]!["application/json"]!["schema"]!);
            var produced = Resolve(actual, generated["responses"]!["200"]!["content"]!["application/json"]!["schema"]!);
            Assert.Equal(PropertyNames(planned, wanted), PropertyNames(actual, produced));
        }
        var body = actual["paths"]!["/api/v1/admin/users/{id}/status"]!["post"]!["requestBody"]!["content"]!["application/json"]!["schema"]!;
        Assert.Equal(["confirmed", "expectedVersion", "status"], PropertyNames(actual, body));
        var list = Resolve(actual, actual["paths"]!["/api/v1/admin/users"]!["get"]!["responses"]!["200"]!["content"]!["application/json"]!["schema"]!);
        Assert.Equal(PropertyNames(planned, planned["components"]!["schemas"]!["AdminUser"]!),
            PropertyNames(actual, list["properties"]!["items"]!["items"]!));
        var parameters = actual["paths"]!["/api/v1/admin/users"]!["get"]!["parameters"]!.AsArray()
            .Select(p => p!["name"]!.GetValue<string>()).Order().ToArray();
        Assert.Equal(["page", "pageSize", "q", "role", "status"], parameters);
    }

    private static string[] PropertyNames(JsonNode document, JsonNode schema) =>
        Resolve(document, schema)["properties"]!.AsObject().Select(x => x.Key).Order().ToArray();

    private static JsonNode Resolve(JsonNode document, JsonNode node)
    {
        while (node["$ref"] is { } reference)
            node = reference.GetValue<string>()[2..].Split('/').Aggregate(document, (current, part) => current[part]!);
        return node;
    }
}
