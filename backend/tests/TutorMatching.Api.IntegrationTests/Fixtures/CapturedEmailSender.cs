using System.Collections.Concurrent;
using TutorMatching.Application.Abstractions;

namespace TutorMatching.Api.IntegrationTests.Fixtures;

public sealed class CapturedEmailSender : IEmailSender
{
    private readonly ConcurrentQueue<CapturedEmail> messages = new();
    public IReadOnlyList<CapturedEmail> Messages => messages.ToArray();

    public Task SendAsync(string recipient, string subject, string plainTextBody,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        messages.Enqueue(new CapturedEmail(recipient, subject, plainTextBody));
        return Task.CompletedTask;
    }

    public void Clear() => messages.Clear();
}

public sealed class CapturedEmail(string recipient, string subject, string body)
{
    public string Recipient { get; } = recipient;
    public string Subject { get; } = subject;
    public string Body { get; } = body;
    public override string ToString() => "CapturedEmail [redacted]";
}
