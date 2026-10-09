using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorMatching.Api.IntegrationTests.Fixtures;
using TutorMatching.Application.Abstractions;
using TutorMatching.Application.Authentication.Register;
using TutorMatching.Infrastructure.Authentication;
using TutorMatching.Domain.Users;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Api.IntegrationTests.Authentication;

[Collection("PostgreSQL API")]
public sealed class RegisterEndpointTests(PostgreSqlFixture fixture)
{
    [Theory]
    [InlineData("LEARNER")]
    [InlineData("TUTOR")]
    public async Task RegisterCreatesAnActiveAccountWithoutCredentialData(string role)
    {
        await using var factory = await fixture.CreateFactoryAsync();
        using var client = factory.CreateApiClient();
        var email = $"{role.ToLowerInvariant()}-{Guid.NewGuid():N}@example.com";

        using var response = await RegisterAsync(client, email, role: role);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        Assert.Contains($"\"email\":\"{email}\"", json);
        Assert.Contains($"\"role\":\"{role}\"", json);
        Assert.Contains("\"status\":\"ACTIVE\"", json);
        Assert.DoesNotContain("password", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("token", json, StringComparison.OrdinalIgnoreCase);

        await using var scope = factory.Services.CreateAsyncScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var user = await userManager.FindByEmailAsync(email);
        Assert.NotNull(user);
        Assert.Equal(AccountStatus.ACTIVE, user.Status);
        Assert.True(await userManager.IsInRoleAsync(user, role));
        Assert.False(string.IsNullOrWhiteSpace(user.PasswordHash));
    }

    [Fact]
    public async Task NormalizedDuplicateEmailReturnsConflictAndDoesNotCreateAnotherAccount()
    {
        await using var factory = await fixture.CreateFactoryAsync();
        using var client = factory.CreateApiClient();
        var email = $"duplicate-{Guid.NewGuid():N}@example.com";
        using var first = await RegisterAsync(client, email);
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);

        using var duplicate = await RegisterAsync(client, $"  {email.ToUpperInvariant()}  ");

        Assert.Equal(HttpStatusCode.Conflict, duplicate.StatusCode);
        await using var scope = factory.Services.CreateAsyncScope();
        var normalized = email.ToUpperInvariant();
        var count = await scope.ServiceProvider.GetRequiredService<ApplicationDbContext>()
            .Users.CountAsync(user => user.NormalizedEmail == normalized);
        Assert.Equal(1, count);
    }

    [Fact]
    public async Task RegisterPersistsTrimmedPhoneNumberAndRejectsDuplicate()
    {
        await using var factory = await fixture.CreateFactoryAsync();
        using var client = factory.CreateApiClient();
        var phoneNumber = $"+84{Random.Shared.NextInt64(100000000, 999999999)}";

        using var first = await RegisterAsync(
            client,
            $"phone-first-{Guid.NewGuid():N}@example.com",
            phoneNumber: $"  {phoneNumber}  ");
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);

        using var duplicate = await RegisterAsync(
            client,
            $"phone-second-{Guid.NewGuid():N}@example.com",
            phoneNumber: phoneNumber);

        Assert.Equal(HttpStatusCode.Conflict, duplicate.StatusCode);
        await using var scope = factory.Services.CreateAsyncScope();
        Assert.Equal(1, await scope.ServiceProvider.GetRequiredService<ApplicationDbContext>()
            .Users.CountAsync(user => user.PhoneNumber == phoneNumber));
    }

    [Fact]
    public async Task InvalidInputReturnsValidationProblemWithoutCreatingAnAccount()
    {
        await using var factory = await fixture.CreateFactoryAsync();
        using var client = factory.CreateApiClient();

        using var response = await RegisterAsync(client, "not-an-email", password: "short",
            passwordConfirmation: "different");

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        await using var scope = factory.Services.CreateAsyncScope();
        Assert.Empty(await scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().Users.ToListAsync());
    }

    [Fact]
    public async Task AdminRoleTamperingIsDeniedAndCreatesNoAccount()
    {
        await using var factory = await fixture.CreateFactoryAsync();
        using var client = factory.CreateApiClient();

        using var response = await RegisterAsync(client, $"admin-{Guid.NewGuid():N}@example.com", role: "ADMIN");

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        await using var scope = factory.Services.CreateAsyncScope();
        Assert.Empty(await scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().Users.ToListAsync());
    }

    [Fact]
    public async Task OversizedEmailReturnsFieldValidationWithoutCreatingAnAccount()
    {
        await using var factory = await fixture.CreateFactoryAsync();
        using var client = factory.CreateApiClient();

        using var response = await RegisterAsync(client, new string('a', 250) + "@example.com");

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        using var body = System.Text.Json.JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.True(body.RootElement.GetProperty("errors").TryGetProperty("email", out _));
        await using var scope = factory.Services.CreateAsyncScope();
        Assert.Empty(await scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().Users.ToListAsync());
    }

    [Fact]
    public async Task OversizedPasswordReturnsFieldValidationWithoutCreatingAnAccount()
    {
        await using var factory = await fixture.CreateFactoryAsync();
        using var client = factory.CreateApiClient();
        var oversizedPassword = new string('a', RegisterAccountHandler.MaximumPasswordLength + 1);

        using var response = await RegisterAsync(
            client,
            $"oversized-password-{Guid.NewGuid():N}@example.com",
            password: oversizedPassword,
            passwordConfirmation: oversizedPassword);

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        using var body = System.Text.Json.JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.True(body.RootElement.GetProperty("errors").TryGetProperty("password", out _));
        await using var scope = factory.Services.CreateAsyncScope();
        Assert.Empty(await scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().Users.ToListAsync());
    }

    [Fact]
    public async Task AuditFailureRollsBackAccountRoleAndAuditTogether()
    {
        await using var factory = await fixture.CreateFactoryAsync();
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var services = scope.ServiceProvider;
            var service = new IdentityAccountService(
                services.GetRequiredService<UserManager<ApplicationUser>>(),
                services.GetRequiredService<ApplicationDbContext>(),
                services.GetRequiredService<IClock>(),
                new FailingAuditWriter(services.GetRequiredService<IAuditWriter>()));

            var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                service.RegisterAsync("Test Learner", "audit-failure@example.com", null, "password", AccountRole.LEARNER));
            Assert.Equal("Simulated audit failure", exception.Message);
        }

        await using var verification = factory.Services.CreateAsyncScope();
        var db = verification.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        Assert.Empty(await db.Users.ToListAsync());
        Assert.Empty(await db.UserRoles.ToListAsync());
        Assert.Empty(await db.AuditEvents.ToListAsync());
    }

    private sealed class FailingAuditWriter(IAuditWriter inner) : IAuditWriter
    {
        public async Task WriteAsync(AccountAuditEntry entry, CancellationToken cancellationToken = default)
        {
            await inner.WriteAsync(entry, cancellationToken);
            throw new InvalidOperationException("Simulated audit failure");
        }
    }

    private static async Task<HttpResponseMessage> RegisterAsync(HttpClient client, string email,
        string role = "LEARNER", string password = "password", string passwordConfirmation = "password",
        string? phoneNumber = null)
    {
        using var csrfResponse = await client.GetAsync("/api/v1/auth/csrf");
        csrfResponse.EnsureSuccessStatusCode();
        var csrf = await csrfResponse.Content.ReadFromJsonAsync<CsrfResponse>();
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/register")
        {
            Content = JsonContent.Create(new
            {
                fullName = "Nguyen Van A",
                email,
                phoneNumber,
                password,
                passwordConfirmation,
                role
            })
        };
        request.Headers.Add(csrf!.HeaderName, csrf.RequestToken);
        return await client.SendAsync(request);
    }

    private sealed record CsrfResponse(string RequestToken, string HeaderName);
}
