using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using TutorMatching.Api.IntegrationTests.Fixtures;

namespace TutorMatching.Api.IntegrationTests.Hiring;

[Collection("PostgreSQL API")]
public sealed class CreateHireRequestTests(PostgreSqlFixture postgres)
{
    internal static JsonObject Payload(HiringFixture f, bool course = false) => new()
    {
        ["tutorProfileId"] = f.TutorProfileId.ToString(), ["subjectId"] = f.SubjectId.ToString(),
        ["startDate"] = f.FutureStartDate.ToString("yyyy-MM-dd"), ["sessionsPerWeek"] = 1,
        ["durationMinutes"] = 60, ["teachingMode"] = "ONLINE", ["priceVnd"] = course ? 180000 : 150000,
        ["expectedListedPriceVnd"] = course ? 180000 : 150000,
        ["schedules"] = new JsonArray(new JsonObject { ["dayOfWeek"] = 1, ["startTime"] = "18:00", ["endTime"] = "19:00" })
    };
    internal static async Task<HttpResponseMessage> Send(HttpClient client, JsonObject body, Guid key, bool csrf = true)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/hire-requests") { Content = JsonContent.Create(body) };
        request.Headers.Add("Idempotency-Key", key.ToString());
        if (csrf)
        {
            var token = await client.GetFromJsonAsync<JsonObject>("/api/v1/auth/csrf");
            request.Headers.Add(token!["headerName"]!.GetValue<string>(), token["requestToken"]!.GetValue<string>());
        }
        return await client.SendAsync(request);
    }
    [Theory]
    [InlineData(false, false)] [InlineData(false, true)] [InlineData(true, false)]
    public async Task CreatesAtomicRequestAtSelectedPrice(bool course, bool alternate)
    {
        await using var f = await HiringFixture.CreateAsync(postgres);
        using var client = await f.CreateClientAsync(f.Learner);
        var body = Payload(f, course);
        if (course) body["courseId"] = f.CourseId.ToString();
        if (alternate) body["priceVnd"] = 120000;
        var response = await Send(client, body, Guid.NewGuid());
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<JsonObject>();
        Assert.Equal(alternate ? "NEGOTIATING" : "PENDING", result!["status"]!.GetValue<string>());
        await f.WithDbAsync(async db => {
            Assert.Single(await db.HireRequests.ToListAsync()); Assert.Single(await db.RequestSchedules.ToListAsync());
            Assert.Single(await db.RequestStatusHistories.ToListAsync()); Assert.Single(await db.Conversations.ToListAsync());
            Assert.Single(await db.Notifications.ToListAsync()); Assert.Single(await db.HireCreateOperations.ToListAsync());
            Assert.Equal(course ? 180000 : 150000, (await db.HireRequests.SingleAsync()).ListedPriceVnd);
            return true;
        });
    }
    [Theory]
    [InlineData("sessionsPerWeek", "0")] [InlineData("sessionsPerWeek", "22")]
    [InlineData("durationMinutes", "29")] [InlineData("durationMinutes", "241")]
    [InlineData("priceVnd", "\"150000\"")] [InlineData("priceVnd", "1.5")]
    [InlineData("priceVnd", "0")] [InlineData("priceVnd", "2147483648")]
    [InlineData("startDate", "\"2000-01-01\"")]
    [InlineData("teachingMode", "\"OFFLINE\"")] [InlineData("schedules", "[]")]
    public async Task InvalidTermsNeverWrite(string field, string json)
    {
        await using var f = await HiringFixture.CreateAsync(postgres);
        using var client = await f.CreateClientAsync(f.Learner);
        var body = Payload(f); body[field] = JsonNode.Parse(json);
        var response = await Send(client, body, Guid.NewGuid());
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.NotNull((await response.Content.ReadFromJsonAsync<JsonObject>())!["errors"]);
        Assert.Equal(0, await f.WithDbAsync(db => db.HireRequests.CountAsync()));
    }
    [Fact]
    public async Task StalePriceAndRoleAndCsrfAreRejected()
    {
        await using var f = await HiringFixture.CreateAsync(postgres);
        using var learner = await f.CreateClientAsync(f.Learner);
        using var tutor = await f.CreateClientAsync(f.Tutor);
        var body = Payload(f); body["expectedListedPriceVnd"] = 1;
        Assert.Equal(HttpStatusCode.Conflict, (await Send(learner, body, Guid.NewGuid())).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Send(tutor, body, Guid.NewGuid())).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await Send(learner, body, Guid.NewGuid(), false)).StatusCode);
    }
    [Theory]
    [InlineData("hidden")] [InlineData("unlistedPrice")] [InlineData("locked")] [InlineData("subject")]
    [InlineData("course")] [InlineData("mismatch")] [InlineData("self")]
    public async Task IneligibleOfferingNeverWrites(string change)
    {
        await using var f = await HiringFixture.CreateAsync(postgres);
        using var client = await f.CreateClientAsync(f.Learner);
        var body = Payload(f);
        await f.WithDbAsync(async db => {
            if (change == "unlistedPrice") { (await db.TutorProfiles.SingleAsync(p => p.Id == f.TutorProfileId)).SessionRateVnd = null; body["courseId"] = f.CourseId.ToString(); }
            if (change == "hidden") (await db.TutorProfiles.SingleAsync(p => p.Id == f.TutorProfileId)).Status = TutorMatching.Domain.Tutors.TutorProfileStatus.DRAFT;
            if (change == "locked") (await db.Users.SingleAsync(p => p.Id == f.Tutor.Id)).Status = TutorMatching.Domain.Users.AccountStatus.LOCKED;
            if (change == "subject") (await db.Subjects.SingleAsync(p => p.Id == f.SubjectId)).IsActive = false;
            if (change == "course") { (await db.Courses.SingleAsync(p => p.Id == f.CourseId)).StatusCode = "INACTIVE"; body["courseId"] = f.CourseId.ToString(); }
            if (change == "mismatch") { body["tutorProfileId"] = f.OtherTutorProfileId.ToString(); body["courseId"] = f.CourseId.ToString(); }
            if (change == "self") (await db.TutorProfiles.SingleAsync(p => p.Id == f.TutorProfileId)).UserId = f.Learner.Id;
            await db.SaveChangesAsync(); return true;
        });
        Assert.Equal(change == "self" ? HttpStatusCode.Forbidden : HttpStatusCode.Conflict, (await Send(client, body, Guid.NewGuid())).StatusCode);
        Assert.Equal(0, await f.WithDbAsync(db => db.HireRequests.CountAsync()));
    }

    [Theory]
    [InlineData("day")] [InlineData("reverse")] [InlineData("overlap")]
    [InlineData("outside")] [InlineData("capacity")] [InlineData("precision")]
    [InlineData("location")] [InlineData("note")] [InlineData("locationLength")]
    public async Task RejectsScheduleAndLocationBoundaries(string change)
    {
        await using var f = await HiringFixture.CreateAsync(postgres);
        using var client = await f.CreateClientAsync(f.Learner);
        var body = Payload(f); var schedules = body["schedules"]!.AsArray(); var window = schedules[0]!;
        switch (change) {
            case "day": window["dayOfWeek"] = 8; break;
            case "reverse": window["endTime"] = "17:00"; break;
            case "overlap": schedules.Add(window.DeepClone()); break;
            case "outside": window["endTime"] = "22:00"; break;
            case "capacity": body["sessionsPerWeek"] = 2; break;
            case "precision": window["startTime"] = "18:00:30"; break;
            case "location": body["teachingMode"] = "OFFLINE"; body["provinceCode"] = HiringFixture.ProvinceCode; body["districtCode"] = "unknown"; break;
            case "note": body["note"] = new string('x', 2001); break;
            case "locationLength": body["locationDetail"] = new string('x', 501); break;
        }
        Assert.Equal(change == "outside" ? HttpStatusCode.Conflict : HttpStatusCode.BadRequest, (await Send(client, body, Guid.NewGuid())).StatusCode);
        Assert.Equal(0, await f.WithDbAsync(db => db.HireRequests.CountAsync()));
    }

    [Fact]
    public async Task OfflineAtValidLocationAndIntegerMaximumPriceWorks()
    {
        await using var f = await HiringFixture.CreateAsync(postgres);
        using var client = await f.CreateClientAsync(f.Learner);
        var body = Payload(f); body["teachingMode"] = "OFFLINE"; body["provinceCode"] = HiringFixture.ProvinceCode;
        body["districtCode"] = HiringFixture.DistrictCode; body["priceVnd"] = int.MaxValue;
        Assert.Equal(HttpStatusCode.Created, (await Send(client, body, Guid.NewGuid())).StatusCode);
    }

}
