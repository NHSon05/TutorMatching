using System.Text.Json.Nodes;
using System.Globalization;
using TutorMatching.Api.IntegrationTests.Fixtures;
using YamlDotNet.Serialization;

namespace TutorMatching.Api.IntegrationTests.Contracts;

[Collection("PostgreSQL API")]
public sealed class OpenApiContractTests(PostgreSqlFixture fixture)
{
    // These operations belong to subsequent story tasks, not the foundation checkpoint.
    private static readonly HashSet<string> PendingOperations =
    [
        "POST /api/v1/auth/forgot-password", "POST /api/v1/auth/reset-password",
        "PUT /api/v1/users/me"
    ];

    [Fact]
    public async Task GeneratedV1MatchesImplementedContractSurface()
    {
        await using var factory = await fixture.CreateFactoryAsync();
        using var client = factory.CreateApiClient();
        using var response = await client.GetAsync("/openapi/v1.json");
        response.EnsureSuccessStatusCode();
        var actual = JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
        var yaml = await File.ReadAllTextAsync(Path.Combine(AppContext.BaseDirectory, "Contracts", "openapi.yaml"));
        var data = new DeserializerBuilder().Build().Deserialize<object>(yaml);
        var expected = JsonNode.Parse(new SerializerBuilder().JsonCompatible().Build().Serialize(data))!;
        Assert.Equal(expected["info"]!["version"]!.GetValue<string>(), actual["info"]!["version"]!.GetValue<string>());
        Assert.Equal(expected["info"]!["title"]!.GetValue<string>(), actual["info"]!["title"]!.GetValue<string>());
        Assert.StartsWith("3.1", actual["openapi"]!.GetValue<string>());

        var actualOps = Operations(actual);
        var expectedOps = Operations(expected);
        Assert.NotEmpty(actualOps);
        foreach (var (key, operation) in actualOps)
        {
            Assert.True(expectedOps.TryGetValue(key, out var contract), $"Undocumented operation: {key}");
            Assert.True(contract!["operationId"] is JsonValue, $"Missing contract operationId: {key}");
            Assert.True(operation["operationId"] is JsonValue, $"Missing generated operationId: {key}");
            Assert.Equal(contract["operationId"]!.GetValue<string>(), operation["operationId"]!.GetValue<string>());
            Assert.True(JsonNode.DeepEquals(contract["security"], operation["security"] ?? actual["security"]), $"Security drift: {key}");
            Assert.Equal(contract["responses"]!.AsObject().Select(x => x.Key).Order(),
                operation["responses"]!.AsObject().Select(x => x.Key).Order());
            Assert.Equal(contract["requestBody"] is null, operation["requestBody"] is null);
            if (contract["requestBody"] is { } request)
                CompareContent(expected, Resolve(expected, request), actual, Resolve(actual, operation["requestBody"]!));
            foreach (var (status, expectedResponse) in contract["responses"]!.AsObject())
            {
                var wanted = Resolve(expected, expectedResponse!);
                var generated = Resolve(actual, operation["responses"]![status]!);
                CompareContent(expected, wanted, actual, generated);
                if (wanted["headers"] is JsonObject headers)
                foreach (var (header, schema) in headers)
                {
                    Assert.NotNull(generated["headers"]?[header]);
                    CompareSchema(expected, Resolve(expected, schema!)["schema"]!, actual,
                        Resolve(actual, generated["headers"]![header]!)["schema"]!);
                }
            }
        }
        foreach (var key in expectedOps.Keys.Except(PendingOperations))
            Assert.True(actualOps.ContainsKey(key), $"Missing implemented operation: {key}");
        foreach (var scheme in expected["components"]!["securitySchemes"]!.AsObject())
            Assert.True(JsonNode.DeepEquals(scheme.Value, actual["components"]!["securitySchemes"]![scheme.Key]),
                $"Security scheme drift: {scheme.Key}");
    }

    private static Dictionary<string, JsonNode> Operations(JsonNode document)
    {
        var prefix = document["servers"]![0]!["url"]!.GetValue<string>().TrimEnd('/');
        return document["paths"]!.AsObject().SelectMany(path => path.Value!.AsObject()
            .Where(op => new[] { "get", "post", "put", "patch", "delete", "head", "options" }.Contains(op.Key))
            .Select(op => new KeyValuePair<string, JsonNode>($"{op.Key.ToUpperInvariant()} {prefix}{path.Key}", op.Value!)))
            .ToDictionary();
    }

    private static JsonNode Resolve(JsonNode document, JsonNode node)
    {
        while (node["$ref"] is { } reference)
        {
            var path = reference.GetValue<string>();
            Assert.StartsWith("#/", path);
            node = path[2..].Split('/').Aggregate(document, (current, part) =>
                current[part.Replace("~1", "/").Replace("~0", "~")]!);
            Assert.NotNull(node);
        }
        return node;
    }

    private static void CompareContent(JsonNode expectedDoc, JsonNode expected, JsonNode actualDoc, JsonNode actual)
    {
        if (expected["content"] is not JsonObject content) return;
        Assert.Equal(content.Select(x => x.Key).Order(), actual["content"]!.AsObject().Select(x => x.Key).Order());
        foreach (var (media, value) in content)
            CompareSchema(expectedDoc, value!["schema"]!, actualDoc, actual["content"]![media]!["schema"]!);
    }

    private static void CompareSchema(JsonNode expectedDoc, JsonNode expected, JsonNode actualDoc, JsonNode actual)
    {
        expected = Resolve(expectedDoc, expected);
        actual = Resolve(actualDoc, actual);
        // Compare specified constraints; generated documents may add descriptions/standard fields.
        foreach (var key in new[] { "type", "format", "const", "enum", "minLength", "maxLength", "additionalProperties" })
            if (expected[key] is { } constraint)
                Assert.True(
                    ConstraintEquals(constraint, actual[key]),
                    $"Schema constraint drift: {key}; expected {constraint.ToJsonString()}, actual {actual[key]?.ToJsonString() ?? "<missing>"}");
        if (expected["required"] is JsonArray required)
            Assert.Equal(required.Select(x => x!.GetValue<string>()).Order(),
                actual["required"]!.AsArray().Select(x => x!.GetValue<string>()).Order());
        if (expected["properties"] is JsonObject properties)
        foreach (var (key, property) in properties)
        {
            Assert.NotNull(actual["properties"]?[key]);
            CompareSchema(expectedDoc, property!, actualDoc, actual["properties"]![key]!);
        }
    }

    private static bool ConstraintEquals(JsonNode expected, JsonNode? actual)
    {
        if (expected is JsonArray expectedArray && actual is JsonArray actualArray)
        {
            return expectedArray.Select(item => item!.ToJsonString()).Order()
                .SequenceEqual(actualArray.Select(item => item!.ToJsonString()).Order());
        }

        if (expected is JsonValue expectedValue &&
            expectedValue.TryGetValue<string>(out var text) &&
            bool.TryParse(text, out var expectedBoolean) &&
            actual is JsonValue actualValue &&
            actualValue.TryGetValue<bool>(out var actualBoolean))
        {
            return expectedBoolean == actualBoolean;
        }

        if (expected is JsonValue numericExpected &&
            numericExpected.TryGetValue<string>(out var numericText) &&
            decimal.TryParse(numericText, NumberStyles.Number, CultureInfo.InvariantCulture, out var expectedNumber) &&
            actual is not null &&
            decimal.TryParse(actual.ToJsonString(), NumberStyles.Number, CultureInfo.InvariantCulture, out var actualNumber))
        {
            return expectedNumber == actualNumber;
        }

        return JsonNode.DeepEquals(expected, actual);
    }
}
