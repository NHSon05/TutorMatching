using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using TutorMatching.Api.IntegrationTests.Authentication;
using TutorMatching.Api.IntegrationTests.Fixtures;
using TutorMatching.Application.Abstractions;
using TutorMatching.Domain.Tutors;
using TutorMatching.Domain.Users;
using TutorMatching.Infrastructure.Authentication;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Api.IntegrationTests.Users;

[Collection("PostgreSQL API")]
public sealed class CurrentProfileEndpointTests(PostgreSqlFixture fixture)
{
    [Theory]
    [InlineData("LEARNER")]
    [InlineData("TUTOR")]
    public async Task OwnProfileUpdatePersistsAndOptionalFieldsCanBeCleared(string role)
    {
        await using var factory = await fixture.CreateFactoryAsync();
        using var client = factory.CreateApiClient();
        await RegisterAndLogin(client, "owner@example.com", role);
        var before = await ReadProfile(client);
        Assert.Equal(role, before.GetProperty("role").GetString());

        using var updated = await Put(client, new
        {
            fullName = "  Updated Owner  ", phoneNumber = "  +84912345678  ",
            dateOfBirth = "2000-01-02", avatarUrl = "/uploads/avatars/profile.jpg"
        });
        Assert.Equal(HttpStatusCode.OK, updated.StatusCode);
        Assert.True(updated.Headers.CacheControl?.NoStore);
        var profile = await ReadProfile(client);
        Assert.Equal("Updated Owner", profile.GetProperty("fullName").GetString());
        Assert.Equal("+84912345678", profile.GetProperty("phoneNumber").GetString());
        Assert.Equal("2000-01-02", profile.GetProperty("dateOfBirth").GetString());
        Assert.Equal("/uploads/avatars/profile.jpg", profile.GetProperty("avatarUrl").GetString());
        Assert.Equal(before.GetProperty("id").GetGuid(), profile.GetProperty("id").GetGuid());
        Assert.Equal("owner@example.com", profile.GetProperty("email").GetString());
        Assert.Equal(before.GetProperty("tutorProfileStatus").ToString(), profile.GetProperty("tutorProfileStatus").ToString());
        AssertNoSecrets(profile);

        using var cleared = await Put(client, new { fullName = "Updated Owner" });
        Assert.Equal(HttpStatusCode.OK, cleared.StatusCode);
        var reloaded = await ReadProfile(client);
        foreach (var field in new[] { "phoneNumber", "dateOfBirth", "avatarUrl" })
            Assert.Equal(JsonValueKind.Null, reloaded.GetProperty(field).ValueKind);
        await using var scope = factory.Services.CreateAsyncScope();
        var audits = await scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().AuditEvents
            .Where(e => e.Action == "ProfileUpdated").ToListAsync();
        Assert.Equal(2, audits.Count);
        Assert.All(audits, audit => Assert.Equal(before.GetProperty("id").GetGuid(), audit.ActorUserId));
    }

    [Theory]
    [InlineData("LEARNER", "TUTOR")]
    [InlineData("TUTOR", "LEARNER")]
    public async Task DuplicatePhoneRollsBackEveryField(string role, string otherRole)
    {
        await using var factory = await fixture.CreateFactoryAsync();
        using var owner = factory.CreateApiClient();
        using var other = factory.CreateApiClient();
        await RegisterAndLogin(owner, "owner@example.com", role);
        await RegisterAndLogin(other, "other@example.com", otherRole, "+84900000000");
        var before = await ReadProfile(owner);
        using var response = await Put(owner, new
        {
            fullName = "Must Not Persist", phoneNumber = "  +84900000000  ",
            dateOfBirth = "2001-01-01", avatarUrl = "https://example.com/new.jpg"
        });
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal(before.ToString(), (await ReadProfile(owner)).ToString());
        await using var scope = factory.Services.CreateAsyncScope();
        Assert.Empty(await scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().AuditEvents
            .Where(e => e.Action == "ProfileUpdated").ToListAsync());
    }

    [Fact]
    public async Task KeepingOwnPhoneIsAllowedAndInvalidFieldsAreAtomic()
    {
        await using var factory = await fixture.CreateFactoryAsync();
        using var client = factory.CreateApiClient();
        await RegisterAndLogin(client, "owner@example.com", "LEARNER", "+84900000000");
        using var samePhone = await Put(client, new { fullName = "Same Phone", phoneNumber = "+84900000000" });
        Assert.Equal(HttpStatusCode.OK, samePhone.StatusCode);
        var before = await ReadProfile(client);
        using var invalid = await Put(client, new
        {
            fullName = " x ", phoneNumber = new string('1', 33),
            dateOfBirth = "9999-12-31", avatarUrl = new string('a', 2049)
        });
        Assert.Equal(HttpStatusCode.UnprocessableEntity, invalid.StatusCode);
        var errors = (await invalid.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        foreach (var field in new[] { "fullName", "phoneNumber", "dateOfBirth", "avatarUrl" })
            Assert.True(errors.TryGetProperty(field, out _));
        Assert.Equal(before.ToString(), (await ReadProfile(client)).ToString());
    }

    [Fact]
    public async Task AnonymousExpiredAndMissingCsrfCannotWrite()
    {
        await using var factory = await fixture.CreateFactoryAsync();
        using var client = factory.CreateApiClient();
        using var anonymousGet = await client.GetAsync("/api/v1/users/me");
        using var anonymousPut = await client.PutAsJsonAsync("/api/v1/users/me", new { fullName = "Denied" });
        Assert.Equal(HttpStatusCode.Unauthorized, anonymousGet.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, anonymousPut.StatusCode);
        await RegisterAndLogin(client, "owner@example.com");
        using var noCsrf = await client.PutAsJsonAsync("/api/v1/users/me", new { fullName = "Denied" });
        Assert.Equal(HttpStatusCode.BadRequest, noCsrf.StatusCode);
        var csrf = await client.GetFromJsonAsync<JsonElement>("/api/v1/auth/csrf");
        factory.Clock.Advance(TimeSpan.FromMinutes(6));
        using var expiredGet = await client.GetAsync("/api/v1/users/me");
        Assert.Equal(HttpStatusCode.Unauthorized, expiredGet.StatusCode);
        using var request = new HttpRequestMessage(HttpMethod.Put, "/api/v1/users/me")
        {
            Content = JsonContent.Create(new { fullName = "Expired Update" })
        };
        request.Headers.Add("X-CSRF-TOKEN", csrf.GetProperty("requestToken").GetString());
        using var expiredPut = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.Unauthorized, expiredPut.StatusCode);
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        Assert.Equal("Original Owner", (await db.Users.SingleAsync()).FullName);
        Assert.Empty(await db.AuditEvents.Where(e => e.Action == "ProfileUpdated").ToListAsync());
    }

    [Theory]
    [InlineData(AccountStatus.LOCKED, false)]
    [InlineData(AccountStatus.INACTIVE, false)]
    [InlineData(AccountStatus.ACTIVE, true)]
    public async Task DisabledOrDeletedAccountCannotReadOrUpdate(AccountStatus status, bool deleted)
    {
        await using var factory = await fixture.CreateFactoryAsync();
        using var client = factory.CreateApiClient();
        await RegisterAndLogin(client, "owner@example.com");
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var user = await db.Users.SingleAsync();
            user.Status = status;
            user.DeletedAt = deleted ? DateTimeOffset.UtcNow : null;
            await db.SaveChangesAsync();
        }
        using var read = await client.GetAsync("/api/v1/users/me");
        using var update = await Put(client, new { fullName = "Denied Change" });
        Assert.Equal(HttpStatusCode.Unauthorized, read.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, update.StatusCode);
        await using var verification = factory.Services.CreateAsyncScope();
        Assert.Equal("Original Owner", (await verification.ServiceProvider
            .GetRequiredService<ApplicationDbContext>().Users.SingleAsync()).FullName);
    }

    [Fact]
    public async Task MalformedBirthDateReturnsValidationErrorWithoutWriting()
    {
        await using var factory = await fixture.CreateFactoryAsync();
        using var client = factory.CreateApiClient();
        await RegisterAndLogin(client, "owner@example.com");
        var before = await ReadProfile(client);
        using var response = await Put(client, new { fullName = "Not Saved", dateOfBirth = "not-a-date" });
        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.Equal(before.ToString(), (await ReadProfile(client)).ToString());
    }

    [Fact]
    public async Task OwnerInjectionAndPrivilegedFieldsAreDenied()
    {
        await using var factory = await fixture.CreateFactoryAsync();
        using var owner = factory.CreateApiClient();
        using var other = factory.CreateApiClient();
        await RegisterAndLogin(owner, "owner@example.com");
        await RegisterAndLogin(other, "other@example.com", "TUTOR");
        var otherBefore = await ReadProfile(other);
        var id = otherBefore.GetProperty("id").GetGuid();
        foreach (var field in new[] { "userId", "id", "email", "role", "status", "passwordHash", "tutorProfileStatus" })
        {
            using var rejected = await Put(owner, new Dictionary<string, object>
            {
                ["fullName"] = "Injected Name", [field] = field is "id" or "userId" ? id.ToString() : "ADMIN"
            });
            Assert.Equal(HttpStatusCode.UnprocessableEntity, rejected.StatusCode);
        }
        using var foreignRoute = await Put(owner, new { fullName = "Foreign Name" }, $"/api/v1/users/{id}");
        Assert.Equal(HttpStatusCode.NotFound, foreignRoute.StatusCode);
        using var foreignGet = await owner.GetAsync($"/api/v1/users/{id}");
        Assert.Equal(HttpStatusCode.NotFound, foreignGet.StatusCode);
        using var query = await Put(owner, new { fullName = "Own New Name" }, $"/api/v1/users/me?userId={id}");
        Assert.Equal(HttpStatusCode.OK, query.StatusCode);
        Assert.NotEqual(id, (await query.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid());
        Assert.Equal(otherBefore.ToString(), (await ReadProfile(other)).ToString());
    }

    [Fact]
    public async Task AdminCannotUseProfileMutation()
    {
        await using var factory = await fixture.CreateFactoryAsync();
        using var client = factory.CreateApiClient();
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var manager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var user = new ApplicationUser { Id = Guid.NewGuid(), UserName = "admin@example.com",
                Email = "admin@example.com", FullName = "Existing Admin" };
            Assert.True((await manager.CreateAsync(user, "password")).Succeeded);
            Assert.True((await manager.AddToRoleAsync(user, "ADMIN")).Succeeded);
        }
        using var login = await SessionEndpointTests.Post(client, "login", new { email = "admin@example.com", password = "password" });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        var before = await ReadProfile(client);
        using var denied = await Put(client, new { fullName = "Denied Admin" });
        Assert.Equal(HttpStatusCode.Forbidden, denied.StatusCode);
        Assert.Equal(before.ToString(), (await ReadProfile(client)).ToString());
    }

    [Fact]
    public async Task PublicTutorResponsesDoNotExposePrivateAccountFields()
    {
        await using var factory = await fixture.CreateFactoryAsync();
        using var owner = factory.CreateApiClient();
        await RegisterAndLogin(owner, "private@example.com", "TUTOR", "+84900000000");
        Guid profileId;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var tutor = await db.TutorProfiles.SingleAsync();
            profileId = tutor.Id;
            tutor.Status = TutorProfileStatus.APPROVED;
            tutor.SessionRateVnd = 150000;
            db.TutorSubjects.Add(new TutorSubject { TutorProfileId = tutor.Id, SubjectId = TutorDiscoverySeed.MathId });
            await db.SaveChangesAsync();
        }
        using var anonymous = factory.CreateApiClient();
        foreach (var path in new[] { "/api/v1/tutors", $"/api/v1/tutors/{profileId}" })
        {
            using var response = await anonymous.GetAsync(path);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            foreach (var field in new[] { "email", "phoneNumber", "dateOfBirth", "passwordHash", "securityStamp" })
                Assert.DoesNotContain($"\"{field}\"", json, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain("private@example.com", json);
            Assert.DoesNotContain("+84900000000", json);
        }
    }

    [Fact]
    public async Task AuditFailureRollsBackProfileAndAuditTogether()
    {
        await using var factory = await fixture.CreateFactoryAsync();
        using var client = factory.CreateApiClient();
        await RegisterAndLogin(client, "owner@example.com");
        var before = await ReadProfile(client);
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var services = scope.ServiceProvider;
            var service = new IdentityAccountService(services.GetRequiredService<UserManager<ApplicationUser>>(),
                services.GetRequiredService<ApplicationDbContext>(), services.GetRequiredService<IClock>(),
                new FailingAudit(services.GetRequiredService<IAuditWriter>()));
            await Assert.ThrowsAsync<InvalidOperationException>(() => service.UpdateProfileAsync(
                before.GetProperty("id").GetGuid(), new("Rolled Back", "+84912345678", new(2000, 1, 1), null)));
        }
        Assert.Equal(before.ToString(), (await ReadProfile(client)).ToString());
        await using var verification = factory.Services.CreateAsyncScope();
        Assert.Empty(await verification.ServiceProvider.GetRequiredService<ApplicationDbContext>().AuditEvents
            .Where(e => e.Action == "ProfileUpdated").ToListAsync());
    }

    [Fact]
    public async Task ConcurrentPhoneClaimsHaveOneWinnerAndNoPartialLoserUpdate()
    {
        await using var factory = await fixture.CreateFactoryAsync();
        using var first = factory.CreateApiClient();
        using var second = factory.CreateApiClient();
        await RegisterAndLogin(first, "first@example.com");
        await RegisterAndLogin(second, "second@example.com", "TUTOR");
        var firstBefore = await ReadProfile(first);
        var secondBefore = await ReadProfile(second);
        var firstCsrf = await first.GetFromJsonAsync<JsonElement>("/api/v1/auth/csrf");
        var secondCsrf = await second.GetFromJsonAsync<JsonElement>("/api/v1/auth/csrf");
        using var firstRequest = ClaimRequest(firstCsrf, "First Changed");
        using var secondRequest = ClaimRequest(secondCsrf, "Second Changed");
        // Block both UPDATEs after their uniqueness pre-checks so the database constraint is exercised.
        await using var setup = factory.Services.CreateAsyncScope();
        var connectionString = setup.ServiceProvider.GetRequiredService<ApplicationDbContext>().Database.GetConnectionString();
        await using var blocker = new NpgsqlConnection(connectionString);
        await blocker.OpenAsync();
        await using var transaction = await blocker.BeginTransactionAsync();
        await using (var command = new NpgsqlCommand("SELECT id FROM user_accounts FOR UPDATE", blocker, transaction))
            await command.ExecuteNonQueryAsync();
        var firstPending = first.SendAsync(firstRequest);
        var secondPending = second.SendAsync(secondRequest);
        try
        {
            await using var observer = new NpgsqlConnection(connectionString);
            await observer.OpenAsync();
            using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(15));
            while (true)
            {
                await using var query = new NpgsqlCommand(
                    "SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND cardinality(pg_blocking_pids(pid)) > 0", observer);
                if ((long)(await query.ExecuteScalarAsync(timeout.Token))! >= 2) break;
                await Task.Delay(20, timeout.Token);
            }
        }
        finally { await transaction.CommitAsync(); }
        var responses = await Task.WhenAll(firstPending, secondPending);
        try
        {
            Assert.Single(responses, r => r.StatusCode == HttpStatusCode.OK);
            Assert.Single(responses, r => r.StatusCode == HttpStatusCode.Conflict);
            var loser = responses[0].StatusCode == HttpStatusCode.Conflict ? first : second;
            var expected = responses[0].StatusCode == HttpStatusCode.Conflict ? firstBefore : secondBefore;
            Assert.Equal(expected.ToString(), (await ReadProfile(loser)).ToString());
            await using var scope = factory.Services.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            Assert.Equal(1, await db.Users.CountAsync(u => u.PhoneNumber == "+84999999999"));
            Assert.Equal(1, await db.AuditEvents.CountAsync(e => e.Action == "ProfileUpdated"));
        }
        finally { foreach (var response in responses) response.Dispose(); }
    }

    private static HttpRequestMessage ClaimRequest(JsonElement csrf, string name)
    {
        var request = new HttpRequestMessage(HttpMethod.Put, "/api/v1/users/me")
        {
            Content = JsonContent.Create(new { fullName = name, phoneNumber = "+84999999999", dateOfBirth = "2000-01-01" })
        };
        request.Headers.Add("X-CSRF-TOKEN", csrf.GetProperty("requestToken").GetString());
        return request;
    }

    private sealed class FailingAudit(IAuditWriter inner) : IAuditWriter
    {
        public async Task WriteAsync(AccountAuditEntry entry, CancellationToken cancellationToken = default)
        {
            await inner.WriteAsync(entry, cancellationToken);
            throw new InvalidOperationException("Simulated audit failure");
        }
    }

    private static async Task RegisterAndLogin(HttpClient client, string email, string role = "LEARNER", string? phone = null)
    {
        using var registered = await SessionEndpointTests.Post(client, "register", new
        {
            fullName = "Original Owner", email, role, phoneNumber = phone,
            password = "password", passwordConfirmation = "password"
        });
        Assert.Equal(HttpStatusCode.Created, registered.StatusCode);
        using var login = await SessionEndpointTests.Post(client, "login", new { email, password = "password" });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
    }

    private static async Task<JsonElement> ReadProfile(HttpClient client)
    {
        using var response = await client.GetAsync("/api/v1/users/me");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(response.Headers.CacheControl?.NoStore);
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    private static async Task<HttpResponseMessage> Put(HttpClient client, object body, string path = "/api/v1/users/me")
    {
        var csrf = await client.GetFromJsonAsync<JsonElement>("/api/v1/auth/csrf");
        using var request = new HttpRequestMessage(HttpMethod.Put, path) { Content = JsonContent.Create(body) };
        request.Headers.Add("X-CSRF-TOKEN", csrf.GetProperty("requestToken").GetString());
        return await client.SendAsync(request);
    }

    private static void AssertNoSecrets(JsonElement profile)
    {
        foreach (var field in new[] { "passwordHash", "securityStamp", "concurrencyStamp", "accessToken", "refreshToken" })
            Assert.False(profile.TryGetProperty(field, out _));
    }
}
