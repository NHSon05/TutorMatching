using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using TutorMatching.Application.Abstractions;

namespace TutorMatching.Infrastructure.Email;

public sealed class SmtpEmailSender(
    IOptions<SmtpOptions> options
) : IEmailSender
{
    public async Task SendAsync(
        string recipient,
        string subject,
        string plainTextBody,
        CancellationToken cancellationToken = default
    )
    {
        var settings = options.Value;

        var message = new MimeMessage();
        message.From.Add(MailboxAddress.Parse(settings.FromAddress));
        message.To.Add(MailboxAddress.Parse(recipient));
        message.Subject = subject;
        message.Body = new TextPart("plain")
        {
            Text = plainTextBody
        };

        using var client = new MailKit.Net.Smtp.SmtpClient();

        await client.ConnectAsync(
            settings.Host,
            settings.Port,
            settings.UseTls ? SecureSocketOptions.StartTls : SecureSocketOptions.None, cancellationToken
        );

        await client.SendAsync(message, cancellationToken);
        await client.DisconnectAsync(true, cancellationToken);
    }
}