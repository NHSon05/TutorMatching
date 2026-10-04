using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TutorMatching.Domain.Users;

namespace TutorMatching.Infrastructure.Persistence;

public sealed class DevelopmentDataSeeder(
    RoleManager<IdentityRole<Guid>> roleManager,
    UserManager<ApplicationUser> userManager,
    IConfiguration configuration)
{
    public async Task SeedAsync()
    {
        foreach (var role in Enum.GetValues<AccountRole>())
        {
            var roleName = role.ToString();
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                EnsureSucceeded(
                    await roleManager.CreateAsync(new IdentityRole<Guid>(roleName)),
                    $"create the canonical {roleName} role");
            }
        }

        if (!bool.TryParse(configuration["SeedAdmin:Enabled"], out var enabled) || !enabled)
        {
            return;
        }

        var email = RequireSetting("SeedAdmin:Email").Trim();
        var password = RequireSetting("SeedAdmin:Password");
        var fullName = RequireSetting("SeedAdmin:FullName").Trim();

        if (fullName.Length is < 2 or > 100)
        {
            throw new InvalidOperationException("SeedAdmin:FullName must contain 2-100 characters.");
        }

        var existingUser = await userManager.FindByEmailAsync(email);
        if (existingUser is not null)
        {
            if (!await userManager.IsInRoleAsync(existingUser, AccountRole.ADMIN.ToString()))
            {
                throw new InvalidOperationException(
                    "The configured seed email already belongs to a non-Admin account.");
            }

            return;
        }

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = email,
            UserName = email,
            FullName = fullName,
            EmailConfirmed = true,
            Status = AccountStatus.ACTIVE,
        };

        EnsureSucceeded(
            await userManager.CreateAsync(user, password),
            "create the controlled Admin demo account");
        EnsureSucceeded(
            await userManager.AddToRoleAsync(user, AccountRole.ADMIN.ToString()),
            "assign the Admin role to the controlled demo account");
    }

    private string RequireSetting(string key)
    {
        var value = configuration[key];
        return string.IsNullOrWhiteSpace(value)
            ? throw new InvalidOperationException($"{key} is required when Admin seed is enabled.")
            : value;
    }

    private static void EnsureSucceeded(IdentityResult result, string operation)
    {
        if (result.Succeeded)
        {
            return;
        }

        var errorCodes = string.Join(", ", result.Errors.Select(error => error.Code));
        throw new InvalidOperationException($"Failed to {operation}: {errorCodes}");
    }
}
