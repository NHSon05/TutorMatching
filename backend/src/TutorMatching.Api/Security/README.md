# T011 security foundation

`Program.cs` registers `AddApiSecurity` after Infrastructure and calls `UseApiSecurity`
after routing. The middleware order is CORS, rate limiting, authentication, authorization,
then CSRF validation before endpoint execution.

- Authentication uses the Identity application cookie: HTTP-only, SameSite=Lax, host-only,
  session cookie (no remember-me), 30-minute idle timeout and 8-hour absolute lifetime.
- The original issue time is protected inside the ticket and survives cookie renewals.
  Each authenticated request validates the current user/security stamp, ACTIVE state and
  absence of soft deletion. Password-reset stamp rotation rejects old cookies immediately.
- Cookie SecurePolicy is always `Always` outside Development. Development supports
  `Always` or `SameAsRequest` via `Cookie__SecurePolicy`.
- Identity is configured for five failed attempts and a 15-minute lockout. T028 must call
  the Identity password sign-in/check flow with `lockoutOnFailure: true`; configuration
  alone does not count attempts. No login endpoint is introduced by T011.
- Authentication is required by default. Public endpoints must explicitly opt out with
  `AllowAnonymous`. ADMIN/LEARNER/TUTOR policies check canonical roles; resource ownership
  remains the responsibility of T034/T035 and the corresponding use cases.
- CORS accepts credentials only from `Frontend__Origin`, a single explicit origin without
  path/query. It must use HTTPS outside Development. CORS is not an authorization mechanism.
- Rate limits are per remote IP: 120 requests/minute overall and 10 unsafe auth requests/minute
  shared across `/api/v1/auth/*`, with no queue. Rejection is 429 with Retry-After.
  Limits are process-local. Before deploying behind a proxy, configure trusted forwarded
  headers explicitly; arbitrary client X-Forwarded-For is not trusted.

## Frontend CSRF flow

1. Fetch `GET /api/v1/auth/csrf` with `credentials: "include"`. The response sets an HTTP-only
   CSRF cookie and returns `{ requestToken, headerName: "X-CSRF-TOKEN" }`, with `Cache-Control: no-store`.
2. Include credentials and the `X-CSRF-TOKEN` header on POST/PUT/PATCH/DELETE requests,
   including anonymous registration/login/reset. Invalid or missing tokens return 400.
3. Fetch a fresh token after login/logout, because the token is bound to the current identity.

Use same-site frontend/API hosts (e.g. localhost with different ports, or HTTPS subdomains
of the same site). Unrelated sites require a separately reviewed SameSite=None deployment;
CORS alone cannot override SameSite=Lax cookies.

## Verification and remaining work

`ApiSecurityTests` exercises real middleware/cookies through TestServer with a fake Identity
store and controlled clock, without connecting to PostgreSQL. Database-backed fixtures and
actual login/lockout/logout/password-reset journeys remain T015/T025-T029/T045-T049.
T028 must implement server-side logout revocation; deleting a browser cookie alone does not
invalidate copies of it. This foundation does not claim logout replay protection is complete.

References: Microsoft Learn [cookie authentication](https://learn.microsoft.com/aspnet/core/security/authentication/cookie?view=aspnetcore-10.0),
[antiforgery](https://learn.microsoft.com/aspnet/core/security/anti-request-forgery?view=aspnetcore-10.0),
[rate limiting](https://learn.microsoft.com/aspnet/core/performance/rate-limit?view=aspnetcore-10.0).
