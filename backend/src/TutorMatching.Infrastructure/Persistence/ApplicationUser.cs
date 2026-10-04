using Microsoft.AspNetCore.Identity;
using TutorMatching.Domain.Users;

namespace TutorMatching.Infrastructure.Persistence;

public sealed class ApplicationUser : IdentityUser<Guid>
{
    public string FullName { get; set; } = string.Empty;

    public DateOnly? DateOfBirth { get; set; }

    public string? AvatarUrl { get; set; }

    public AccountStatus Status { get; set; } = AccountStatus.ACTIVE;

    public DateTimeOffset? LastLoginAt { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }

    public DateTimeOffset? DeletedAt { get; set; }
}
