using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorMatching.Api.IntegrationTests.Fixtures;
using TutorMatching.Domain.Courses;
using TutorMatching.Domain.Tutors;
using TutorMatching.Domain.Users;
using TutorMatching.Infrastructure.Persistence;
namespace TutorMatching.Api.IntegrationTests.Tutors;
[Collection("PostgreSQL API")]
public sealed class TutorDetailTests(PostgreSqlFixture fixture)
{
    [Fact] public async Task ShowsOnlyPublicFieldsAndActiveOffersUsingProfileId()
    {
        await using var factory=await fixture.CreateFactoryAsync(); var ids=await TutorSearchTests.Seed(factory); Guid userId;
        await using(var scope=factory.Services.CreateAsyncScope()) {
            var db=scope.ServiceProvider.GetRequiredService<ApplicationDbContext>(); var p=await db.TutorProfiles.SingleAsync(x=>x.Id==ids[0]); userId=p.UserId;
            p.Certifications=[new TutorCertification{Name="Private certificate",Issuer="Issuer",FileUrl="/uploads/certificates/secret.pdf"}];
            foreach(var (status,deleted) in new[]{("ACTIVE",false),("HIDDEN",false),("ACTIVE",true)}) db.Courses.Add(new Course{Id=Guid.NewGuid(),TutorProfileId=p.Id,SubjectId=TutorDiscoverySeed.MathId,Name=status+(deleted?" deleted":""),Description="Nội dung",SessionCount=8,PricePerSessionVnd=150000,StatusCode=status,DeletedAt=deleted?DateTimeOffset.UtcNow:null});
            db.AvailabilitySlots.Add(new AvailabilitySlot{Id=Guid.NewGuid(),TutorProfileId=p.Id,DayOfWeek=2,StartTime=new(18,0),EndTime=new(20,0),IsActive=false});
            db.AvailabilitySlots.Add(new AvailabilitySlot{Id=Guid.NewGuid(),TutorProfileId=p.Id,AvailabilityType="DATED",SpecificDate=DateOnly.FromDateTime(DateTime.UtcNow),StartTime=new(18,0),EndTime=new(20,0)});
            await db.SaveChangesAsync();
        }
        using var client=factory.CreateApiClient(); using var response=await client.GetAsync($"/api/v1/tutors/{ids[0]}"); Assert.Equal(HttpStatusCode.OK,response.StatusCode);Assert.True(response.Headers.CacheControl?.NoStore);
        var body=await response.Content.ReadFromJsonAsync<JsonElement>();
        var expected=new[]{"id","displayName","avatarUrl","bio","qualification","schoolName","specialization","experienceYears","teachingMethodology","achievements","sessionRateVnd","teachingModes","provinceCode","provinceName","districtCode","districtName","subjects","approvedAt","availability","courses"};
        Assert.Equal(expected.Order(),body.EnumerateObject().Select(x=>x.Name).Order());
        Assert.Equal(2,body.GetProperty("availability").GetArrayLength());Assert.Equal("Asia/Ho_Chi_Minh",body.GetProperty("availability")[0].GetProperty("timeZone").GetString());
        Assert.Equal("ACTIVE",Assert.Single(body.GetProperty("courses").EnumerateArray()).GetProperty("name").GetString());
        Assert.DoesNotContain("secret.pdf",body.ToString());Assert.DoesNotContain("email",body.ToString(),StringComparison.OrdinalIgnoreCase);Assert.DoesNotContain("phone",body.ToString(),StringComparison.OrdinalIgnoreCase);
        using var legacy=await client.GetAsync($"/api/v1/tutors/{userId}");Assert.Equal(HttpStatusCode.NotFound,legacy.StatusCode);
    }
    [Theory][InlineData("draft")][InlineData("pending")][InlineData("rejected")][InlineData("locked")][InlineData("inactive")][InlineData("subjects")]
    public async Task PreviouslyVisibleProfileBecomesUnavailable(string reason)
    {
        await using var factory=await fixture.CreateFactoryAsync();var ids=await TutorSearchTests.Seed(factory);using var client=factory.CreateApiClient();using var before=await client.GetAsync($"/api/v1/tutors/{ids[0]}");Assert.Equal(HttpStatusCode.OK,before.StatusCode);
        await using(var scope=factory.Services.CreateAsyncScope()) {
            var db=scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();var p=await db.TutorProfiles.SingleAsync(x=>x.Id==ids[0]);
            if(reason=="subjects")foreach(var s in await db.Subjects.ToListAsync())s.IsActive=false;
            else if(reason is "locked" or "inactive"){var u=await db.Users.SingleAsync(x=>x.Id==p.UserId);u.Status=reason=="locked"?AccountStatus.LOCKED:AccountStatus.INACTIVE;}
            else p.Status=reason switch{"draft"=>TutorProfileStatus.DRAFT,"pending"=>TutorProfileStatus.PENDING_REVIEW,_=>TutorProfileStatus.REJECTED};
            await db.SaveChangesAsync();
        }
        using var after=await client.GetAsync($"/api/v1/tutors/{ids[0]}");Assert.Equal(HttpStatusCode.NotFound,after.StatusCode);Assert.True(after.Headers.CacheControl?.NoStore);
    }
    [Fact] public async Task OmitsCoursesForDeactivatedSubjects()
    {
        await using var factory=await fixture.CreateFactoryAsync();var ids=await TutorSearchTests.Seed(factory);
        await using(var scope=factory.Services.CreateAsyncScope()){var db=scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();var s=await db.Subjects.SingleAsync(x=>x.Id==TutorSearchTests.English);s.IsActive=false;db.Courses.Add(new Course{Id=Guid.NewGuid(),TutorProfileId=ids[0],SubjectId=s.Id,Name="Hidden by catalog",Description="Content",SessionCount=2,PricePerSessionVnd=100000});await db.SaveChangesAsync();}
        using var client=factory.CreateApiClient();var body=await client.GetFromJsonAsync<JsonElement>($"/api/v1/tutors/{ids[0]}");Assert.Empty(body.GetProperty("courses").EnumerateArray());Assert.Single(body.GetProperty("subjects").EnumerateArray());
    }
}
