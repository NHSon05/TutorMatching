using System.Globalization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using TutorMatching.Application.Abstractions;
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
        // Explicit allowlist; retain the legacy single-origin configuration.
        var configuredOrigins = configuration.GetSection("Frontend:Origins").Get<string[]>() ?? [];
        if (configuration["Frontend:Origin"] is { Length: > 0 } legacyOrigin)
            configuredOrigins = [.. configuredOrigins, legacyOrigin];
        if (configuredOrigins.Length == 0)
            throw new InvalidOperationException("Frontend:Origins must contain at least one origin.");
        var origins = configuredOrigins.Select(origin =>
        {
            if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri) ||
                (uri.Scheme != "http" && uri.Scheme != "https") ||
                !string.IsNullOrEmpty(uri.UserInfo) || uri.AbsolutePath != "/" ||
                !string.IsNullOrEmpty(uri.Query) || !string.IsNullOrEmpty(uri.Fragment) ||
                (!environment.IsDevelopment() && uri.Scheme != "https" && uri.Host != "localhost"))
            {
                throw new InvalidOperationException("Frontend origins must be explicit HTTP(S) origins; non-local origins require HTTPS outside Development.");
            }
            return uri.GetLeftPart(UriPartial.Authority);
        }).Distinct(StringComparer.OrdinalIgnoreCase).ToArray();

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
        var jwt = JwtSettings.Load(configuration, securePolicy);
        services.AddSingleton(jwt);
        services.AddScoped<JwtCookieTokens>();
        services.AddAuthentication(options =>
        {
            options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultForbidScheme = JwtBearerDefaults.AuthenticationScheme;
        }).AddJwtBearer(options =>
        {
            options.MapInboundClaims = false;
            options.IncludeErrorDetails = false;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = jwt.Issuer,
                ValidateAudience = true,
                ValidAudience = jwt.Audience,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(jwt.SigningKey),
                RequireSignedTokens = true,
                RequireExpirationTime = true,
                ValidateLifetime = true,
                ValidAlgorithms = [SecurityAlgorithms.HmacSha256],
                ClockSkew = TimeSpan.Zero,
                NameClaimType = "sub",
                RoleClaimType = "role"
            };
            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    if (context.Request.Cookies.TryGetValue(JwtCookieTokens.AccessCookie, out var token) && !string.IsNullOrWhiteSpace(token))
                        context.Token = token;
                    else context.NoResult(); // Do not fall back to a client-supplied Authorization header.
                    return Task.CompletedTask;
                },
                OnTokenValidated = async context =>
                {
                    var principal = context.Principal!;
                    if (!Guid.TryParse(principal.FindFirstValue("sub"), out var userId) ||
                        !Guid.TryParse(principal.FindFirstValue("sid"), out var sessionId) ||
                        !await context.HttpContext.RequestServices.GetRequiredService<ITokenSessionService>()
                            .ValidateAsync(sessionId, userId, principal.FindFirstValue("role") ?? string.Empty, context.HttpContext.RequestAborted))
                    {
                        context.Fail("Invalid session.");
                        return;
                    }
                    // Identity current-user and antiforgery both need a stable account identifier.
                    var identity = (ClaimsIdentity)principal.Identity!;
                    identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, userId.ToString()));
                    if (principal.FindFirstValue("role") is { Length: > 0 } role)
                    {
                        identity.AddClaim(new Claim(ClaimTypes.Role, role));
                    }
                },
                OnChallenge = async context =>
                {
                    context.HandleResponse();
                    await Results.Problem(statusCode: 401, title: "Authentication required.").ExecuteAsync(context.HttpContext);
                },
                OnForbidden = async context =>
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    await Results.Problem(statusCode: 403, title: "Access denied.").ExecuteAsync(context.HttpContext);
                }
            };
        });
        services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
            .Configure<TimeProvider>((options, clock) =>
            {
                options.TokenValidationParameters.LifetimeValidator = (notBefore, expires, _, _) =>
                    expires.HasValue && expires.Value > clock.GetUtcNow().UtcDateTime &&
                    (!notBefore.HasValue || notBefore.Value <= clock.GetUtcNow().UtcDateTime);
            });

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
            .WithOrigins(origins)
            .WithMethods("GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
            .WithHeaders("Content-Type", CsrfHeader, "Authorization", "Accept", "Origin", "X-Requested-With")
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
            return TypedResults.Ok(new CsrfTokenResponse
            {
                RequestToken = tokens.RequestToken!,
                HeaderName = CsrfHeader
            });
        }).AllowAnonymous().WithName("GetCsrfToken")
            .WithGroupName("v1")
            .ProducesProblem(StatusCodes.Status429TooManyRequests);

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
