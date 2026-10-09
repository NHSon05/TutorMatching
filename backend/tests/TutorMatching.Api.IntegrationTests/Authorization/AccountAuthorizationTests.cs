using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using TutorMatching.Api.IntegrationTests.Authentication;
using TutorMatching.Api.IntegrationTests.Fixtures;
using TutorMatching.Domain.Users;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Api.IntegrationTests.Authorization;

[Collection("PostgreSQL API")]
public sealed class AccountAuthorizationTests(PostgreSqlFixture fixture)
{
    [Fact]
    public async Task ServerRejectsVisitorWrongRoleAndIgnoresSuppliedOwner()
    {
        await using var factory = await fixture.CreateFactoryAsync();
        using var client = factory.CreateApiClient();
        using var anonymous = await client.GetAsync("/api/v1/users/me");
        Assert.Equal(HttpStatusCode.Unauthorized, anonymous.StatusCode);
        await SessionEndpointTests.Register(client);
        using var login = await SessionEndpointTests.Post(client, "login", new { email = "session@example.com", password = "password" });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        using var denied = await client.GetAsync("/api/v1/users/me/access/ADMIN");
        Assert.Equal(HttpStatusCode.Forbidden, denied.StatusCode);
        using var allowed = await client.GetAsync("/api/v1/users/me/access/LEARNER");
        Assert.Equal(HttpStatusCode.NoContent, allowed.StatusCode);
        var foreign = Guid.NewGuid();
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var manager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            Assert.True((await manager.CreateAsync(new ApplicationUser
            {
                Id = foreign,
                UserName = "other@example.com",
                Email = "other@example.com",
                FullName = "Other Owner"
            }, "password")).Succeeded);
        }
        var profile = await client.GetFromJsonAsync<System.Text.Json.JsonElement>($"/api/v1/users/me?userId={foreign}");
        Assert.NotEqual(foreign, profile.GetProperty("id").GetGuid());
        using var foreignRoute = await client.GetAsync($"/api/v1/users/{foreign}");
        Assert.Equal(HttpStatusCode.NotFound, foreignRoute.StatusCode);
        var csrf = await client.GetFromJsonAsync<System.Text.Json.JsonElement>("/api/v1/auth/csrf");
        using var mutation = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/users/{foreign}")
        {
            Content = JsonContent.Create(new { fullName = "Tampered Owner" })
        };
        mutation.Headers.Add("X-CSRF-TOKEN", csrf.GetProperty("requestToken").GetString());
        using var rejected = await client.SendAsync(mutation);
        Assert.Equal(HttpStatusCode.NotFound, rejected.StatusCode);
        await using var verification = factory.Services.CreateAsyncScope();
        var target = await verification.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>().FindByIdAsync(foreign.ToString());
        Assert.Equal("Other Owner", target!.FullName);
    }

    [Theory]
    [InlineData(AccountStatus.LOCKED)]
    [InlineData(AccountStatus.INACTIVE)]
    public async Task DisabledAccountsCannotLoginOrReuseAnExistingSession(AccountStatus status)
    {
        await using var factory = await fixture.CreateFactoryAsync();
        using var client = factory.CreateApiClient();
        await SessionEndpointTests.Register(client);
        using var login = await SessionEndpointTests.Post(client, "login", new { email = "session@example.com", password = "password" });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var manager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var user = (await manager.FindByEmailAsync("session@example.com"))!;
            user.Status = status;
            Assert.True((await manager.UpdateAsync(user)).Succeeded);
        }
        using var denied = await client.GetAsync("/api/v1/users/me");
        Assert.Equal(HttpStatusCode.Unauthorized, denied.StatusCode);
        using var relogin = await SessionEndpointTests.Post(client, "login", new { email = "session@example.com", password = "password" });
        Assert.Equal(HttpStatusCode.Unauthorized, relogin.StatusCode);
    }
}
