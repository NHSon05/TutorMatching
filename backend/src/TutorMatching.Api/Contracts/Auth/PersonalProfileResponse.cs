using System.Text.Json.Serialization;
using TutorMatching.Domain.Users;

namespace TutorMatching.Api.Contracts.Auth;

public sealed record PersonalProfileResponse(Guid Id, string Email, string FullName,
    [property: JsonConverter(typeof(JsonStringEnumConverter<AccountRole>))] AccountRole Role,
    [property: JsonConverter(typeof(JsonStringEnumConverter<AccountStatus>))] AccountStatus Status,
    string? PhoneNumber, DateOnly? DateOfBirth, string? AvatarUrl);
