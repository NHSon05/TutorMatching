using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorMatching.Application.Abstractions;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Api.IntegrationTests.Fixtures;

[Collection("PostgreSQL API")]
public sealed class PostgreSqlFixtureTests(PostgreSqlFixture fixture)
{
    [Fact]
    public async Task RealApiStartsWithMigratedPostgreSqlAndCanonicalRoles()
    {
        await using var factory = await fixture.CreateFactoryAsync();
        using var client = factory.CreateApiClient();
        using var response = await client.GetAsync("/api/v1/auth/csrf");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var token = await response.Content.ReadFromJsonAsync<CsrfPayload>();
        Assert.False(string.IsNullOrWhiteSpace(token?.RequestToken));
        Assert.Equal("X-CSRF-TOKEN", token!.HeaderName);

        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        Assert.Contains("20261003070401_InitialIdentityProfileAudit", await db.Database.GetAppliedMigrationsAsync());
        Assert.Equal(new[] { "ADMIN", "LEARNER", "TUTOR" }, await db.Roles.OrderBy(role => role.Name).Select(role => role.Name).ToArrayAsync());
        Assert.Empty(await db.Users.ToListAsync());
    }

    [Fact]
    public async Task AuditPersistsAcrossScopesAndInvalidActionsDoNotWrite()
    {
        await using var factory = await fixture.CreateFactoryAsync();
        var targetId = Guid.NewGuid();
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var writer = scope.ServiceProvider.GetRequiredService<IAuditWriter>();
            await writer.WriteAsync(new AccountAuditEntry(AccountAuditAction.SignInFailed, null, targetId));
            await Assert.ThrowsAsync<ArgumentOutOfRangeException>(() =>
                writer.WriteAsync(new AccountAuditEntry((AccountAuditAction)999, null, null)));
        }
        await using var readScope = factory.Services.CreateAsyncScope();
        var events = await readScope.ServiceProvider.GetRequiredService<ApplicationDbContext>().AuditEvents.ToListAsync();
        var entry = Assert.Single(events);
        Assert.Equal("SignInFailed", entry.Action);
        Assert.Null(entry.ActorUserId);
        Assert.Equal(targetId.ToString(), entry.EntityId);
        Assert.Equal("UserAccount", entry.EntityType);
        Assert.Equal(TimeSpan.Zero, entry.CreatedAt.Offset);
    }

    [Fact]
    public async Task FactoriesIsolateDatabaseAndCapturedEmails()
    {
        await using var first = await fixture.CreateFactoryAsync();
        await using var second = await fixture.CreateFactoryAsync();
        await using (var scope = first.Services.CreateAsyncScope())
        {
            await scope.ServiceProvider.GetRequiredService<IAuditWriter>().WriteAsync(
                new AccountAuditEntry(AccountAuditAction.PasswordResetRequested, null, null));
            await scope.ServiceProvider.GetRequiredService<IEmailSender>()
                .SendAsync("recipient@example.test", "Test subject", "Synthetic test content");
        }
        var email = Assert.Single(first.Emails.Messages);
        // Boolean assertions avoid printing message bodies on failure.
        Assert.True(email.Recipient == "recipient@example.test");
        Assert.True(email.Body == "Synthetic test content");
        Assert.Empty(second.Emails.Messages);
        await using var scope2 = second.Services.CreateAsyncScope();
        var db = scope2.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        Assert.Empty(await db.AuditEvents.ToListAsync());
        first.Emails.Clear();
        Assert.Empty(first.Emails.Messages);
    }

    [Fact]
    public async Task CancelledEmailIsNotCaptured()
    {
        var sender = new CapturedEmailSender();
        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => sender.SendAsync(
            "recipient@example.test", "Test", "Synthetic", new CancellationToken(true)));
        Assert.Empty(sender.Messages);
    }

    private sealed record CsrfPayload(string RequestToken, string HeaderName);
}
