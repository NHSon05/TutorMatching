using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using TutorMatching.Application.Abstractions;
using TutorMatching.Domain.Users;

namespace TutorMatching.Infrastructure.Authentication;

public sealed class CurrentUser(IHttpContextAccessor accessor) : ICurrentUser
{
    public bool IsAuthenticated => accessor.HttpContext?.User.Identity?.IsAuthenticated == true;
    public Guid? UserId => IsAuthenticated && Guid.TryParse(accessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;
    public AccountRole? Role => IsAuthenticated && Enum.TryParse<AccountRole>(accessor.HttpContext?.User.FindFirstValue(ClaimTypes.Role), out var role) && Enum.IsDefined(role) ? role : null;
}
