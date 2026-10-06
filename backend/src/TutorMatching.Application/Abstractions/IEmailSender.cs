namespace TutorMatching.Application.Abstractions;

public interface IEmailSender
{
    Task SendAsync(string recipient, string subject, string plainTextBody,
        CancellationToken cancellationToken = default);
}
