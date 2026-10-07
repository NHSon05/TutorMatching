namespace TutorMatching.Infrastructure.Email;

public sealed class SmtpOptions
{
    public string Host { get; set; } = "localhost";
    public int Port { get; set; } = 1025;
    public string FromAddress { get; set; } = "no-reply@tutormatching.local";
    public bool UseTls { get; set; }
    public int TimeoutSeconds { get; set; } = 15;
}
