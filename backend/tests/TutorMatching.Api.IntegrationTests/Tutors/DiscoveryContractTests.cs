using System.Text.Json.Nodes;
using TutorMatching.Api.IntegrationTests.Fixtures;

namespace TutorMatching.Api.IntegrationTests.Tutors;

[Collection("PostgreSQL API")]
public sealed class DiscoveryContractTests(PostgreSqlFixture fixture)
{
    [Fact]
    public async Task EveryDiscoveryOperationMatchesItsPublishedContract()
    {
        await using var factory = await fixture.CreateFactoryAsync();
        using var client = factory.CreateApiClient();
        using var response = await client.GetAsync("/openapi/v1.json");
        response.EnsureSuccessStatusCode();
        var actual = JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
        var expected = JsonNode.Parse(await File.ReadAllTextAsync(
            Path.Combine(AppContext.BaseDirectory, "Contracts", "discovery.json")))!;
        var differences = new List<string>();
        foreach (var (path, item) in expected["paths"]!.AsObject())
        foreach (var (method, operation) in item!.AsObject())
        {
            if (method is not ("get" or "post" or "put" or "patch" or "delete")) continue;
            var generated = actual["paths"]?[path]?[method];
            if (generated is null)
            {
                differences.Add($"Missing operation: {method} {path}");
                continue;
            }
            Compare(expected, operation!, actual, generated, $"{method} {path}", differences);
        }
        foreach (var (name, scheme) in expected["components"]!["securitySchemes"]!.AsObject())
            if (!JsonNode.DeepEquals(scheme, actual["components"]?["securitySchemes"]?[name]))
                differences.Add($"Security scheme drift: {name}");
        Assert.True(differences.Count == 0, string.Join("\n", differences));
    }

    private static void Compare(JsonNode expectedDocument, JsonNode expected,
        JsonNode actualDocument, JsonNode actual, string path, List<string> differences)
    {
        expected = Resolve(expectedDocument, expected);
        actual = Resolve(actualDocument, actual);
        if (expected is JsonObject wanted && actual is JsonObject generated)
        {
            foreach (var (key, value) in wanted)
            {
                // Descriptions, examples and component names do not affect the wire contract.
                if (key is "description" or "summary" or "example" or "examples" or "title" or "tags") continue;
                var found = generated[key];
                if (key == "security") found ??= actualDocument["security"];
                if (value is null && found is null) continue;
                if (value is null || found is null)
                {
                    differences.Add($"{path}/{key}: expected {value?.ToJsonString() ?? "null"}, actual {found?.ToJsonString() ?? "missing"}");
                    continue;
                }
                Compare(expectedDocument, value, actualDocument, found, $"{path}/{key}", differences);
            }
            if (path.EndsWith("/properties") || path.EndsWith("/responses") || path.EndsWith("/content"))
                foreach (var key in generated.Select(pair => pair.Key).Except(wanted.Select(pair => pair.Key)))
                    differences.Add($"{path}/{key}: undocumented member");
            return;
        }
        if (expected is JsonArray expectedArray && actual is JsonArray actualArray)
        {
            if (path.EndsWith("/parameters"))
            {
                var wantedParameters = expectedArray.ToDictionary(p => $"{p!["in"]}:{p["name"]}");
                var actualParameters = actualArray.ToDictionary(p => $"{p!["in"]}:{p["name"]}");
                foreach (var (key, value) in wantedParameters)
                    if (actualParameters.TryGetValue(key, out var found))
                        Compare(expectedDocument, value!, actualDocument, found!, $"{path}/{key}", differences);
                    else differences.Add($"{path}/{key}: missing parameter");
                foreach (var key in actualParameters.Keys.Except(wantedParameters.Keys))
                    differences.Add($"{path}/{key}: undocumented parameter");
                return;
            }
            if (path.EndsWith("/required") || path.EndsWith("/enum") || path.EndsWith("/type"))
            {
                if (expectedArray.Select(x => x!.ToJsonString()).Order().SequenceEqual(actualArray.Select(x => x!.ToJsonString()).Order())) return;
            }
            else if (expectedArray.Count == actualArray.Count)
            {
                for (var i = 0; i < expectedArray.Count; i++)
                    Compare(expectedDocument, expectedArray[i]!, actualDocument, actualArray[i]!, $"{path}/{i}", differences);
                return;
            }
        }
        if (!JsonNode.DeepEquals(expected, actual))
            differences.Add($"{path}: expected {expected.ToJsonString()}, actual {actual.ToJsonString()}");
    }

    private static JsonNode Resolve(JsonNode document, JsonNode node)
    {
        while (node is JsonObject && node["$ref"] is { } reference)
        {
            var path = reference.GetValue<string>();
            Assert.StartsWith("#/", path);
            node = path[2..].Split('/').Aggregate(document,
                (current, part) => current[part.Replace("~1", "/").Replace("~0", "~")]!);
            Assert.NotNull(node);
        }
        return node;
    }
}
