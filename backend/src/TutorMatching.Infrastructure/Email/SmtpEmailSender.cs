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
        cancellationToken.ThrowIfCancellationRequested();
        EmailInput.Validate(recipient, subject, plainTextBody);
        var settings = options.Value;

        var message = new MimeMessage();
        message.From.Add(MailboxAddress.Parse(settings.FromAddress));
        message.To.Add(MailboxAddress.Parse(recipient));
        message.Subject = subject;
        message.Body = new TextPart("plain")
        {
            Text = plainTextBody
        };

        // No protocol logger: SMTP traffic contains addresses, reset links and tokens.
        using var client = new MailKit.Net.Smtp.SmtpClient();
        using var deadline = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        deadline.CancelAfter(TimeSpan.FromSeconds(settings.TimeoutSeconds));
        try
        {
            await client.ConnectAsync(settings.Host, settings.Port,
                settings.UseTls ? SecureSocketOptions.StartTls : SecureSocketOptions.None,
                deadline.Token);
            await client.SendAsync(message, deadline.Token);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception) when (exception is IOException or System.Net.Sockets.SocketException
            or MailKit.ProtocolException or MailKit.CommandException or OperationCanceledException
            or System.Security.Authentication.AuthenticationException or NotSupportedException
            or MailKit.ServiceNotAuthenticatedException)
        {
            // Do not preserve the server response/inner exception: it can echo private content.
            throw new EmailDeliveryException();
        }
        // SMTP accepted the message. Close without QUIT to avoid reporting a disconnect
        // failure as a delivery failure, which could prompt a duplicate resend.
        await client.DisconnectAsync(false, CancellationToken.None);
    }
}
