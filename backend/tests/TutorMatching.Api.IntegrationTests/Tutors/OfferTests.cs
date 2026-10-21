using Microsoft.AspNetCore.Identity;
using TutorMatching.Api.IntegrationTests.Authentication;
using TutorMatching.Domain.Users;
using TutorMatching.Domain.Courses;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorMatching.Api.IntegrationTests.Fixtures;
using TutorMatching.Infrastructure.Persistence;
using TutorMatching.Domain.Tutors;
namespace TutorMatching.Api.IntegrationTests.Tutors;
[Collection("PostgreSQL API")]
public sealed class OfferTests(PostgreSqlFixture fixture)
{
    [Fact] public async Task ConcurrentOverlapsSerializeAndAdjacentSlotsRemainLegal()
    {
        await using var factory=await fixture.CreateFactoryAsync();using var client=factory.CreateApiClient();await OnboardingContractTests.RegisterTutor(factory,client);
        using var profile=await client.GetAsync("/api/v1/tutor/onboarding/me");
        var body=new {dayOfWeek=1,startTime="18:00",endTime="19:00"};
        var responses=await Task.WhenAll(Send(client,"availability",HttpMethod.Post,body),Send(client,"availability",HttpMethod.Post,body));
        try {Assert.Single(responses,r=>r.StatusCode==HttpStatusCode.OK);Assert.Single(responses,r=>r.StatusCode==HttpStatusCode.Conflict);}finally{foreach(var r in responses)r.Dispose();}
        using var adjacent=await Send(client,"availability",HttpMethod.Post,new {dayOfWeek=1,startTime="19:00",endTime="20:00"});Assert.Equal(HttpStatusCode.OK,adjacent.StatusCode);
        var id=(await adjacent.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
        using var overlapEdit=await Send(client,$"availability/{id}",HttpMethod.Put,new {dayOfWeek=1,startTime="18:30",endTime="20:00"});Assert.Equal(HttpStatusCode.Conflict,overlapEdit.StatusCode);
        using var invalid=await Send(client,"availability",HttpMethod.Post,new {dayOfWeek=8,startTime="20:00",endTime="18:00"});Assert.Equal(HttpStatusCode.UnprocessableEntity,invalid.StatusCode);
        using var removed=await Send(client,$"availability/{id}",HttpMethod.Delete,null);Assert.Equal(HttpStatusCode.NoContent,removed.StatusCode);
        var rows=await client.GetFromJsonAsync<JsonElement>("/api/v1/tutor/availability");Assert.Single(rows.EnumerateArray());
    }
    [Fact] public async Task CourseValidationOwnershipAndSoftDeletePreserveData()
    {
        await using var factory=await fixture.CreateFactoryAsync();using var owner=factory.CreateApiClient();await OnboardingContractTests.RegisterTutor(factory,owner);
        using var initialized=await owner.GetAsync("/api/v1/tutor/onboarding/me");
        using var unlinked=await Send(owner,"courses",HttpMethod.Post,new {subjectId=TutorDiscoverySeed.MathId,name="Course",content="Content",sessionCount=8,pricePerSessionVnd=100000,status="ACTIVE"});Assert.Equal(HttpStatusCode.UnprocessableEntity,unlinked.StatusCode);
        Assert.True((await unlinked.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").TryGetProperty("subjectId",out _));
        await using(var scope=factory.Services.CreateAsyncScope()){var db=scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();var p=await db.TutorProfiles.SingleAsync();db.Add(new TutorSubject{TutorProfileId=p.Id,SubjectId=TutorDiscoverySeed.MathId,CreatedAt=DateTimeOffset.UtcNow});await db.SaveChangesAsync();}
        using var invalid=await Send(owner,"courses",HttpMethod.Post,new {subjectId=TutorDiscoverySeed.MathId,name="Course",content="Content",sessionCount=0,pricePerSessionVnd=100000,status="ACTIVE"});Assert.Equal(HttpStatusCode.UnprocessableEntity,invalid.StatusCode);
        using var created=await Send(owner,"courses",HttpMethod.Post,new {subjectId=TutorDiscoverySeed.MathId,name="Course",content="Content",sessionCount=8,pricePerSessionVnd=100000,status="ACTIVE"});Assert.Equal(HttpStatusCode.OK,created.StatusCode);
        var id=(await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
        await using(var scope=factory.Services.CreateAsyncScope()){var db=scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();var subject=await db.Subjects.SingleAsync(s=>s.Id==TutorDiscoverySeed.MathId);subject.IsActive=false;await db.SaveChangesAsync();}
        using var inactive=await Send(owner,$"courses/{id}",HttpMethod.Put,new {subjectId=TutorDiscoverySeed.MathId,name="Course",content="Content",sessionCount=8,pricePerSessionVnd=100000,status="ACTIVE"});Assert.Equal(HttpStatusCode.UnprocessableEntity,inactive.StatusCode);
        using var hide=await Send(owner,$"courses/{id}",HttpMethod.Put,new {subjectId=TutorDiscoverySeed.MathId,name="Course",content="Content",sessionCount=8,pricePerSessionVnd=100000,status="HIDDEN"});Assert.Equal(HttpStatusCode.OK,hide.StatusCode);
        using var foreign=await Send(owner,$"courses/{Guid.NewGuid()}",HttpMethod.Delete,null);Assert.Equal(HttpStatusCode.NotFound,foreign.StatusCode);
        using var deleted=await Send(owner,$"courses/{id}",HttpMethod.Delete,null);Assert.Equal(HttpStatusCode.NoContent,deleted.StatusCode);
        var rows=await owner.GetFromJsonAsync<JsonElement>("/api/v1/tutor/courses");Assert.Empty(rows.EnumerateArray());
        await using var check=factory.Services.CreateAsyncScope();var persisted=await check.ServiceProvider.GetRequiredService<ApplicationDbContext>().Courses.SingleAsync(c=>c.Id==id);Assert.NotNull(persisted.DeletedAt);Assert.Equal("HIDDEN",persisted.StatusCode);
    }

    [Theory] [InlineData(AccountRole.LEARNER)] [InlineData(AccountRole.ADMIN)]
    public async Task NonTutorRolesCannotUseOfferApis(AccountRole role)
    {
        await using var factory=await fixture.CreateFactoryAsync();using var client=factory.CreateApiClient();
        using(var anon=await client.GetAsync("/api/v1/tutor/availability"))Assert.Equal(HttpStatusCode.Unauthorized,anon.StatusCode);
        await using(var scope=factory.Services.CreateAsyncScope()){var manager=scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();Assert.True((await manager.CreateAsync(new ApplicationUser{Id=Guid.NewGuid(),UserName="other-role@example.test",Email="other-role@example.test",FullName="Other Role",Role=role},"password")).Succeeded);}
        using var login=await SessionEndpointTests.Post(client,"login",new {email="other-role@example.test",password="password"});Assert.Equal(HttpStatusCode.OK,login.StatusCode);
        foreach(var path in new[]{"availability","courses"}){using var denied=await client.GetAsync("/api/v1/tutor/"+path);Assert.Equal(HttpStatusCode.Forbidden,denied.StatusCode);}
        using var write=await Send(client,"availability",HttpMethod.Post,new{dayOfWeek=1,startTime="18:00",endTime="19:00"});Assert.Equal(HttpStatusCode.Forbidden,write.StatusCode);
    }
    [Fact] public async Task AnotherTutorCannotReadOrModifyAnExistingOffer()
    {
        await using var factory=await fixture.CreateFactoryAsync();using var owner=factory.CreateApiClient();await OnboardingContractTests.RegisterTutor(factory,owner);
        using var initialized=await owner.GetAsync("/api/v1/tutor/onboarding/me");
        using var created=await Send(owner,"availability",HttpMethod.Post,new{dayOfWeek=1,startTime="18:00",endTime="19:00"});Assert.Equal(HttpStatusCode.OK,created.StatusCode);var slotId=(await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
        var courseId=Guid.NewGuid();await using(var scope=factory.Services.CreateAsyncScope()){var db=scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();var profile=await db.TutorProfiles.SingleAsync();db.Add(new Course{Id=courseId,TutorProfileId=profile.Id,SubjectId=TutorDiscoverySeed.MathId,Name="Owner Course",Description="Content",SessionCount=1,PricePerSessionVnd=100000,CreatedAt=DateTimeOffset.UtcNow,UpdatedAt=DateTimeOffset.UtcNow});await db.SaveChangesAsync();}
        using var other=factory.CreateApiClient();using var registered=await SessionEndpointTests.Post(other,"register",new{fullName="Other Tutor",email="other-tutor@example.test",role="TUTOR",phoneNumber=(string?)null,password="password",passwordConfirmation="password"});Assert.Equal(HttpStatusCode.Created,registered.StatusCode);
        using var login=await SessionEndpointTests.Post(other,"login",new{email="other-tutor@example.test",password="password"});Assert.Equal(HttpStatusCode.OK,login.StatusCode);
        Assert.Empty((await other.GetFromJsonAsync<JsonElement>("/api/v1/tutor/courses")).EnumerateArray());
        using var slot=await Send(other,$"availability/{slotId}",HttpMethod.Delete,null);Assert.Equal(HttpStatusCode.NotFound,slot.StatusCode);
        using var course=await Send(other,$"courses/{courseId}",HttpMethod.Delete,null);Assert.Equal(HttpStatusCode.NotFound,course.StatusCode);
        using var edit=await Send(other,$"availability/{slotId}",HttpMethod.Put,new{dayOfWeek=1,startTime="20:00",endTime="21:00"});Assert.Equal(HttpStatusCode.NotFound,edit.StatusCode);
        await using var check=factory.Services.CreateAsyncScope();Assert.Null((await check.ServiceProvider.GetRequiredService<ApplicationDbContext>().Courses.SingleAsync(c=>c.Id==courseId)).DeletedAt);
    }
    private static async Task<HttpResponseMessage> Send(HttpClient client,string path,HttpMethod method,object? body)
    {
        var csrf=await client.GetFromJsonAsync<JsonElement>("/api/v1/auth/csrf");using var request=new HttpRequestMessage(method,"/api/v1/tutor/"+path);
        if(body is not null)request.Content=JsonContent.Create(body);request.Headers.Add("X-CSRF-TOKEN",csrf.GetProperty("requestToken").GetString());return await client.SendAsync(request);
    }
}
