using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using TutorMatching.Api.IntegrationTests.Fixtures;
using TutorMatching.Api.IntegrationTests.Hiring;
using TutorMatching.Domain.Users;

namespace TutorMatching.Api.IntegrationTests.Tutors;

[Collection("PostgreSQL API")]
public sealed class SavedTutorsEndpointTests(PostgreSqlFixture postgres)
{
    [Fact]
    public async Task LearnerSavesAndRemovesTutorsIdempotently()
    {
        await using var f = await HiringFixture.CreateAsync(postgres);
        using var learner = await f.CreateClientAsync(f.Learner);

        Assert.Empty(await Items(learner));
        using (var saved = await Send(learner, HttpMethod.Put, f.TutorProfileId)) Assert.Equal(HttpStatusCode.NoContent, saved.StatusCode);
        f.Factory.Clock.Advance(TimeSpan.FromMinutes(1));
        using (var again = await Send(learner, HttpMethod.Put, f.TutorProfileId)) Assert.Equal(HttpStatusCode.NoContent, again.StatusCode);
        using (var other = await Send(learner, HttpMethod.Put, f.OtherTutorProfileId)) Assert.Equal(HttpStatusCode.NoContent, other.StatusCode);

        var items = await Items(learner);
        Assert.Equal([f.OtherTutorProfileId, f.TutorProfileId], items.Select(i => i!["tutorProfileId"]!.GetValue<Guid>()));
        Assert.Equal(2, await f.WithDbAsync(db => db.SavedTutors.CountAsync()));

        using (var removed = await Send(learner, HttpMethod.Delete, f.TutorProfileId)) Assert.Equal(HttpStatusCode.NoContent, removed.StatusCode);
        using (var removedAgain = await Send(learner, HttpMethod.Delete, f.TutorProfileId)) Assert.Equal(HttpStatusCode.NoContent, removedAgain.StatusCode);
        Assert.Equal([f.OtherTutorProfileId], (await Items(learner)).Select(i => i!["tutorProfileId"]!.GetValue<Guid>()));

        // Bookmarks are owner-scoped.
        using var otherLearner = await f.CreateClientAsync(f.OtherLearner);
        Assert.Empty(await Items(otherLearner));
    }

    [Fact]
    public async Task OnlyPublicTutorsCanBeSavedAndHiddenOnesDropOutOfTheList()
    {
        await using var f = await HiringFixture.CreateAsync(postgres);
        using var learner = await f.CreateClientAsync(f.Learner);
        using (var missing = await Send(learner, HttpMethod.Put, Guid.NewGuid())) Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);

        using (var saved = await Send(learner, HttpMethod.Put, f.TutorProfileId)) Assert.Equal(HttpStatusCode.NoContent, saved.StatusCode);
        await f.WithDbAsync(db => db.Users.Where(u => u.Id == f.Tutor.Id)
            .ExecuteUpdateAsync(s => s.SetProperty(u => u.Status, AccountStatus.LOCKED)));
        Assert.Empty(await Items(learner));
        using (var locked = await Send(learner, HttpMethod.Put, f.TutorProfileId)) Assert.Equal(HttpStatusCode.NotFound, locked.StatusCode);
        // Kept, not deleted: unlocking brings the bookmark back.
        Assert.Equal(1, await f.WithDbAsync(db => db.SavedTutors.CountAsync()));
    }

    [Fact]
    public async Task OnlySignedInLearnersMayUseBookmarks()
    {
        await using var f = await HiringFixture.CreateAsync(postgres);
        using var tutor = await f.CreateClientAsync(f.Tutor);
        using (var list = await tutor.GetAsync("/api/v1/saved-tutors")) Assert.Equal(HttpStatusCode.Forbidden, list.StatusCode);
        using (var save = await Send(tutor, HttpMethod.Put, f.OtherTutorProfileId)) Assert.Equal(HttpStatusCode.Forbidden, save.StatusCode);
        using var anonymous = f.Factory.CreateApiClient();
        using (var list = await anonymous.GetAsync("/api/v1/saved-tutors")) Assert.Equal(HttpStatusCode.Unauthorized, list.StatusCode);
        Assert.Equal(0, await f.WithDbAsync(db => db.SavedTutors.CountAsync()));
    }

    private static async Task<JsonArray> Items(HttpClient client)
    {
        using var response = await client.GetAsync("/api/v1/saved-tutors");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(response.Headers.CacheControl?.NoStore);
        return (await response.Content.ReadFromJsonAsync<JsonObject>())!["items"]!.AsArray();
    }

    private static async Task<HttpResponseMessage> Send(HttpClient client, HttpMethod method, Guid id)
    {
        var token = await client.GetFromJsonAsync<JsonObject>("/api/v1/auth/csrf");
        using var message = new HttpRequestMessage(method, $"/api/v1/saved-tutors/{id}");
        message.Headers.Add(token!["headerName"]!.GetValue<string>(), token["requestToken"]!.GetValue<string>());
        return await client.SendAsync(message);
    }
}
