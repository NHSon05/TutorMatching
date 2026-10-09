using System.Text.Json.Serialization;

namespace TutorMatching.Api.Contracts.Auth;

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed record LoginRequest(string Email, string Password);
