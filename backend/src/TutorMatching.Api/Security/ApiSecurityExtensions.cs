using System.Globalization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection.Extensions;
using TutorMatching.Domain.Users;

namespace TutorMatching.Api.Security;

public static class ApiSecurityExtensions
{
    public const string FrontendCorsPolicy = "Frontend";
    public const string CsrfHeader = "X-CSRF-TOKEN";

    public static IServiceCollection AddApiSecurity(this IServiceCollection services,
        IConfiguration configuration, IHostEnvironment environment)
    {
        // check frontend origin
        var origin = configuration["Frontend:Origin"];
        if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri) ||
            (uri.Scheme != "http" && uri.Scheme != "https") ||
            !string.IsNullOrEmpty(uri.UserInfo) || uri.AbsolutePath != "/" ||
            !string.IsNullOrEmpty(uri.Query) || !string.IsNullOrEmpty(uri.Fragment) ||
            (!environment.IsDevelopment() && uri.Scheme != "https"))
        {
            throw new InvalidOperationException("Frontend:Origin must be an explicit HTTP(S) origin (HTTPS outside Development).");
        }

        // cookie policy & authentication
        var securePolicy = CookieSecurePolicy.Always;
        if (environment.IsDevelopment() && configuration["Cookie:SecurePolicy"] is { } policy)
        {
            if (!Enum.TryParse(policy, out securePolicy) ||
                securePolicy is not (CookieSecurePolicy.Always or CookieSecurePolicy.SameAsRequest))
            {
                throw new InvalidOperationException("Cookie:SecurePolicy must be Always or SameAsRequest.");
            }
        }

        var cookieName = configuration["Cookie:Name"] ?? "tutormatch_session";
        services.TryAddSingleton(TimeProvider.System);
        services.AddScoped<SessionCookieEvents>();
        services.AddAuthentication(IdentityConstants.ApplicationScheme)
            .AddCookie(IdentityConstants.ApplicationScheme, options =>
            {
                options.Cookie.Name = cookieName;
                options.Cookie.HttpOnly = true;
                options.Cookie.SecurePolicy = securePolicy;
                options.Cookie.SameSite = SameSiteMode.Lax;
                options.Cookie.Path = "/";
                options.ExpireTimeSpan = SessionCookieEvents.IdleTimeout;
                options.SlidingExpiration = true;
                options.EventsType = typeof(SessionCookieEvents);
            });
        services.AddOptions<CookieAuthenticationOptions>(IdentityConstants.ApplicationScheme)
            .Configure<TimeProvider>((options, clock) => options.TimeProvider = clock);

        // Authorization
        services.AddAuthorization(options =>
        {
            options.FallbackPolicy = new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser().Build();
            foreach (var role in Enum.GetValues<AccountRole>())
            {
                options.AddPolicy(role.ToString(), policy =>
                    policy.RequireAuthenticatedUser().RequireRole(role.ToString()));
            }
        });

        // CORS
        services.AddCors(options => options.AddPolicy(FrontendCorsPolicy, policy => policy
            .WithOrigins(uri.GetLeftPart(UriPartial.Authority))
            .WithMethods("GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
            .WithHeaders("Content-Type", CsrfHeader)
            .AllowCredentials()));

        // Anti CSRF
        services.AddAntiforgery(options =>
        {
            options.HeaderName = CsrfHeader;
            options.Cookie.Name = $"{cookieName}_csrf";
            options.Cookie.HttpOnly = true;
            options.Cookie.SecurePolicy = securePolicy;
            options.Cookie.SameSite = SameSiteMode.Lax;
            options.Cookie.Path = "/";
        });

        // Rate Limiting
        services.AddRateLimiter(options =>
        {
            // Partition only by the actual remote IP; never trust a client-supplied forwarding header.
            options.GlobalLimiter = PartitionedRateLimiter.CreateChained(
                PartitionedRateLimiter.Create<HttpContext, string>(context =>
                    RateLimitPartition.GetFixedWindowLimiter(ClientIp(context), _ => Window(120))),
                PartitionedRateLimiter.Create<HttpContext, string>(context =>
                    context.Request.Path.StartsWithSegments("/api/v1/auth") && IsUnsafe(context.Request.Method)
                        ? RateLimitPartition.GetFixedWindowLimiter(ClientIp(context), _ => Window(10))
                        : RateLimitPartition.GetNoLimiter("non-auth")));
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.OnRejected = async (context, cancellationToken) =>
            {
                if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                {
                    context.HttpContext.Response.Headers.RetryAfter =
                        Math.Ceiling(retryAfter.TotalSeconds).ToString(CultureInfo.InvariantCulture);
                }
                await Results.Problem(statusCode: 429, title: "Too many requests.")
                    .ExecuteAsync(context.HttpContext);
            };
        });
        return services;
    }

    // Middleware Pipeline
    public static IApplicationBuilder UseApiSecurity(this IApplicationBuilder app)
    {
        app.UseCors(FrontendCorsPolicy);
        app.UseRateLimiter();
        app.UseAuthentication();
        app.UseAuthorization();
        // Covers JSON controllers and minimal API endpoints, including anonymous login/register.
        app.Use(async (context, next) =>
        {
            if (context.Request.Path.StartsWithSegments("/api") && IsUnsafe(context.Request.Method))
            {
                try
                {
                    await context.RequestServices.GetRequiredService<IAntiforgery>()
                        .ValidateRequestAsync(context);
                }
                catch (AntiforgeryValidationException)
                {
                    await Results.Problem(statusCode: 400, title: "Invalid CSRF token.").ExecuteAsync(context);
                    return;
                }
            }
            await next(context);
        });
        return app;
    }

    public static IEndpointConventionBuilder MapCsrfEndpoint(this IEndpointRouteBuilder endpoints) =>
        endpoints.MapGet("/api/v1/auth/csrf", (HttpContext context, IAntiforgery antiforgery) =>
        {
            context.Response.Headers.CacheControl = "no-store";
            var tokens = antiforgery.GetAndStoreTokens(context);
            return Results.Ok(new { requestToken = tokens.RequestToken, headerName = CsrfHeader });
        }).AllowAnonymous().WithName("GetCsrfToken");

    private static bool IsUnsafe(string method) =>
        !HttpMethods.IsGet(method) && !HttpMethods.IsHead(method) &&
        !HttpMethods.IsOptions(method) && !HttpMethods.IsTrace(method);

    private static string ClientIp(HttpContext context) =>
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

    private static FixedWindowRateLimiterOptions Window(int permitLimit) => new()
    {
        PermitLimit = permitLimit,
        Window = TimeSpan.FromMinutes(1),
        QueueLimit = 0,
        AutoReplenishment = true
    };
}
