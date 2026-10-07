using System.Net.Http.Json;
using System.Text.Json.Nodes;
using DotNet.Testcontainers.Builders;
using DotNet.Testcontainers.Containers;
using Microsoft.Extensions.Options;
using TutorMatching.Infrastructure.Email;

namespace TutorMatching.Api.IntegrationTests.Email;

public sealed class MailpitFixture : IAsyncLifetime
{
    private readonly IContainer container = new ContainerBuilder("axllent/mailpit:v1.27.8")
        .WithPortBinding(1025, true)
        .WithPortBinding(8025, true)
        .WithWaitStrategy(Wait.ForUnixContainer().UntilHttpRequestIsSucceeded(request =>
            request.ForPort(8025).ForPath("/api/v1/messages")))
        .Build();

    public Task InitializeAsync() => container.StartAsync();
    public Task DisposeAsync() => container.DisposeAsync().AsTask();
    public SmtpEmailSender Sender(bool useTls = false) => new(Options.Create(new SmtpOptions
    {
        Host = container.Hostname,
        Port = container.GetMappedPublicPort(1025),
        FromAddress = "no-reply@example.test",
        UseTls = useTls
    }));
    public HttpClient ApiClient() => new()
    {
        BaseAddress = new Uri($"http://{container.Hostname}:{container.GetMappedPublicPort(8025)}")
    };
}

public sealed class SmtpSandboxTests(MailpitFixture fixture) : IClassFixture<MailpitFixture>
{
    [Fact]
    public async Task SendsPlainTextEmailThroughRealSmtp()
    {
        const string body = "Đặt lại mật khẩu: https://example.test/reset?token=synthetic-only";
        await fixture.Sender().SendAsync("recipient@example.test", "Khôi phục tài khoản", body);
        using var client = fixture.ApiClient();
        var listing = await client.GetFromJsonAsync<JsonObject>("/api/v1/messages");
        var message = Assert.Single(listing!["messages"]!.AsArray());
        var id = message!["ID"]!.GetValue<string>();
        var detail = await client.GetFromJsonAsync<JsonObject>($"/api/v1/message/{id}");
        // Do not print bodies or tokens in assertion failures.
        Assert.True(detail!["Text"]!.GetValue<string>().TrimEnd() == body);
        Assert.True(detail["Subject"]!.GetValue<string>() == "Khôi phục tài khoản");
        Assert.True(detail["To"]![0]!["Address"]!.GetValue<string>() == "recipient@example.test");
        Assert.True(detail["From"]!["Address"]!.GetValue<string>() == "no-reply@example.test");
    }

    [Fact]
    public async Task RequiredTlsDoesNotSilentlyDowngradeOnPlaintextSandbox()
    {
        var error = await Assert.ThrowsAsync<EmailDeliveryException>(() => fixture.Sender(useTls: true)
            .SendAsync("recipient@example.test", "Reset", "synthetic-token"));
        Assert.Null(error.InnerException);
        var leaksContent = error.ToString().Contains("synthetic-token") ||
            error.ToString().Contains("recipient@example.test");
        Assert.False(leaksContent);
    }
}
