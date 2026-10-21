using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using TutorMatching.Domain.Users;

namespace TutorMatching.Infrastructure.Persistence;

public sealed class ApplicationUserStore(ApplicationDbContext context, IdentityErrorDescriber? describer = null)
    : UserOnlyStore<ApplicationUser, ApplicationDbContext, Guid, IdentityUserClaim<Guid>, IdentityUserLogin<Guid>, IdentityUserToken<Guid>>(context, describer),
      IUserRoleStore<ApplicationUser>
{
    public Task AddToRoleAsync(ApplicationUser user, string roleName, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(user);
        if (Enum.TryParse<AccountRole>(roleName, true, out var role) && Enum.IsDefined(role))
        {
            user.Role = role;
            return Task.CompletedTask;
        }

        throw new InvalidOperationException($"Invalid role '{roleName}'.");
    }

    public Task RemoveFromRoleAsync(ApplicationUser user, string roleName, CancellationToken cancellationToken = default)
    {
        throw new InvalidOperationException("An account must retain a canonical role. Replace its role or deactivate the account instead.");
    }

    public Task<IList<string>> GetRolesAsync(ApplicationUser user, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(user);
        return Task.FromResult<IList<string>>([user.Role.ToString()]);
    }

    public Task<bool> IsInRoleAsync(ApplicationUser user, string roleName, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(user);
        return Task.FromResult(string.Equals(user.Role.ToString(), roleName, StringComparison.OrdinalIgnoreCase));
    }

    public async Task<IList<ApplicationUser>> GetUsersInRoleAsync(string roleName, CancellationToken cancellationToken = default)
    {
        if (!Enum.TryParse<AccountRole>(roleName, true, out var role) || !Enum.IsDefined(role))
        {
            return [];
        }

        return await Users.Where(u => u.Role == role).ToListAsync(cancellationToken);
    }
}
