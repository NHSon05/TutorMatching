using TutorMatching.Domain.Content;

namespace TutorMatching.Domain.UnitTests.Content;

public sealed class DemandPostTests
{
    [Fact]
    public void Create_WithValidInputs_SetsPendingStatusAnd30DayExpiration()
    {
        var now = new DateTimeOffset(2026, 11, 6, 4, 0, 0, TimeSpan.Zero);
        var requesterId = Guid.NewGuid();

        var post = DemandPost.Create(
            actorFingerprint: "ip:127.0.0.1",
            contentHash: "a3f5c8e9b1d20495867123456789abcdef0123456789abcdef0123456789abcd",
            rawContent: "  Tìm gia sư Toán lớp 9 khu vực Cầu Giấy, học phí 250k/buổi  ",
            requesterUserId: requesterId,
            now: now);

        Assert.NotEqual(Guid.Empty, post.Id);
        Assert.Equal(requesterId, post.RequesterUserId);
        Assert.Equal("ip:127.0.0.1", post.ActorFingerprint);
        Assert.Equal("a3f5c8e9b1d20495867123456789abcdef0123456789abcdef0123456789abcd", post.ContentHash);
        Assert.Equal("Tìm gia sư Toán lớp 9 khu vực Cầu Giấy, học phí 250k/buổi", post.RawContent);
        Assert.Equal(PostStatus.PENDING, post.Status);
        Assert.Equal(now, post.CreatedAt);
        Assert.Equal(now.AddDays(30), post.ExpiresAt);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("Ngắn <10")]
    public void Create_WhenRawContentTooShort_ThrowsArgumentOutOfRangeException(string invalidContent)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            DemandPost.Create(
                actorFingerprint: "ip:127.0.0.1",
                contentHash: "hash123",
                rawContent: invalidContent));
    }

    [Fact]
    public void Create_WhenRawContentExceeds2000Chars_ThrowsArgumentOutOfRangeException()
    {
        var tooLongContent = new string('a', 2001);

        Assert.Throws<ArgumentOutOfRangeException>(() =>
            DemandPost.Create(
                actorFingerprint: "ip:127.0.0.1",
                contentHash: "hash123",
                rawContent: tooLongContent));
    }

    [Theory]
    [InlineData("", "valid-hash")]
    [InlineData("   ", "valid-hash")]
    [InlineData("valid-actor", "")]
    [InlineData("valid-actor", "   ")]
    public void Create_WhenActorOrContentHashBlank_ThrowsArgumentException(string actor, string hash)
    {
        Assert.Throws<ArgumentException>(() =>
            DemandPost.Create(
                actorFingerprint: actor,
                contentHash: hash,
                rawContent: "Tìm gia sư Tiếng Anh lớp 7 tại Đống Đa, Hà Nội"));
    }

    [Fact]
    public void StateTransitions_UpdatePostStatusCorrectly()
    {
        var post = DemandPost.Create(
            actorFingerprint: "ip:127.0.0.1",
            contentHash: "hash123",
            rawContent: "Tìm gia sư Lý lớp 11 tại Hai Bà Trưng, Hà Nội");

        post.MarkExtracted();
        Assert.Equal(PostStatus.EXTRACTED, post.Status);

        post.MarkDuplicate();
        Assert.Equal(PostStatus.DUPLICATE, post.Status);

        post.MarkRejected();
        Assert.Equal(PostStatus.REJECTED, post.Status);

        post.MarkFailed();
        Assert.Equal(PostStatus.FAILED, post.Status);
    }
}
