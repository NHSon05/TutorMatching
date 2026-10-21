using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using TutorMatching.Api.IntegrationTests.Authentication;
using TutorMatching.Api.IntegrationTests.Fixtures;
using TutorMatching.Domain.Users;
using TutorMatching.Infrastructure.Persistence;
namespace TutorMatching.Api.IntegrationTests.Tutors;
[Collection("PostgreSQL API")]
public sealed class CatalogEndpointTests(PostgreSqlFixture fixture)
{
    [Fact]
    public async Task AdminCanMaintainCatalogsAndPublicSeesOnlyActiveValues()
    {
        await using var factory=await fixture.CreateFactoryAsync();
        using var client=factory.CreateApiClient();
        using var anonymous=await client.PostAsJsonAsync("/api/v1/admin/catalog/provinces",new {code="TEST",name="Test",isActive=true});
        Assert.Equal(HttpStatusCode.Unauthorized,anonymous.StatusCode);
        await using(var scope=factory.Services.CreateAsyncScope())
        {
            var manager=scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            Assert.True((await manager.CreateAsync(new ApplicationUser {Id=Guid.NewGuid(),UserName="catalog@example.test",Email="catalog@example.test",FullName="Catalog Admin",Role=AccountRole.ADMIN},"password")).Succeeded);
        }
        using var login=await SessionEndpointTests.Post(client,"login",new {email="catalog@example.test",password="password"});
        Assert.Equal(HttpStatusCode.OK,login.StatusCode);
        using var created=await Write(client,"provinces",null,new {code="TEST",name="Test Province",isActive=true});
        Assert.Equal(HttpStatusCode.OK,created.StatusCode);
        using var duplicate=await Write(client,"provinces",null,new {code="TEST",name="Duplicate",isActive=true});
        Assert.Equal(HttpStatusCode.Conflict,duplicate.StatusCode);
        using var invalid=await Write(client,"districts",null,new {code="D1",name="District",provinceCode="MISSING",isActive=true});
        Assert.Equal(HttpStatusCode.UnprocessableEntity,invalid.StatusCode);
        using var district=await Write(client,"districts",null,new {code="D1",name="District",provinceCode="TEST",isActive=true});
        Assert.Equal(HttpStatusCode.OK,district.StatusCode);
        using var hidden=await Write(client,"provinces","TEST",new {code="TEST",name="Test Province",isActive=false});
        Assert.Equal(HttpStatusCode.OK,hidden.StatusCode);
        var publicRows=await client.GetFromJsonAsync<JsonElement>("/api/v1/catalog/provinces");
        Assert.DoesNotContain(publicRows.EnumerateArray(),r=>r.GetProperty("code").GetString()=="TEST");
        var adminRows=await client.GetFromJsonAsync<JsonElement>("/api/v1/admin/catalog/provinces");
        Assert.Contains(adminRows.EnumerateArray(),r=>r.GetProperty("code").GetString()=="TEST");
        var id=Guid.NewGuid().ToString();
        using var subject=await Write(client,"subjects",null,new {code=id,name="Catalog Subject",isActive=true});
        Assert.Equal(HttpStatusCode.OK,subject.StatusCode);
        using var renamed=await Write(client,"subjects",id,new {code=id,name="Renamed Subject",isActive=false});
        Assert.Equal(HttpStatusCode.OK,renamed.StatusCode);
    }
    private static async Task<HttpResponseMessage> Write(HttpClient client,string kind,string? code,object body)
    {
        var csrf=await client.GetFromJsonAsync<JsonElement>("/api/v1/auth/csrf");
        using var req=new HttpRequestMessage(code==null?HttpMethod.Post:HttpMethod.Put,"/api/v1/admin/catalog/"+kind+(code==null?"":"/"+code)){Content=JsonContent.Create(body)};
        req.Headers.Add("X-CSRF-TOKEN",csrf.GetProperty("requestToken").GetString());
        return await client.SendAsync(req);
    }
}
