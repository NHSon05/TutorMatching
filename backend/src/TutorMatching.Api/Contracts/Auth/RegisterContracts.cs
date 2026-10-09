using System.Text.Json.Serialization;
using TutorMatching.Domain.Users;

namespace TutorMatching.Api.Contracts.Auth;

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed record RegisterRequest(
    string FullName,
    string Email,
    string? PhoneNumber,
    string Password,
    string PasswordConfirmation,
    string Role);

public sealed record AccountResponse(
    Guid Id,
    string Email,
    string FullName,
    [property: JsonConverter(typeof(JsonStringEnumConverter<AccountRole>))] AccountRole Role,
    [property: JsonConverter(typeof(JsonStringEnumConverter<AccountStatus>))] AccountStatus Status);
