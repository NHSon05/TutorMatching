using System.Globalization;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using TutorMatching.Domain.Users;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Api.Security;

public sealed class SessionCookieEvents(
    TimeProvider clock,
    SignInManager<ApplicationUser> signInManager) : CookieAuthenticationEvents
{
    private const string StartedAt = "TutorMatching.SessionStartedAt";
    public static readonly TimeSpan IdleTimeout = TimeSpan.FromMinutes(30);
    public static readonly TimeSpan AbsoluteTimeout = TimeSpan.FromHours(8);

    public override Task SigningIn(CookieSigningInContext context)
    {
        var now = clock.GetUtcNow();
        context.Properties.Items[StartedAt] = now.UtcTicks.ToString(CultureInfo.InvariantCulture);
        context.Properties.IssuedUtc = now;
        context.Properties.ExpiresUtc = now.Add(IdleTimeout);
        context.Properties.IsPersistent = false;
        return Task.CompletedTask;
    }

    public override async Task ValidatePrincipal(CookieValidatePrincipalContext context)
    {
        var now = clock.GetUtcNow();
        if (!context.Properties.Items.TryGetValue(StartedAt, out var startedAt) ||
            !long.TryParse(startedAt, NumberStyles.None, CultureInfo.InvariantCulture, out var ticks) ||
            ticks > now.UtcTicks || now.UtcTicks - ticks >= AbsoluteTimeout.Ticks)
        {
            await RejectAsync(context);
            return;
        }

        var user = await signInManager.ValidateSecurityStampAsync(context.Principal);
        if (user is null || user.Status != AccountStatus.ACTIVE || user.DeletedAt is not null)
        {
            await RejectAsync(context);
            return;
        }

        if (signInManager.UserManager.SupportsUserRole)
        {
            var roles = await signInManager.UserManager.GetRolesAsync(user);
            var claimedRoles = context.Principal!.FindAll(ClaimTypes.Role).Select(x => x.Value).ToArray();
            if (roles.Count != 1 || claimedRoles.Length != 1 || roles[0] != claimedRoles[0])
            {
                await RejectAsync(context);
                return;
            }
        }

        context.ShouldRenew = true;
    }

    private static async Task RejectAsync(CookieValidatePrincipalContext context)
    {
        context.RejectPrincipal();
        await context.HttpContext.SignOutAsync(IdentityConstants.ApplicationScheme);
    }

    public override Task RedirectToLogin(RedirectContext<CookieAuthenticationOptions> context)
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return Task.CompletedTask;
    }

    public override Task RedirectToAccessDenied(RedirectContext<CookieAuthenticationOptions> context)
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        return Task.CompletedTask;
    }
}
