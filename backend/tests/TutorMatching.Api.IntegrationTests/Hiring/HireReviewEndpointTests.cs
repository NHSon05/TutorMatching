using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using TutorMatching.Api.IntegrationTests.Fixtures;

namespace TutorMatching.Api.IntegrationTests.Hiring;

[Collection("PostgreSQL API")]
public sealed class HireReviewEndpointTests(PostgreSqlFixture postgres)
{
    private static async Task<HttpResponseMessage> PostJsonWithCsrfAsync(
        HttpClient client,
        string url,
        JsonObject? body = null,
        Guid? idempotencyKey = null)
    {
        using var message = new HttpRequestMessage(HttpMethod.Post, url);
        if (body is not null)
        {
            message.Content = JsonContent.Create(body);
        }

        if (idempotencyKey.HasValue)
        {
            message.Headers.Add("Idempotency-Key", idempotencyKey.Value.ToString());
        }

        var token = await client.GetFromJsonAsync<JsonObject>("/api/v1/auth/csrf");
        message.Headers.Add(token!["headerName"]!.GetValue<string>(), token["requestToken"]!.GetValue<string>());
        return await client.SendAsync(message);
    }

    [Fact]
    public async Task SubmitReview_ReplyOnce_AndExposePublicTutorReviewsAndRatingAggregate()
    {
        await using var f = await HiringFixture.CreateAsync(postgres);
        using var learner = await f.CreateClientAsync(f.Learner);
        using var tutor = await f.CreateClientAsync(f.Tutor);
        using var anonymous = f.Factory.CreateApiClient();

        // 1. Create and accept hire request
        var payload = CreateHireRequestTests.Payload(f);
        using var createdResp = await CreateHireRequestTests.Send(learner, payload, Guid.NewGuid());
        Assert.Equal(HttpStatusCode.Created, createdResp.StatusCode);
        var created = (await createdResp.Content.ReadFromJsonAsync<JsonObject>())!;
        var requestId = created["id"]!.GetValue<string>();

        using var acceptResp = await PostJsonWithCsrfAsync(
            tutor,
            $"/api/v1/hire-requests/{requestId}/accept",
            new JsonObject
            {
                ["expectedVersion"] = created["version"]!.GetValue<string>(),
                ["proposalSequence"] = null
            });
        Assert.Equal(HttpStatusCode.OK, acceptResp.StatusCode);

        // Cannot review before COMPLETED
        using var earlyReviewResp = await PostJsonWithCsrfAsync(
            learner,
            $"/api/v1/hire-requests/{requestId}/review",
            new JsonObject
            {
                ["rating"] = 5,
                ["comment"] = "Đánh giá sớm"
            });
        Assert.Equal(HttpStatusCode.Conflict, earlyReviewResp.StatusCode);

        // 2. Pay and complete hire request
        using var payResp = await PostJsonWithCsrfAsync(
            learner,
            $"/api/v1/hire-requests/{requestId}/payments",
            idempotencyKey: Guid.NewGuid());
        var payment = (await payResp.Content.ReadFromJsonAsync<JsonObject>())!;
        using var confirmResp = await PostJsonWithCsrfAsync(
            learner,
            $"/api/v1/hire-requests/{requestId}/payments/{payment["id"]!.GetValue<string>()}/confirm");
        Assert.Equal(HttpStatusCode.OK, confirmResp.StatusCode);

        var detailAfterPay = await learner.GetFromJsonAsync<JsonObject>($"/api/v1/hire-requests/{requestId}");
        using var completeResp = await PostJsonWithCsrfAsync(
            learner,
            $"/api/v1/hire-requests/{requestId}/complete",
            new JsonObject
            {
                ["expectedVersion"] = detailAfterPay!["version"]!.GetValue<string>(),
                ["confirmed"] = true,
                ["reason"] = "Hoàn thành khóa học"
            });
        Assert.Equal(HttpStatusCode.OK, completeResp.StatusCode);

        // 3. Learner submits review
        using var submitResp = await PostJsonWithCsrfAsync(
            learner,
            $"/api/v1/hire-requests/{requestId}/review",
            new JsonObject
            {
                ["rating"] = 5,
                ["comment"] = "  Gia sư giảng bài rất dễ hiểu và nhiệt tình!  "
            });
        Assert.Equal(HttpStatusCode.Created, submitResp.StatusCode);
        var review = (await submitResp.Content.ReadFromJsonAsync<JsonObject>())!;
        Assert.Equal(5, review["rating"]!.GetValue<int>());
        Assert.Equal("Gia sư giảng bài rất dễ hiểu và nhiệt tình!", review["comment"]!.GetValue<string>());

        // Duplicate review is rejected with 409
        using var dupReviewResp = await PostJsonWithCsrfAsync(
            learner,
            $"/api/v1/hire-requests/{requestId}/review",
            new JsonObject
            {
                ["rating"] = 4,
                ["comment"] = "Đánh giá lần 2"
            });
        Assert.Equal(HttpStatusCode.Conflict, dupReviewResp.StatusCode);
        var dupReviewProblem = (await dupReviewResp.Content.ReadFromJsonAsync<JsonObject>())!;
        Assert.Equal("review_already_submitted", dupReviewProblem["code"]!.GetValue<string>());

        // 4. Tutor replies to review
        using var replyResp = await PostJsonWithCsrfAsync(
            tutor,
            $"/api/v1/hire-requests/{requestId}/review/reply",
            new JsonObject
            {
                ["reply"] = "  Cảm ơn bạn đã nỗ lực trong suốt khóa học!  "
            });
        Assert.Equal(HttpStatusCode.OK, replyResp.StatusCode);
        var replied = (await replyResp.Content.ReadFromJsonAsync<JsonObject>())!;
        Assert.Equal("Cảm ơn bạn đã nỗ lực trong suốt khóa học!", replied["tutorReply"]!.GetValue<string>());
        Assert.NotNull(replied["tutorRepliedAt"]);

        // Second reply is rejected with 409
        using var dupReplyResp = await PostJsonWithCsrfAsync(
            tutor,
            $"/api/v1/hire-requests/{requestId}/review/reply",
            new JsonObject
            {
                ["reply"] = "Phản hồi lần 2"
            });
        Assert.Equal(HttpStatusCode.Conflict, dupReplyResp.StatusCode);
        var dupReplyProblem = (await dupReplyResp.Content.ReadFromJsonAsync<JsonObject>())!;
        Assert.Equal("reply_already_submitted", dupReplyProblem["code"]!.GetValue<string>());

        // 5. Public tutor reviews and public tutor discovery reflect the updated rating aggregate
        var publicReviews = await anonymous.GetFromJsonAsync<JsonObject>($"/api/v1/tutors/{f.TutorProfileId}/reviews");
        Assert.Equal(5m, publicReviews!["averageRating"]!.GetValue<decimal>());
        Assert.Equal(1, publicReviews["reviewCount"]!.GetValue<int>());
        var reviewItem = Assert.Single(publicReviews["items"]!.AsArray())!.AsObject();
        Assert.Equal("Gia sư giảng bài rất dễ hiểu và nhiệt tình!", reviewItem["comment"]!.GetValue<string>());
        Assert.Equal("Cảm ơn bạn đã nỗ lực trong suốt khóa học!", reviewItem["tutorReply"]!.GetValue<string>());
        var learnerFullName = await f.WithDbAsync(db => db.Users.Where(u => u.Id == f.Learner.Id).Select(u => u.FullName).SingleAsync());
        var publicName = reviewItem["reviewerName"]!.GetValue<string>();
        Assert.NotEqual(learnerFullName, publicName);
        Assert.EndsWith(learnerFullName.Split(' ', StringSplitOptions.RemoveEmptyEntries)[^1], publicName);

        var publicTutorDetail = await anonymous.GetFromJsonAsync<JsonObject>($"/api/v1/tutors/{f.TutorProfileId}");
        Assert.Equal(5m, publicTutorDetail!["averageRating"]!.GetValue<decimal>());
        Assert.Equal(1, publicTutorDetail["reviewCount"]!.GetValue<int>());

        await f.WithDbAsync(async db =>
        {
            Assert.True(await db.Notifications.AnyAsync(n =>
                n.UserId == f.Tutor.Id && n.TypeCode == "TUTOR_REVIEW_RECEIVED"));
            Assert.True(await db.Notifications.AnyAsync(n =>
                n.UserId == f.Learner.Id && n.TypeCode == "TUTOR_REVIEW_REPLIED"));
            return true;
        });
    }
}
