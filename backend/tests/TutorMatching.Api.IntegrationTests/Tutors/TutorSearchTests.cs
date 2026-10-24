using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorMatching.Api.IntegrationTests.Fixtures;
using TutorMatching.Domain.Catalog;
using TutorMatching.Domain.Locations;
using TutorMatching.Domain.Tutors;
using TutorMatching.Domain.Users;
using TutorMatching.Infrastructure.Persistence;
namespace TutorMatching.Api.IntegrationTests.Tutors;

[Collection("PostgreSQL API")]
public sealed class TutorSearchTests(PostgreSqlFixture fixture)
{
    internal static readonly Guid English = Guid.Parse("02000000-0000-0000-0000-000000000002");
    [Fact]
    public async Task UnfilteredListIncludesTutorsWithoutSlotsAndFilteringCanBeCleared()
    {
        await using var factory = await fixture.CreateFactoryAsync(); var ids = await Seed(factory);
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            await db.AvailabilitySlots.Where(s => s.TutorProfileId == ids[1]).ExecuteDeleteAsync();
        }
        using var client = factory.CreateApiClient();
        async Task AssertAllPublicTutors()
        {
            var result = await client.GetFromJsonAsync<JsonElement>("/api/v1/tutors");
            Assert.Equal(2, result.GetProperty("totalCount").GetInt32());
            Assert.Equal(ids.Take(2).Order(), result.GetProperty("items").EnumerateArray().Select(x => x.GetProperty("id").GetGuid()).Order());
            Assert.Equal(1, result.GetProperty("page").GetInt32());
            Assert.Equal(20, result.GetProperty("pageSize").GetInt32());
        }
        await AssertAllPublicTutors();
        var byName = await client.GetFromJsonAsync<JsonElement>("/api/v1/tutors?name=nguyen");
        Assert.Equal(ids[0], Assert.Single(byName.GetProperty("items").EnumerateArray()).GetProperty("id").GetGuid());
        var byPrice = await client.GetFromJsonAsync<JsonElement>("/api/v1/tutors?minPrice=200000");
        Assert.Equal(ids[1], Assert.Single(byPrice.GetProperty("items").EnumerateArray()).GetProperty("id").GetGuid());
        var windows = Uri.EscapeDataString("[{\"dayOfWeek\":1,\"startTime\":\"18:00\",\"endTime\":\"20:00\"}]");
        var bySchedule = await client.GetFromJsonAsync<JsonElement>($"/api/v1/tutors?sessionsPerWeek=2&durationMinutes=60&weeklyWindows={windows}");
        Assert.Equal(ids[0], Assert.Single(bySchedule.GetProperty("items").EnumerateArray()).GetProperty("id").GetGuid());
        await AssertAllPublicTutors();
    }
    [Fact]
    public async Task FiltersGroupsAndKeepsSubjectLevelAssociation()
    {
        await using var factory = await fixture.CreateFactoryAsync(); var ids = await Seed(factory); using var client = factory.CreateApiClient();
        var query = $"?name=nguyen%20anh&subjectId={TutorDiscoverySeed.MathId}&levelCode=HIGH_SCHOOL&qualification=C%E1%BB%AD%20nh%C3%A2n&minPrice=150000&maxPrice=150000&mode=ONLINE&provinceCode=P&districtCode=D";
        var page = await client.GetFromJsonAsync<JsonElement>("/api/v1/tutors" + query); Assert.Equal(ids[0], Assert.Single(page.GetProperty("items").EnumerateArray()).GetProperty("id").GetGuid());
        var wrong = await client.GetFromJsonAsync<JsonElement>($"/api/v1/tutors?subjectId={English}&levelCode=HIGH_SCHOOL"); Assert.Equal(0, wrong.GetProperty("totalCount").GetInt32());
        var or = await client.GetFromJsonAsync<JsonElement>($"/api/v1/tutors?subjectId={English}&subjectId={TutorDiscoverySeed.MathId}&levelCode=HIGH_SCHOOL&levelCode=PRIMARY&mode=ONLINE&mode=HYBRID&provinceCode=P&districtCode=D"); Assert.Equal(2, or.GetProperty("totalCount").GetInt32());
        var missing = await client.GetFromJsonAsync<JsonElement>("/api/v1/tutors?name=unmatched"); Assert.Equal(0, missing.GetProperty("totalCount").GetInt32());
    }
    [Fact]
    public async Task PagingUsesSessionPriceStableOrderAndNoStore()
    {
        await using var factory = await fixture.CreateFactoryAsync(); await Seed(factory); using var client = factory.CreateApiClient();
        var all = await client.GetFromJsonAsync<JsonElement>("/api/v1/tutors"); Assert.Equal(20, all.GetProperty("pageSize").GetInt32());
        var pages = new List<Guid>();
        for (var i = 1; i <= 2; i++) { using var response = await client.GetAsync($"/api/v1/tutors?sort=priceAsc&pageSize=1&page={i}"); Assert.True(response.Headers.CacheControl?.NoStore); var body = await response.Content.ReadFromJsonAsync<JsonElement>(); Assert.Equal(2, body.GetProperty("totalCount").GetInt32()); pages.Add(body.GetProperty("items")[0].GetProperty("id").GetGuid()); }
        Assert.Equal(2, pages.Distinct().Count());
        var desc = await client.GetFromJsonAsync<JsonElement>("/api/v1/tutors?sort=priceDesc"); Assert.Equal(200000, desc.GetProperty("items")[0].GetProperty("sessionRateVnd").GetInt32());
        var beyond = await client.GetFromJsonAsync<JsonElement>("/api/v1/tutors?page=99"); Assert.Empty(beyond.GetProperty("items").EnumerateArray());
    }
    [Fact]
    public async Task CapacityMergesWindowsAndDoesNotCombineGaps()
    {
        await using var factory = await fixture.CreateFactoryAsync(); var ids = await Seed(factory); using var client = factory.CreateApiClient();
        var windows = Uri.EscapeDataString("[{\"dayOfWeek\":1,\"startTime\":\"18:00\",\"endTime\":\"20:00\"},{\"dayOfWeek\":1,\"startTime\":\"18:00\",\"endTime\":\"20:00\"}]");
        var body = await client.GetFromJsonAsync<JsonElement>($"/api/v1/tutors?sessionsPerWeek=2&durationMinutes=60&weeklyWindows={windows}"); Assert.Equal(ids[0], Assert.Single(body.GetProperty("items").EnumerateArray()).GetProperty("id").GetGuid());
        var tooMany = await client.GetFromJsonAsync<JsonElement>($"/api/v1/tutors?sessionsPerWeek=3&durationMinutes=60&weeklyWindows={windows}"); Assert.Equal(0, tooMany.GetProperty("totalCount").GetInt32());
        var ninety = await client.GetFromJsonAsync<JsonElement>($"/api/v1/tutors?sessionsPerWeek=1&durationMinutes=90&weeklyWindows={windows}"); Assert.Equal(1, ninety.GetProperty("totalCount").GetInt32());
    }
    [Theory]
    [InlineData("minPrice=0")]
    [InlineData("minPrice=20&maxPrice=10")]
    [InlineData("page=0")]
    [InlineData("page=wrong")]
    [InlineData("pageSize=101")]
    [InlineData("sort=rating")]
    [InlineData("status=all")]
    [InlineData("mode=OFFLINE")]
    [InlineData("mode=UNKNOWN")]
    [InlineData("subjectId=wrong")]
    [InlineData("districtCode=D")]
    [InlineData("sessionsPerWeek=2")]
    [InlineData("durationMinutes=60")]
    [InlineData("weeklyWindows=invalid")]
    [InlineData("sessionsPerWeek=1&durationMinutes=29&weeklyWindows=[]")]
    [InlineData("minPrice=")]
    public async Task InvalidCriteriaReturn400(string query)
    { await using var factory = await fixture.CreateFactoryAsync(); using var client = factory.CreateApiClient(); using var response = await client.GetAsync("/api/v1/tutors?" + query); Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode); }
    [Fact]
    public async Task DeactivatedLastSubjectRemovesDiscoverableInventory()
    { await using var factory = await fixture.CreateFactoryAsync(); await Seed(factory); await using var scope = factory.Services.CreateAsyncScope(); var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>(); foreach (var subject in await db.Subjects.ToListAsync()) subject.IsActive = false; await db.SaveChangesAsync(); using var client = factory.CreateApiClient(); var body = await client.GetFromJsonAsync<JsonElement>("/api/v1/tutors"); Assert.Equal(0, body.GetProperty("totalCount").GetInt32()); }

    [Fact]
    public async Task SqlCapacityMatchesDomainForMultiDayFragmentsAndDurationBounds()
    {
        await using var factory = await fixture.CreateFactoryAsync(); var ids = await Seed(factory);
        await using (var scope = factory.Services.CreateAsyncScope()) { var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>(); db.AvailabilitySlots.Add(new AvailabilitySlot { Id = Guid.NewGuid(), TutorProfileId = ids[0], DayOfWeek = 2, StartTime = new(18, 0), EndTime = new(20, 0) }); await db.SaveChangesAsync(); }
        var desired = new[] { new WeeklyWindow(1, new(18, 0), new(21, 0)), new WeeklyWindow(1, new(18, 0), new(21, 0)), new WeeklyWindow(2, new(18, 0), new(20, 0)) };
        WeeklyWindow[][] available = [[new(1, new(18, 0), new(20, 0)), new(2, new(18, 0), new(20, 0))], [new(1, new(18, 0), new(19, 0)), new(1, new(20, 0), new(21, 0))]];
        var windows = Uri.EscapeDataString(JsonSerializer.Serialize(desired.Select(w => new { dayOfWeek = w.DayOfWeek, startTime = w.StartTime.ToString("HH:mm"), endTime = w.EndTime.ToString("HH:mm") })));
        using var client = factory.CreateApiClient();
        foreach (var duration in new[] { 30, 60, 90, 240 }) foreach (var sessions in new[] { 1, 2, 3, 21 })
        {
            var expected = available.Select((a, index) => new { capacity = WeeklyAvailability.Capacity(a, desired, duration), index }).Where(x => x.capacity >= sessions).Select(x => ids[x.index]).Order();
            var result = await client.GetFromJsonAsync<JsonElement>($"/api/v1/tutors?sessionsPerWeek={sessions}&durationMinutes={duration}&weeklyWindows={windows}");
            Assert.Equal(expected, result.GetProperty("items").EnumerateArray().Select(x => x.GetProperty("id").GetGuid()).Order());
        }
    }
    [Fact]
    public async Task RejectsOutOfRangeAndMalformedWeeklyCriteria()
    {
        await using var factory = await fixture.CreateFactoryAsync(); using var client = factory.CreateApiClient();
        foreach (var (frequency, duration, day, start, end) in new[] { (22, 60, 1, "18:00", "20:00"), (1, 241, 1, "18:00", "20:00"), (1, 29, 1, "18:00", "20:00"), (1, 60, 0, "18:00", "20:00"), (1, 60, 1, "8:00", "20:00"), (1, 60, 1, "20:00", "18:00") })
        {
            var windows = Uri.EscapeDataString(JsonSerializer.Serialize(new[] { new { dayOfWeek = day, startTime = start, endTime = end } }));
            using var response = await client.GetAsync($"/api/v1/tutors?sessionsPerWeek={frequency}&durationMinutes={duration}&weeklyWindows={windows}"); Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }
    }

    internal static async Task<Guid[]> Seed(ApiWebApplicationFactory factory)
    {
        await using var scope = factory.Services.CreateAsyncScope(); var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>(); var manager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        db.Subjects.Add(new Subject { Id = English, Name = "Tiếng Anh" }); db.Provinces.Add(new Province { ProvinceCode = "P", ProvinceName = "Tỉnh mẫu" }); db.Districts.Add(new District { DistrictCode = "D", ProvinceCode = "P", DistrictName = "Quận mẫu" }); await db.SaveChangesAsync();
        var ids = new List<Guid>();
        for (var i = 0; i < 3; i++)
        {
            var user = new ApplicationUser { Id = Guid.NewGuid(), UserName = $"search{i}@example.test", Email = $"search{i}@example.test", FullName = i == 0 ? "Nguyễn Ánh" : "Trần Bình", Role = AccountRole.TUTOR, Status = i == 2 ? AccountStatus.LOCKED : AccountStatus.ACTIVE }; Assert.True((await manager.CreateAsync(user, "password")).Succeeded);
            var p = new TutorProfile { Id = Guid.NewGuid(), UserId = user.Id, Status = TutorProfileStatus.APPROVED, SessionRateVnd = i == 0 ? 150000 : 200000, HourlyRateVnd = i == 0 ? 900000 : 10000, Degree = "Cử nhân", Bio = "Giới thiệu", TeachingModes = i == 0 ? ["ONLINE"] : ["HYBRID"], ProvinceCode = "P", DistrictCode = "D", ApprovedAt = DateTimeOffset.UtcNow };
            db.TutorProfiles.Add(p); await db.SaveChangesAsync(); ids.Add(p.Id);
            db.TutorSubjects.Add(new TutorSubject { TutorProfileId = p.Id, SubjectId = TutorDiscoverySeed.MathId }); db.TutorSubjects.Add(new TutorSubject { TutorProfileId = p.Id, SubjectId = English });
            db.Set<TutorSubjectLevel>().Add(new TutorSubjectLevel { TutorProfileId = p.Id, SubjectId = TutorDiscoverySeed.MathId, LevelCode = "HIGH_SCHOOL" }); db.Set<TutorSubjectLevel>().Add(new TutorSubjectLevel { TutorProfileId = p.Id, SubjectId = English, LevelCode = "PRIMARY" });
            db.AvailabilitySlots.AddRange(new AvailabilitySlot { Id = Guid.NewGuid(), TutorProfileId = p.Id, DayOfWeek = 1, StartTime = new TimeOnly(18, 0), EndTime = new TimeOnly(19, 0) }, new AvailabilitySlot { Id = Guid.NewGuid(), TutorProfileId = p.Id, DayOfWeek = 1, StartTime = new TimeOnly(i == 0 ? 19 : 20, 0), EndTime = new TimeOnly(i == 0 ? 20 : 21, 0) }); await db.SaveChangesAsync();
        }
        return ids.ToArray();
    }
}
