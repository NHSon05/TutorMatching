using MimeKit;

namespace TutorMatching.Infrastructure.Email;

internal static class EmailInput
{
    public static void Validate(string recipient, string subject, string body)
    {
        if (string.IsNullOrWhiteSpace(recipient) || recipient.Contains('\r') || recipient.Contains('\n') ||
            !MailboxAddress.TryParse(recipient, out var mailbox) || !mailbox.Address.Contains('@'))
            throw new ArgumentException("A valid recipient is required.", nameof(recipient));
        if (string.IsNullOrWhiteSpace(subject) || subject.Contains('\r') || subject.Contains('\n'))
            throw new ArgumentException("A single-line subject is required.", nameof(subject));
        ArgumentNullException.ThrowIfNull(body);
    }
}
