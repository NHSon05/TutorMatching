using System.Net;
using Microsoft.EntityFrameworkCore;
using TutorMatching.Api.IntegrationTests.Fixtures;
using TutorMatching.Domain.Users;

namespace TutorMatching.Api.IntegrationTests.Administration;

[Collection("PostgreSQL API")]
public sealed class AdminFixtureTests(PostgreSqlFixture postgres)
{
    [Fact]
    public async Task SeedsIndependentAdminsArticleStatesCategoriesAndPreservedHistory()
    {
        await using var fixture = await AdminFixture.CreateAsync(postgres);
        foreach (var actor in new[] { fixture.Admin, fixture.SecondAdmin })
        {
            using var client = await fixture.CreateClientAsync(actor);
            using var response = await client.GetAsync("/api/v1/admin/users");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }
        await fixture.WithDbAsync(async db =>
        {
            Assert.Equal(2, await db.Users.CountAsync(u => u.Role == AccountRole.ADMIN));
            Assert.NotEqual(fixture.Admin.Id, fixture.SecondAdmin.Id);
            var articles = await db.Articles.OrderBy(a => a.StatusCode).ToListAsync();
            Assert.Equal(new[] { "DRAFT", "HIDDEN", "PUBLISHED" }, articles.Select(a => a.StatusCode));
            Assert.All(articles, a => Assert.Equal(fixture.Admin.Id, a.AuthorUserId));
            Assert.Null(articles[0].PublishedAt);
            Assert.NotNull(articles[1].PublishedAt);
            Assert.NotNull(articles[2].PublishedAt);
            Assert.True(await db.Subjects.AnyAsync(s => s.Id == fixture.InactiveSubjectId && !s.IsActive));
            Assert.True(await db.HireRequests.AnyAsync(r => r.SubjectId == fixture.SubjectId));
            Assert.True(await db.Set<TutorMatching.Domain.Catalog.TeachingLevel>().AnyAsync(l => l.Code == AdminFixture.TeachingLevelCode));
            Assert.Equal(2, await db.RequestStatusHistories.CountAsync());
            Assert.Equal(5, await db.Messages.CountAsync());
            var audit = await db.AuditEvents.Where(a => a.EntityType == "Article").ToListAsync();
            Assert.Equal(3, audit.Count);
            Assert.All(audit, a =>
            {
                Assert.Equal(fixture.Admin.Id, a.ActorUserId);
                Assert.Null(a.IpAddress);
                Assert.Contains(a.EntityId, articles.Select(a => a.Id.ToString()));
            });
            return true;
        });
    }
}
