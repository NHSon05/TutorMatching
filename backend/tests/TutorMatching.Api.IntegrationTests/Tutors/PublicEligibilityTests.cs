using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorMatching.Api.IntegrationTests.Fixtures;
using TutorMatching.Domain.Tutors;
using TutorMatching.Domain.Users;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Api.IntegrationTests.Tutors;

[Collection("PostgreSQL API")]
public sealed class PublicEligibilityTests(PostgreSqlFixture fixture)
{
    [Theory]
    [InlineData(TutorProfileStatus.DRAFT, AccountStatus.ACTIVE, "")]
    [InlineData(TutorProfileStatus.PENDING_REVIEW, AccountStatus.ACTIVE, "?status=all")]
    [InlineData(TutorProfileStatus.REJECTED, AccountStatus.ACTIVE, "?status=REJECTED")]
    [InlineData(TutorProfileStatus.APPROVED, AccountStatus.LOCKED, "")]
    [InlineData(TutorProfileStatus.APPROVED, AccountStatus.INACTIVE, "")]
    public async Task AnonymousListNeverExposesIneligibleProfiles(TutorProfileStatus status, AccountStatus accountStatus, string query)
    {
        await using var factory = await fixture.CreateFactoryAsync();
        var id = await Seed(factory, status, accountStatus);
        using var anonymous = factory.CreateApiClient();
        using var response = await anonymous.GetAsync("/api/v1/tutors" + query);
        if (query.Length > 0 && response.StatusCode == HttpStatusCode.BadRequest) return;
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.DoesNotContain(body.GetProperty("items").EnumerateArray(), item => item.GetProperty("id").GetGuid() == id);
        Assert.Equal(0, body.GetProperty("totalCount").GetInt32());
    }

    [Theory]
    [InlineData(TutorProfileStatus.DRAFT, AccountStatus.ACTIVE)]
    [InlineData(TutorProfileStatus.PENDING_REVIEW, AccountStatus.ACTIVE)]
    [InlineData(TutorProfileStatus.REJECTED, AccountStatus.ACTIVE)]
    [InlineData(TutorProfileStatus.APPROVED, AccountStatus.LOCKED)]
    [InlineData(TutorProfileStatus.APPROVED, AccountStatus.INACTIVE)]
    public async Task AnonymousDetailHidesIneligibleProfiles(TutorProfileStatus status, AccountStatus accountStatus)
    {
        await using var factory = await fixture.CreateFactoryAsync();
        var id = await Seed(factory, status, accountStatus);
        using var anonymous = factory.CreateApiClient();
        using var response = await anonymous.GetAsync($"/api/v1/tutors/{id}");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task ApprovedActiveProfileIsDiscoverable()
    {
        await using var factory = await fixture.CreateFactoryAsync();
        var id = await Seed(factory, TutorProfileStatus.APPROVED, AccountStatus.ACTIVE);
        using var anonymous = factory.CreateApiClient();
        var body = await anonymous.GetFromJsonAsync<JsonElement>("/api/v1/tutors");
        Assert.Contains(body.GetProperty("items").EnumerateArray(), item => item.GetProperty("id").GetGuid() == id);
        using var detail = await anonymous.GetAsync($"/api/v1/tutors/{id}");
        Assert.Equal(HttpStatusCode.OK, detail.StatusCode);
    }

    private static async Task<Guid> Seed(ApiWebApplicationFactory factory, TutorProfileStatus status, AccountStatus accountStatus)
    {
        using var owner = factory.CreateApiClient();
        await OnboardingContractTests.RegisterTutor(factory, owner);
        // Owner read creates the real onboarding profile if registration did not create it.
        using var initialized = await owner.GetAsync("/api/v1/tutor/onboarding/me");
        Assert.Equal(HttpStatusCode.OK, initialized.StatusCode);
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var user = await db.Users.SingleAsync(u => u.Email == "contract@example.test");
        var profile = await db.TutorProfiles.SingleAsync(p => p.UserId == user.Id);
        user.Status = accountStatus;
        profile.Status = status;
        profile.SessionRateVnd = 150000;
        db.TutorSubjects.Add(new TutorSubject { TutorProfileId = profile.Id, SubjectId = TutorDiscoverySeed.MathId });
        await db.SaveChangesAsync();
        return profile.Id;
    }
}
