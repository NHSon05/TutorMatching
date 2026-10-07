using Microsoft.Extensions.Options;
using TutorMatching.Infrastructure.Email;

namespace TutorMatching.Api.IntegrationTests.Email;

public sealed class EmailAdapterTests
{
    [Fact]
    public async Task CaptureIsThreadSafeResettableAndRedacted()
    {
        var sender = new CapturedEmailSender();
        await Task.WhenAll(Enumerable.Range(0, 30).Select(i => Task.Run(() => sender.SendAsync(
            "recipient@example.test", "Reset", $"https://example.test/reset?token=synthetic-{i}"))));
        Assert.Equal(30, sender.Messages.Count);
        Assert.Equal(30, sender.Messages.Select(message => message.Body).Distinct().Count());
        Assert.All(sender.Messages, message => Assert.Equal("CapturedEmail [redacted]", message.ToString()));
        sender.Clear();
        Assert.Empty(sender.Messages);
    }

    [Theory]
    [InlineData("not-an-email", "Reset")]
    [InlineData("recipient@example.test\r\nBcc: other@example.test", "Reset")]
    [InlineData("recipient@example.test", "Reset\r\nInjected")]
    public async Task BothAdaptersRejectUnsafeInputWithoutEchoingIt(string recipient, string subject)
    {
        var capture = new CapturedEmailSender();
        var smtp = new SmtpEmailSender(Options.Create(new SmtpOptions()));
        foreach (var sender in new TutorMatching.Application.Abstractions.IEmailSender[] { capture, smtp })
        {
            var error = await Assert.ThrowsAsync<ArgumentException>(() => sender.SendAsync(recipient, subject, "synthetic-token"));
            var leaksContent = error.ToString().Contains("synthetic-token") || error.ToString().Contains(recipient);
            Assert.False(leaksContent);
        }
        Assert.Empty(capture.Messages);
    }

    [Fact]
    public async Task SmtpHonorsCancellationBeforeConnecting()
    {
        var sender = new SmtpEmailSender(Options.Create(new SmtpOptions { Host = "unused.invalid" }));
        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => sender.SendAsync(
            "recipient@example.test", "Test", "Synthetic", new CancellationToken(true)));
    }
}
