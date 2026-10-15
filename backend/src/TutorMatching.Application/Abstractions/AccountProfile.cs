using TutorMatching.Domain.Tutors;
using TutorMatching.Domain.Users;

namespace TutorMatching.Application.Abstractions;

/// <summary>Private account projection for authorized use cases; not a public API response.</summary>
public sealed record AccountProfile(
    Guid Id,
    string Email,
    string FullName,
    AccountRole Role,
    AccountStatus Status,
    string? PhoneNumber,
    DateOnly? DateOfBirth,
    string? AvatarUrl,
    TutorProfileStatus? TutorProfileStatus = null);

public sealed record ProfileUpdate(
    string FullName,
    string? PhoneNumber,
    DateOnly? DateOfBirth,
    string? AvatarUrl);
