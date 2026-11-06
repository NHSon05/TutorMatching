using System.Diagnostics;
using TutorMatching.Infrastructure.Storage;

namespace TutorMatching.Application.UnitTests.Storage;

public sealed class RedisDeduplicationServiceTests
{
    [Fact]
    public async Task CheckAndRegisterAsync_ExactDuplicateWithin24h_ReturnsCachedDemandPostIdUnder10ms()
    {
        var service = new RedisDeduplicationService();
        var actor = "ip:203.113.10.5";
        var rawContent = "Cần tìm gia sư Toán lớp 9 ôn thi vào 10 khu vực Cầu Giấy, học phí 250k/buổi";
        var firstCandidateId = Guid.NewGuid();
        var secondCandidateId = Guid.NewGuid();

        var firstResult = await service.CheckAndRegisterAsync(actor, rawContent, firstCandidateId);

        Assert.False(firstResult.IsDuplicate);
        Assert.False(firstResult.IsNearDuplicate);
        Assert.Equal(firstCandidateId, firstResult.DemandPostId);

        var stopwatch = Stopwatch.StartNew();
        var secondResult = await service.CheckAndRegisterAsync(actor, rawContent, secondCandidateId);
        stopwatch.Stop();

        Assert.True(secondResult.IsDuplicate);
        Assert.False(secondResult.IsNearDuplicate);
        Assert.Equal(firstCandidateId, secondResult.DemandPostId);
        Assert.True(stopwatch.ElapsedMilliseconds < 10, $"Expected < 10ms but took {stopwatch.ElapsedMilliseconds}ms");
    }

    [Fact]
    public async Task CheckAndRegisterAsync_NearDuplicateWithMinorEditWithin48h_DetectsViaSimHash()
    {
        var service = new RedisDeduplicationService();
        var actor = "ip:203.113.10.5";
        var original = "Cần tìm gia sư dạy Toán lớp 9 ôn thi vào 10 tại quận Cầu Giấy Hà Nội học phí 250k/buổi tuần 2 buổi";
        var modified = "Cần tìm gia sư dạy Toán lớp 9 ôn thi vào 10 tại quận Cầu Giấy Hà Nội học phí 250k/buổi tuần 2 buổi ạ";

        var firstId = Guid.NewGuid();
        var secondId = Guid.NewGuid();

        var first = await service.CheckAndRegisterAsync(actor, original, firstId);
        var second = await service.CheckAndRegisterAsync(actor, modified, secondId);

        Assert.False(first.IsDuplicate);
        Assert.True(second.IsDuplicate);
        Assert.True(second.IsNearDuplicate);
        Assert.Equal(firstId, second.DemandPostId);
    }

    [Fact]
    public async Task CheckAndRegisterAsync_DifferentRequirementsFromSameActor_BothAcceptedAsNew()
    {
        var service = new RedisDeduplicationService();
        var actor = "ip:203.113.10.5";
        var mathRequest = "Tìm gia sư dạy Toán lớp 12 ôn thi đại học khu vực Đống Đa học phí 300k/buổi";
        var englishRequest = "Cần giáo viên dạy Tiếng Anh giao tiếp online cho người đi làm tối thứ 3 và thứ 5";

        var first = await service.CheckAndRegisterAsync(actor, mathRequest, Guid.NewGuid());
        var second = await service.CheckAndRegisterAsync(actor, englishRequest, Guid.NewGuid());

        Assert.False(first.IsDuplicate);
        Assert.False(second.IsDuplicate);
        Assert.NotEqual(first.DemandPostId, second.DemandPostId);
    }

    [Fact]
    public async Task CheckRateLimitAsync_ExceedingMaxRequestsPerMinute_BlocksSubsequentRequests()
    {
        var service = new RedisDeduplicationService();
        var actor = "ip:198.51.100.42";

        for (var i = 1; i <= 3; i++)
        {
            var allowed = await service.CheckRateLimitAsync(actor, maxRequestsPerMinute: 3);
            Assert.True(allowed.IsAllowed);
            Assert.Equal(i, allowed.CurrentCount);
        }

        var blocked = await service.CheckRateLimitAsync(actor, maxRequestsPerMinute: 3);
        Assert.False(blocked.IsAllowed);
        Assert.True(blocked.RetryAfter > TimeSpan.Zero);
    }
}
