using System.Text.Json.Serialization;
using TutorMatching.Domain.Tutors;
using TutorMatching.Domain.Users;

namespace TutorMatching.Api.Contracts.Auth;

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed record LoginRequest(string Email, string Password);

public sealed record LoginResponse(
    Guid Id,
    string Email,
    string FullName,
    [property: JsonConverter(typeof(JsonStringEnumConverter<AccountRole>))] AccountRole Role,
    [property: JsonConverter(typeof(JsonStringEnumConverter<AccountStatus>))] AccountStatus Status,
    string AccessToken,
    string RefreshToken,
    string? AvatarUrl,
    [property: JsonConverter(typeof(JsonStringEnumConverter<TutorProfileStatus>))] TutorProfileStatus? TutorProfileStatus = null);
