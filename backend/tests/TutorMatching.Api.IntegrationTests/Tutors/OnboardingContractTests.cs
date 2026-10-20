using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using TutorMatching.Domain.Users;
using TutorMatching.Infrastructure.Persistence;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using TutorMatching.Api.IntegrationTests.Authentication;
using TutorMatching.Api.IntegrationTests.Fixtures;

namespace TutorMatching.Api.IntegrationTests.Tutors;

[Collection("PostgreSQL API")]
public sealed class OnboardingContractTests(PostgreSqlFixture fixture)
{
    [Fact]
    public async Task ExistingClientDraftShapeRoundTripsAndPartialUpdatesPreserveOtherSteps()
    {
        await using var factory = await fixture.CreateFactoryAsync();
        using var client = factory.CreateApiClient();
        await RegisterTutor(factory, client);
        using var saved = await PutDraft(client, new
        {
            currentStep = 4,
            about = new { fullName = "Contract Tutor", subjects = new[] { "Math" }, languages = new[] { "Vietnamese" }, teachingLevels = new[] { "Grade 10" } },
            hasCertifications = false,
            education = new { educationType = "GRADUATED", schoolName = "Test School", degree = "Bachelor", specialization = "Math" },
            description = new { bio = "Teaching mathematics", experienceYears = 2, teachingMethodology = "Practice", achievementsAndResults = "Results" },
            pricing = new { hourlyRateVnd = 100000, sessionRateVnd = 150000, monthlyRateVnd = 1200000, isNegotiable = true }
        });
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);
        using var partial = await PutDraft(client, new { currentStep = 5 });
        Assert.Equal(HttpStatusCode.OK, partial.StatusCode);
        using var response = await client.GetAsync("/api/v1/tutor/onboarding/me");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(response.Headers.CacheControl?.NoStore);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("DRAFT", body.GetProperty("status").GetString());
        Assert.Equal(5, body.GetProperty("currentStep").GetInt32());
        Assert.Equal("Math", body.GetProperty("about").GetProperty("subjects")[0].GetString());
        Assert.Equal("Bachelor", body.GetProperty("education").GetProperty("degree").GetString());
        Assert.Equal("Teaching mathematics", body.GetProperty("description").GetProperty("bio").GetString());
        Assert.Equal(150000, body.GetProperty("pricing").GetProperty("sessionRateVnd").GetInt32());
        Assert.True(body.GetProperty("pricing").GetProperty("isNegotiable").GetBoolean());
        Assert.Equal(JsonValueKind.Array, body.GetProperty("certifications").ValueKind);
        Assert.True(body.TryGetProperty("submittedAt", out _));
        Assert.True(body.TryGetProperty("approvedAt", out _));
    }

    [Fact]
    public async Task LegacyEmptyDraftRemainsSaveableButCannotBeSubmitted()
    {
        await using var factory = await fixture.CreateFactoryAsync();
        using var client = factory.CreateApiClient();
        await RegisterTutor(factory, client);
        using var saved = await PutDraft(client, new { currentStep = 1 });
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);
        var csrf = await client.GetFromJsonAsync<JsonElement>("/api/v1/auth/csrf");
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/tutor/onboarding/submit");
        request.Headers.Add("X-CSRF-TOKEN", csrf.GetProperty("requestToken").GetString());
        using var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(body.TryGetProperty("errors", out _));
    }

    internal static async Task RegisterTutor(ApiWebApplicationFactory factory, HttpClient client)
    {
        // Provision only the fixture account; public registration is tested by Sprint 1.
        await using var scope = factory.Services.CreateAsyncScope();
        var manager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var now = DateTimeOffset.UtcNow;
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(), FullName = "Contract Tutor", UserName = "contract@example.test",
            Email = "contract@example.test", Role = AccountRole.TUTOR, Status = AccountStatus.ACTIVE,
            CreatedAt = now, UpdatedAt = now
        };
        var result = await manager.CreateAsync(user, "password");
        Assert.True(result.Succeeded, string.Join(", ", result.Errors.Select(e => e.Code)));
        using var login = await SessionEndpointTests.Post(client, "login", new { email = "contract@example.test", password = "password" });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
    }

    private static async Task<HttpResponseMessage> PutDraft(HttpClient client, object body)
    {
        var csrf = await client.GetFromJsonAsync<JsonElement>("/api/v1/auth/csrf");
        using var request = new HttpRequestMessage(HttpMethod.Put, "/api/v1/tutor/onboarding/draft") { Content = JsonContent.Create(body) };
        request.Headers.Add("X-CSRF-TOKEN", csrf.GetProperty("requestToken").GetString());
        return await client.SendAsync(request);
    }
}
