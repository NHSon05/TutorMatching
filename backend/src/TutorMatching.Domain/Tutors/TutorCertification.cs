namespace TutorMatching.Domain.Tutors;

public sealed class TutorCertification
{
    public string Name { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public int? IssueYear { get; set; }
    public string FileUrl { get; set; } = string.Empty;
}
