namespace TutorMatching.Domain.Hiring;

public sealed record FinalAgreement(HireTerms Terms, Guid AcceptedBy, DateTimeOffset AcceptedAt,
    int? ProposalSequence, string? ProvinceName, string? DistrictName)
{
    public DateTimeOffset AcceptedAt { get; } = AcceptedAt.ToUniversalTime();
}
