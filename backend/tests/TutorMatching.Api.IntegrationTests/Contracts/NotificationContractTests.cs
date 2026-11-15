using System.Text.Json.Nodes;
using TutorMatching.Api.IntegrationTests.Fixtures;

namespace TutorMatching.Api.IntegrationTests.Contracts;

// Runtime parity for the implemented US2 notification operations against the Sprint 4 contract.
[Collection("PostgreSQL API")]
public sealed class NotificationContractTests(PostgreSqlFixture fixture)
{
    [Fact]
    public async Task RuntimeNotificationOperationsMatchThePublishedContract()
    {
        await using var factory = await fixture.CreateFactoryAsync();
        using var client = factory.CreateApiClient();
        var actual = JsonNode.Parse(await client.GetStringAsync("/openapi/v1.json"))!;
        var planned = JsonNode.Parse(await File.ReadAllTextAsync(Path.Combine(AppContext.BaseDirectory, "Contracts", "messaging-admin.json")))!;
        var operations = planned["paths"]!.AsObject()
            .Where(p => p.Key.StartsWith("/notifications", StringComparison.Ordinal))
            .SelectMany(p => p.Value!.AsObject().Select(op => (Path: p.Key, Method: op.Key, Operation: op.Value!)))
            .ToArray();
        Assert.Equal(5, operations.Length);

        foreach (var (path, method, contract) in operations)
        {
            var generated = actual["paths"]?["/api/v1" + path]?[method];
            Assert.True(generated is not null, $"Missing implemented operation: {method.ToUpperInvariant()} {path}");
            Assert.Equal(contract["operationId"]!.GetValue<string>(), generated!["operationId"]!.GetValue<string>());

            var security = (generated["security"] ?? actual["security"])!.ToJsonString();
            Assert.Contains("cookieAuth", security);
            if (method == "post") Assert.Contains("csrfHeader", security);

            foreach (var status in new[] { "400", "401", "403", "404" })
                Assert.NotNull(generated["responses"]![status]!["content"]!["application/problem+json"]);

            var wanted = Resolve(planned, contract["responses"]!["200"]!["content"]!["application/json"]!["schema"]!);
            var produced = Resolve(actual, generated["responses"]!["200"]!["content"]!["application/json"]!["schema"]!);
            Assert.Equal(PropertyNames(planned, wanted), PropertyNames(actual, produced));
        }

        var readAll = Resolve(actual, actual["paths"]!["/api/v1/notifications/read-all"]!["post"]!["requestBody"]!["content"]!["application/json"]!["schema"]!);
        Assert.Equal(["boundary"], PropertyNames(actual, readAll));
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
