using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using TutorMatching.Api.IntegrationTests.Fixtures;

namespace TutorMatching.Api.IntegrationTests.Hiring;

[Collection("PostgreSQL API")]
public sealed class HirePaymentEndpointTests(PostgreSqlFixture postgres)
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
    public async Task InitiatePayment_IdempotentReplay_AndConfirmPayment_UnlocksCompletion()
    {
        await using var f = await HiringFixture.CreateAsync(postgres);
        using var learner = await f.CreateClientAsync(f.Learner);
        using var tutor = await f.CreateClientAsync(f.Tutor);

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
        var accepted = (await acceptResp.Content.ReadFromJsonAsync<JsonObject>())!;

        // Attempting to complete before payment must return 409 payment_required
        using var prematureComplete = await PostJsonWithCsrfAsync(
            learner,
            $"/api/v1/hire-requests/{requestId}/complete",
            new JsonObject
            {
                ["expectedVersion"] = accepted["version"]!.GetValue<string>(),
                ["confirmed"] = true,
                ["reason"] = "Hoàn tất sớm"
            });
        Assert.Equal(HttpStatusCode.Conflict, prematureComplete.StatusCode);
        var prematureProblem = (await prematureComplete.Content.ReadFromJsonAsync<JsonObject>())!;
        Assert.Equal("payment_required", prematureProblem["code"]!.GetValue<string>());

        // Initiate VietQR sandbox payment
        var paymentKey = Guid.NewGuid();
        using var initResp = await PostJsonWithCsrfAsync(
            learner,
            $"/api/v1/hire-requests/{requestId}/payments",
            idempotencyKey: paymentKey);
        Assert.Equal(HttpStatusCode.Created, initResp.StatusCode);
        var payment = (await initResp.Content.ReadFromJsonAsync<JsonObject>())!;
        var paymentId = payment["id"]!.GetValue<string>();
        Assert.Equal("PENDING", payment["status"]!.GetValue<string>());
        Assert.Equal(150000, payment["unitPriceVnd"]!.GetValue<int>());
        Assert.Equal(4, payment["billingSessions"]!.GetValue<int>());
        Assert.Equal(600000, payment["amountVnd"]!.GetValue<int>());
        Assert.Equal("VIETQR_SANDBOX", payment["providerCode"]!.GetValue<string>());
        Assert.Contains("https://img.vietqr.io/image/", payment["qrPayload"]!.GetValue<string>());

        // Idempotent replay with same Idempotency-Key returns same payment
        using var replayResp = await PostJsonWithCsrfAsync(
            learner,
            $"/api/v1/hire-requests/{requestId}/payments",
            idempotencyKey: paymentKey);
        Assert.Equal(HttpStatusCode.Created, replayResp.StatusCode);
        var replayed = (await replayResp.Content.ReadFromJsonAsync<JsonObject>())!;
        Assert.Equal(paymentId, replayed["id"]!.GetValue<string>());

        // A retry with a fresh key reuses the outstanding PENDING checkout instead of opening a second one,
        // and requestVersion is the committed version (usable as expectedVersion).
        using var retryResp = await PostJsonWithCsrfAsync(
            learner,
            $"/api/v1/hire-requests/{requestId}/payments",
            idempotencyKey: Guid.NewGuid());
        Assert.Equal(HttpStatusCode.Created, retryResp.StatusCode);
        var retried = (await retryResp.Content.ReadFromJsonAsync<JsonObject>())!;
        Assert.Equal(paymentId, retried["id"]!.GetValue<string>());
        var detailWhilePending = await learner.GetFromJsonAsync<JsonObject>($"/api/v1/hire-requests/{requestId}");
        Assert.Equal(detailWhilePending!["version"]!.GetValue<string>(), retried["requestVersion"]!.GetValue<string>());
        Assert.Equal(1, await f.WithDbAsync(db => db.HirePayments.CountAsync()));

        // Confirm sandbox payment
        using var confirmResp = await PostJsonWithCsrfAsync(
            learner,
            $"/api/v1/hire-requests/{requestId}/payments/{paymentId}/confirm");
        Assert.Equal(HttpStatusCode.OK, confirmResp.StatusCode);
        var confirmed = (await confirmResp.Content.ReadFromJsonAsync<JsonObject>())!;
        Assert.Equal("PAID", confirmed["status"]!.GetValue<string>());
        Assert.NotNull(confirmed["paidAt"]);

        // Confirming an already-paid payment again is rejected.
        using var reconfirmResp = await PostJsonWithCsrfAsync(
            learner,
            $"/api/v1/hire-requests/{requestId}/payments/{paymentId}/confirm");
        Assert.Equal(HttpStatusCode.Conflict, reconfirmResp.StatusCode);

        // Both learner and tutor can view payment details
        var tutorPayments = await tutor.GetFromJsonAsync<JsonObject>($"/api/v1/hire-requests/{requestId}/payments");
        Assert.Equal("PAID", tutorPayments!["paymentStatus"]!.GetValue<string>());
        Assert.Single(tutorPayments["items"]!.AsArray());

        var detailAfterPay = await learner.GetFromJsonAsync<JsonObject>($"/api/v1/hire-requests/{requestId}");
        Assert.Equal("PAID", detailAfterPay!["paymentStatus"]!.GetValue<string>());

        // Complete hire request now succeeds
        using var completeResp = await PostJsonWithCsrfAsync(
            learner,
            $"/api/v1/hire-requests/{requestId}/complete",
            new JsonObject
            {
                ["expectedVersion"] = detailAfterPay["version"]!.GetValue<string>(),
                ["confirmed"] = true,
                ["reason"] = "Khóa học đã kết thúc tốt đẹp"
            });
        Assert.Equal(HttpStatusCode.OK, completeResp.StatusCode);
        var completed = (await completeResp.Content.ReadFromJsonAsync<JsonObject>())!;
        Assert.Equal("COMPLETED", completed["status"]!.GetValue<string>());

        await f.WithDbAsync(async db =>
        {
            Assert.True(await db.Notifications.AnyAsync(n =>
                n.UserId == f.Tutor.Id && n.TypeCode == "HIRE_PAYMENT_COMPLETED"));
            return true;
        });
    }

    [Fact]
    public async Task CourseHireRequest_UsesCourseSessionCount_AndRejectsNonOwnerPayment()
    {
        await using var f = await HiringFixture.CreateAsync(postgres);
        using var learner = await f.CreateClientAsync(f.Learner);
        using var otherLearner = await f.CreateClientAsync(f.OtherLearner);
        using var tutor = await f.CreateClientAsync(f.Tutor);

        var payload = CreateHireRequestTests.Payload(f);
        payload["courseId"] = f.CourseId.ToString();
        payload["priceVnd"] = HiringFixture.CoursePriceVnd;
        payload["expectedListedPriceVnd"] = HiringFixture.CoursePriceVnd;
        payload["sessionsPerWeek"] = 3;
        payload["schedules"] = new JsonArray(
            new JsonObject { ["dayOfWeek"] = 1, ["startTime"] = "18:00", ["endTime"] = "19:00" },
            new JsonObject { ["dayOfWeek"] = 3, ["startTime"] = "18:00", ["endTime"] = "19:00" },
            new JsonObject { ["dayOfWeek"] = 5, ["startTime"] = "18:00", ["endTime"] = "19:00" });

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

        // Tutor cannot initiate payment (role LEARNER required)
        using var tutorPayAttempt = await PostJsonWithCsrfAsync(
            tutor,
            $"/api/v1/hire-requests/{requestId}/payments",
            idempotencyKey: Guid.NewGuid());
        Assert.Equal(HttpStatusCode.Forbidden, tutorPayAttempt.StatusCode);

        // Other learner gets 404
        using var otherLearnerAttempt = await PostJsonWithCsrfAsync(
            otherLearner,
            $"/api/v1/hire-requests/{requestId}/payments",
            idempotencyKey: Guid.NewGuid());
        Assert.Equal(HttpStatusCode.NotFound, otherLearnerAttempt.StatusCode);

        // Owner learner initiates payment -> uses Course.SessionCount (8) instead of 3 * 4 = 12
        using var ownerPayResp = await PostJsonWithCsrfAsync(
            learner,
            $"/api/v1/hire-requests/{requestId}/payments",
            idempotencyKey: Guid.NewGuid());
        Assert.Equal(HttpStatusCode.Created, ownerPayResp.StatusCode);
        var payment = (await ownerPayResp.Content.ReadFromJsonAsync<JsonObject>())!;
        Assert.Equal(8, payment["billingSessions"]!.GetValue<int>());
        Assert.Equal(8 * HiringFixture.CoursePriceVnd, payment["amountVnd"]!.GetValue<int>());
    }
}
