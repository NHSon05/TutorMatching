using System.Text.Json.Nodes;
using Microsoft.OpenApi;
using TutorMatching.Domain.Tutors;
using TutorMatching.Domain.Users;

namespace TutorMatching.Api.IntegrationTests.Contracts;

// Planning-document checks do not claim runtime parity for unimplemented Sprint 4 endpoints.
public sealed class MessagingAdminOpenApiContractTests
{
    private static readonly string ContractPath = Path.Combine(AppContext.BaseDirectory, "Contracts", "messaging-admin.json");
    private static JsonNode Document() => JsonNode.Parse(File.ReadAllText(ContractPath))!;

    [Fact]
    public void PlanningContractIsValidOpenApi31WithResolvableReferences()
    {
        var text = File.ReadAllText(ContractPath);
        var result = OpenApiDocument.Parse(text, "json");
        Assert.NotNull(result.Diagnostic);
        Assert.Empty(result.Diagnostic!.Errors);
        Assert.Empty(result.Diagnostic.Warnings);
        Assert.NotNull(result.Document);
        Assert.Empty(result.Document!.Validate(ValidationRuleSet.GetDefaultRuleSet()));
        var document = JsonNode.Parse(text)!;
        Assert.Equal("3.1.0", document["openapi"]!.GetValue<string>());
        foreach (var node in Descendants(document).OfType<JsonObject>())
        {
            if (node["$ref"] is not { } reference) continue;
            var pointer = reference.GetValue<string>();
            Assert.StartsWith("#/", pointer);
            Assert.NotNull(pointer[2..].Split('/').Aggregate(document,
                (current, part) => current[part.Replace("~1", "/").Replace("~0", "~")]!));
        }
    }

    [Fact]
    public void EveryPlannedHttpOperationHasExplicitSecurityErrorsAndResponseSchema()
    {
        var document = Document();
        string[] expected =
        [
            "GET /conversations", "GET /conversations/{id}", "GET /conversations/{id}/messages",
            "POST /conversations/{id}/messages", "POST /conversations/{id}/read",
            "GET /notifications", "GET /notifications/unread-count", "POST /notifications/{id}/read",
            "POST /notifications/read-all", "POST /notifications/{id}/open",
            "GET /admin/users", "GET /users", "GET /admin/users/{id}", "POST /admin/users/{id}/status",
            "GET /admin/articles", "POST /admin/articles", "GET /admin/articles/{id}",
            "PUT /admin/articles/{id}", "POST /admin/articles/{id}/publish", "POST /admin/articles/{id}/hide",
            "GET /articles", "GET /articles/{slug}", "GET /admin/hire-requests", "GET /admin/hire-requests/{id}",
            "GET /admin/catalog/{kind}", "POST /admin/catalog/{kind}", "PUT /admin/catalog/{kind}/{code}",
            "GET /admin/dashboard", "GET /admin/audit"
        ];
        var operations = document["paths"]!.AsObject().SelectMany(path => path.Value!.AsObject()
            .Select(operation => (Key: $"{operation.Key.ToUpperInvariant()} {path.Key}", Operation: operation.Value!))).ToArray();
        Assert.Equal(expected.Order(), operations.Select(x => x.Key).Order());
        Assert.Equal(operations.Length, operations.Select(x => x.Operation["operationId"]!.GetValue<string>()).Distinct().Count());
        foreach (var (key, operation) in operations)
        {
            var isPublic = key is "GET /articles" or "GET /articles/{slug}";
            var security = operation["security"]!.AsArray();
            if (isPublic) Assert.Empty(security);
            else
            {
                Assert.NotNull(security[0]!["cookieAuth"]);
                foreach (var status in new[] { "401", "403" }) Assert.NotNull(operation["responses"]![status]);
                if (!key.StartsWith("GET ", StringComparison.Ordinal)) Assert.NotNull(security[0]!["csrfHeader"]);
            }
            foreach (var response in operation["responses"]!.AsObject())
            {
                var resolved = Resolve(document, response.Value!);
                Assert.NotNull(resolved["content"]);
                if (!isPublic) Assert.NotNull(resolved["headers"]!["Cache-Control"]);
            }
        }
        foreach (var status in new[] { "400", "401", "403", "404", "409", "422" })
            Assert.NotNull(document["components"]!["responses"]!["Error" + status]!["content"]!["application/problem+json"]);
    }

    [Fact]
    public void CompatibilityAndCanonicalVocabulariesArePreserved()
    {
        var document = Document();
        var schemas = document["components"]!["schemas"]!;
        Assert.Equal(Enum.GetNames<AccountRole>().Order(), Values(schemas["AccountRole"]!["enum"]).Order());
        Assert.Equal(Enum.GetNames<AccountStatus>().Order(), Values(schemas["AccountStatus"]!["enum"]).Order());
        Assert.Equal(Enum.GetNames<TutorProfileStatus>().Order(), Values(schemas["TutorProfileStatus"]!["enum"]).Order());
        Assert.Equal(new[] { "PENDING", "NEGOTIATING", "ACCEPTED", "REJECTED", "CANCELLED", "COMPLETED" }, Values(schemas["HireRequestStatus"]!["enum"]));
        Assert.Equal(new[] { "TUTOR_PROFILE_REVIEWED", "HIRE_REQUEST_CREATED", "HIRE_REQUEST_PROPOSED", "HIRE_REQUEST_ACCEPTED", "HIRE_REQUEST_REJECTED", "HIRE_REQUEST_CANCELLED", "HIRE_REQUEST_COMPLETED", "MESSAGE_CREATED" }, Values(schemas["NotificationType"]!["enum"]));
        Assert.Equal("accessToken", document["components"]!["securitySchemes"]!["cookieAuth"]!["name"]!.GetValue<string>());
        foreach (var section in new[] { "parameters", "responses", "security" })
            Assert.True(JsonNode.DeepEquals(document["paths"]!["/users"]!["get"]![section], document["paths"]!["/admin/users"]!["get"]![section]));
        foreach (var field in new[] { "items", "totalCount", "page", "pageSize" })
            Assert.Contains(field, Values(schemas["AdminUsersPage"]!["required"]));
        foreach (var field in new[] { "fullName", "email", "tutorProfileId", "tutorProfileStatus" })
            Assert.NotNull(schemas["AdminUser"]!["properties"]![field]);
        foreach (var name in new[] { "CreateCatalogItem", "UpdateCatalogItem" })
            Assert.DoesNotContain("provinceCode", Values(schemas[name]!["required"]));
        var auditIdentity = schemas["AuditEvent"]!["properties"]!["entityId"]!;
        Assert.Equal(new[] { "string", "null" }, Values(auditIdentity["type"]));
        Assert.Null(auditIdentity["format"]);
        Assert.Null(auditIdentity["pattern"]);
        var identityFilter = document["paths"]!["/admin/audit"]!["get"]!["parameters"]!.AsArray()
            .Single(x => x!["name"]!.GetValue<string>() == "entityId")!["schema"]!;
        Assert.Equal("string", identityFilter["type"]!.GetValue<string>());
        Assert.Null(identityFilter["format"]);
        Assert.Null(identityFilter["pattern"]);
    }

    [Fact]
    public void MutationBoundariesAndNullableLegacyFieldsAreExplicit()
    {
        var document = Document();
        var schemas = document["components"]!["schemas"]!;
        Assert.Equal(4000, schemas["SendMessage"]!["properties"]!["content"]!["maxLength"]!.GetValue<int>());
        Assert.Equal(4000, schemas["SendMessage"]!["properties"]!["content"]!["x-maxUtf16Length"]!.GetValue<int>());
        Assert.Equal(1, schemas["MarkMessagesRead"]!["properties"]!["messageIds"]!["minItems"]!.GetValue<int>());
        Assert.Equal(100, schemas["MarkMessagesRead"]!["properties"]!["messageIds"]!["maxItems"]!.GetValue<int>());
        Assert.Contains("null", Values(schemas["Message"]!["properties"]!["clientMessageId"]!["type"]));
        Assert.NotNull(document["paths"]!["/conversations/{id}/messages"]!["post"]!["responses"]!["200"]);
        Assert.NotNull(document["paths"]!["/conversations/{id}/messages"]!["post"]!["responses"]!["201"]);
        foreach (var schema in new[] { "UpdateUserStatus", "ConfirmedVersion", "UpdateArticle", "UpdateCatalogItem" })
        {
            Assert.Contains("expectedVersion", Values(schemas[schema]!["required"]));
            Assert.Equal("uuid", schemas[schema]!["properties"]!["expectedVersion"]!["format"]!.GetValue<string>());
        }
        foreach (var schema in new[] { "UpdateUserStatus", "ConfirmedVersion" })
            Assert.True(schemas[schema]!["properties"]!["confirmed"]!["const"]!.GetValue<bool>());
        Assert.NotNull(schemas["UpdateCatalogItem"]!["if"]);
        foreach (var (field, maximum) in new[] { ("title", 256), ("slug", 256), ("summary", 1000), ("content", 50000) })
            Assert.Equal(maximum, schemas["CreateArticle"]!["properties"]![field]!["maxLength"]!.GetValue<int>());
        Assert.NotNull(schemas["ProblemDetails"]!["properties"]!["errors"]!["additionalProperties"]!["items"]);
    }

    [Fact]
    public void SafeDtosExcludePrivateFieldsAndDashboardRetainsEveryCanonicalZeroGroup()
    {
        var document = Document();
        var schemas = document["components"]!["schemas"]!;
        string[] forbidden = ["passwordHash", "securityStamp", "concurrencyStamp", "token", "email", "phoneNumber", "dateOfBirth", "locationDetail", "ipAddress", "diff", "messages", "allowedActions"];
        foreach (var name in new[] { "Conversation", "Message", "PublicArticle", "PublicArticleSummary", "AdminHireRequest", "AdminHireRequestSummary", "AuditEvent" })
        {
            var properties = PropertyNames(document, schemas[name]!).ToArray();
            Assert.Empty(properties.Intersect(forbidden));
            Assert.False(properties.Contains("version") && name.StartsWith("Public", StringComparison.Ordinal));
        }
        foreach (var (counts, vocabulary) in new[] { ("UsersByRole", "AccountRole"), ("TutorProfilesByStatus", "TutorProfileStatus"), ("HireRequestsByStatus", "HireRequestStatus") })
        {
            Assert.Equal(Values(schemas[vocabulary]!["enum"]).Order(), Values(schemas[counts]!["required"]).Order());
            foreach (var field in schemas[counts]!["properties"]!.AsObject())
                Assert.Equal(0, field.Value!["minimum"]!.GetValue<int>());
        }
    }

    private static string[] Values(JsonNode? node) => Assert.IsType<JsonArray>(node).Select(x => x!.GetValue<string>()).ToArray();
    private static JsonNode Resolve(JsonNode document, JsonNode node) => node["$ref"] is { } reference
        ? reference.GetValue<string>()[2..].Split('/').Aggregate(document, (current, part) => current[part]!) : node;
    private static IEnumerable<JsonNode> Descendants(JsonNode node)
    {
        yield return node;
        var children = node switch { JsonObject obj => obj.Select(x => x.Value), JsonArray array => array, _ => [] };
        foreach (var child in children.Where(x => x is not null))
        foreach (var descendant in Descendants(child!)) yield return descendant;
    }
    private static IEnumerable<string> PropertyNames(JsonNode document, JsonNode schema)
    {
        schema = Resolve(document, schema);
        if (schema["properties"] is JsonObject properties)
        foreach (var property in properties)
        {
            yield return property.Key;
            foreach (var nested in PropertyNames(document, property.Value!)) yield return nested;
        }
        if (schema["items"] is { } items)
            foreach (var nested in PropertyNames(document, items)) yield return nested;
        foreach (var keyword in new[] { "oneOf", "anyOf", "allOf" })
            if (schema[keyword] is JsonArray variants)
                foreach (var variant in variants)
                foreach (var nested in PropertyNames(document, variant!)) yield return nested;
    }
}
