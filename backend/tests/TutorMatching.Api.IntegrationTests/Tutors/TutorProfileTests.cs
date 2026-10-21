using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorMatching.Api.IntegrationTests.Fixtures;
using TutorMatching.Domain.Tutors;
using TutorMatching.Infrastructure.Persistence;
namespace TutorMatching.Api.IntegrationTests.Tutors;
[Collection("PostgreSQL API")]
public sealed class TutorProfileTests(PostgreSqlFixture fixture)
{
    [Theory]
    [InlineData(true)] [InlineData(false)]
    public async Task PendingAndApprovedProfilesRequireSafeTransitions(bool complete)
    {
        await using var factory=await fixture.CreateFactoryAsync(); using var client=factory.CreateApiClient();
        await OnboardingContractTests.RegisterTutor(factory,client);
        var initial=await client.GetFromJsonAsync<JsonElement>("/api/v1/tutor/onboarding/me");
        Assert.True(initial.TryGetProperty("version",out var version));
        using var saved=await Write(client,new { expectedVersion=version.GetString(), discovery=new { subjects=new[]{new {subjectId=TutorDiscoverySeed.MathId,levelCodes=new[]{"HIGH_SCHOOL"}}},teachingModes=new[]{"ONLINE"}},
            about=new {fullName="Contract Tutor",dateOfBirth="1995-01-01",phoneNumber="+84911111111",languages=new[]{"Vietnamese"}}, avatarUrl="/uploads/avatars/test.jpg",
            education=new {educationType="GRADUATED",degree="Bachelor"},description=new {bio="Tutor bio",experienceYears=2},pricing=new {sessionRateVnd=150000,isNegotiable=false} });
        Assert.Equal(HttpStatusCode.OK,saved.StatusCode);
        var current=await saved.Content.ReadFromJsonAsync<JsonElement>();
        using var stale=await Write(client,new {expectedVersion=version.GetString(),description=new {bio="Stale"}});
        Assert.Equal(HttpStatusCode.Conflict,stale.StatusCode);
        using var submitted=await Write(client,new {expectedVersion=current.GetProperty("version").GetString()},true);
        Assert.Equal(HttpStatusCode.OK,submitted.StatusCode);
        using var pending=await Write(client,new {description=new {bio="Changed during review"}});
        Assert.Equal(HttpStatusCode.Conflict,pending.StatusCode);
        await using(var scope=factory.Services.CreateAsyncScope()) {var db=scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();var p=await db.TutorProfiles.SingleAsync();p.Status=TutorProfileStatus.APPROVED;await db.SaveChangesAsync();}
        var approved=await client.GetFromJsonAsync<JsonElement>("/api/v1/tutor/onboarding/me");
        using var edited=await Write(client,new {expectedVersion=approved.GetProperty("version").GetString(),description=new {bio=complete?"Updated bio":"",experienceYears=2}});
        Assert.Equal(HttpStatusCode.OK,edited.StatusCode);
        Assert.Equal(complete?"PENDING_REVIEW":"DRAFT",(await edited.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("status").GetString());
    }
    [Theory]
    [InlineData(0)] [InlineData(-1)]
    public async Task InvalidSessionPriceIsRejectedWithoutChangingDraft(int price)
    {
        await using var factory=await fixture.CreateFactoryAsync();using var client=factory.CreateApiClient();await OnboardingContractTests.RegisterTutor(factory,client);
        using var result=await Write(client,new {pricing=new {sessionRateVnd=price,isNegotiable=false}});
        Assert.Equal(HttpStatusCode.UnprocessableEntity,result.StatusCode);
    }

    [Fact]
    public async Task LearnerAndForeignRoutesCannotEditTutorProfile()
    {
        await using var factory=await fixture.CreateFactoryAsync(); using var owner=factory.CreateApiClient();
        await OnboardingContractTests.RegisterTutor(factory,owner);
        using var learner=factory.CreateApiClient();
        await TutorMatching.Api.IntegrationTests.Authentication.SessionEndpointTests.Register(learner);
        using var login=await TutorMatching.Api.IntegrationTests.Authentication.SessionEndpointTests.Post(learner,"login",new {email="session@example.com",password="password"});
        using var denied=await Write(learner,new {description=new {bio="Forbidden"}});
        Assert.Equal(HttpStatusCode.Forbidden,denied.StatusCode);
        var csrf=await owner.GetFromJsonAsync<JsonElement>("/api/v1/auth/csrf");
        using var req=new HttpRequestMessage(HttpMethod.Put,$"/api/v1/tutor/onboarding/{Guid.NewGuid()}/draft") {Content=JsonContent.Create(new {description=new {bio="Forbidden"}})};
        req.Headers.Add("X-CSRF-TOKEN",csrf.GetProperty("requestToken").GetString());
        using var foreign=await owner.SendAsync(req);
        Assert.Equal(HttpStatusCode.NotFound,foreign.StatusCode);
        var current=await owner.GetFromJsonAsync<JsonElement>("/api/v1/tutor/onboarding/me");
        Assert.NotEqual("Forbidden",current.GetProperty("description").GetProperty("bio").GetString());
    }
    [Fact]
    public async Task CatalogValidationAndOfflineAreasAreEnforced()
    {
        await using var factory=await fixture.CreateFactoryAsync();using var client=factory.CreateApiClient();await OnboardingContractTests.RegisterTutor(factory,client);
        using var invalid=await Write(client,new {discovery=new {subjects=new[]{new {subjectId=TutorDiscoverySeed.MathId,levelCodes=new[]{"MISSING"}}},teachingModes=new[]{"ONLINE"}}});
        Assert.Equal(HttpStatusCode.UnprocessableEntity,invalid.StatusCode);
        using var invalidArea=await Write(client,new {discovery=new {provinceCode="UNKNOWN",districtCode="UNKNOWN",teachingModes=new[]{"OFFLINE"}}});
        Assert.Equal(HttpStatusCode.UnprocessableEntity,invalidArea.StatusCode);
        await using(var scope=factory.Services.CreateAsyncScope()) {var db=scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();var subject=await db.Subjects.SingleAsync(x=>x.Id==TutorDiscoverySeed.MathId);subject.IsActive=false;await db.SaveChangesAsync();}
        using var inactive=await Write(client,new {discovery=new {subjects=new[]{new {subjectId=TutorDiscoverySeed.MathId,levelCodes=new[]{"HIGH_SCHOOL"}}}}});
        Assert.Equal(HttpStatusCode.UnprocessableEntity,inactive.StatusCode);
    }

    [Fact]
    public async Task SubjectWithoutLevelsCanRemainAnIncompleteDraft()
    {
        await using var factory=await fixture.CreateFactoryAsync();using var client=factory.CreateApiClient();await OnboardingContractTests.RegisterTutor(factory,client);
        using var saved=await Write(client,new {discovery=new {subjects=new[]{new {subjectId=TutorDiscoverySeed.MathId,levelCodes=Array.Empty<string>()}}}});
        Assert.Equal(HttpStatusCode.OK,saved.StatusCode);
        var data=await saved.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Single(data.GetProperty("discovery").GetProperty("subjects").EnumerateArray());
        using var rejected=await Write(client,new {expectedVersion=data.GetProperty("version").GetString()},true);
        Assert.Equal(HttpStatusCode.UnprocessableEntity,rejected.StatusCode);
    }
    internal static async Task<HttpResponseMessage> Write(HttpClient client,object body,bool submit=false)
    {
        var csrf=await client.GetFromJsonAsync<JsonElement>("/api/v1/auth/csrf");
        using var request=new HttpRequestMessage(submit?HttpMethod.Post:HttpMethod.Put,"/api/v1/tutor/onboarding/"+(submit?"submit":"draft")){Content=JsonContent.Create(body)};
        request.Headers.Add("X-CSRF-TOKEN",csrf.GetProperty("requestToken").GetString());return await client.SendAsync(request);
    }
}
