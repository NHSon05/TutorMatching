using System.Text.Json.Serialization;

namespace TutorMatching.Api.Contracts.Users;

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed record UpdateProfileRequest(string? FullName, string? PhoneNumber = null,
    DateOnly? DateOfBirth = null, string? AvatarUrl = null);
