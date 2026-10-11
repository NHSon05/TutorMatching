# T011 security foundation

`Program.cs` registers `AddApiSecurity` after Infrastructure and calls `UseApiSecurity`
after routing. The middleware order is CORS, rate limiting, authentication, authorization,
then CSRF validation before endpoint execution.

- Authentication uses a five-minute HS256 JWT access cookie and an opaque rotating refresh
  cookie: HTTP-only, SameSite=Lax, host-only, with 30-minute refresh expiry and 8-hour absolute lifetime.
- `Jwt__SigningKey` is required in every environment: Base64 of at least 32 random bytes.
  Generate a private development value with `openssl rand -base64 32`; use a secret store in production.
  Missing, malformed or short keys fail startup. No built-in signing key is accepted as a fallback.
- PostgreSQL stores session families and SHA-256 refresh hashes. Refresh and logout lock the
  same session row in a transaction; replay of a consumed token revokes the family.
- Migration `20261010031244_AddTokenSessions` supports both a fresh database and the legacy
  timestamp schema recorded as `20261009000000_AddTokenSessions` in existing installations.
  It renames `LastActivityAt`, preserves revocation/consumption in the new booleans, retains
  nullable legacy audit timestamps, and bounds refresh expiry by creation + 30m and session
  absolute expiry. It never drops existing token tables. Automatic downgrade is intentionally
  rejected because those tables may predate this migration; use a forward migration instead.
- Migration `20261011113055_UseTokenStateTimestamps` replaces the intermediate booleans with
  `revoked_at` / `consumed_at` as the sole persisted state. Known legacy times are preserved;
  true booleans without a time become PostgreSQL `-infinity` (Npgsql `DateTimeOffset.MinValue`),
  meaning unknown historical time, never the migration execution time. NULL means not yet
  revoked/consumed, not necessarily unexpired or authorized. Do not disable Npgsql infinity
  conversions. New transitions record actual UTC time; repeated logout preserves revocation time.
  Stop old API workers before migration; old binaries reference columns removed by this upgrade.
  Downgrade is rejected to avoid losing event times; use a reviewed forward migration.
- Each authenticated request and refresh validates the current user/security stamp, ACTIVE state,
  absence of soft deletion and exactly one current role matching the session. Role removal or
  replacement rejects old access even if the stamp is unchanged; refresh revokes the mismatched
  session. Password-reset stamp rotation rejects old cookies immediately.
- Cookie SecurePolicy is always `Always` outside Development. Development supports
  `Always` or `SameAsRequest` via `Cookie__SecurePolicy`.
- Identity is configured for five failed attempts and a 15-minute lockout. T028 must call
  the Identity password sign-in/check flow with `lockoutOnFailure: true`; configuration
  alone does not count attempts. Login uses `CheckPasswordSignInAsync` with this flag enabled.
- Authentication is required by default. Public endpoints must explicitly opt out with
  `AllowAnonymous`. ADMIN/LEARNER/TUTOR policies check canonical roles; resource ownership
  remains the responsibility of T034/T035 and the corresponding use cases.
- CORS accepts credentials from the explicit `Frontend:Origins` array (environment variables
  `Frontend__Origins__0`, `Frontend__Origins__1`, etc.). Legacy `Frontend__Origin` is also accepted.
  Defaults allow `http://localhost:3000` and `https://tutor-matching-psi.vercel.app`.
  Origins cannot contain paths/queries; trailing slashes are normalized. HTTPS is required outside
  Development except for explicitly configured localhost origins. CORS is not authorization.
  Local API uses port 5014; set Vercel's `NEXT_PUBLIC_API_BASE_URL` to the deployed HTTPS API URL
  ending in `/api/v1`, then rebuild the frontend.
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
4. Protected frontend requests use `authenticatedFetch`: on 401, coordinate renewal with a
   shared promise and Web Locks, recheck `/users/me`, fetch fresh CSRF, refresh, then retry once.
   Login/refresh/logout do not use this retry wrapper. Network/5xx/429 failures remain errors,
   not logout signals. Cross-tab coordination requires a Web Locks-capable browser on HTTPS
   (or localhost). Tabs must share the same frontend origin to share the lock.

Use same-site frontend/API hosts (e.g. localhost with different ports, or HTTPS subdomains
of the same site). Unrelated sites require a separately reviewed SameSite=None deployment;
CORS alone cannot override SameSite=Lax cookies.

## Verification and remaining work

`ApiSecurityTests` exercises real middleware/cookies through TestServer with a fake Identity
store and controlled clock. `SessionEndpointTests` uses disposable PostgreSQL databases with
real migrations, login/lockout/logout, refresh reuse detection and concurrent refresh/logout.
`TokenSessionMigrationTests` verifies upgrading populated legacy tables without reviving revoked,
consumed or expired credentials. `JwtSettingsTests` checks required key configuration.
Password-reset journeys remain separate work.

References: Microsoft Learn [cookie authentication](https://learn.microsoft.com/aspnet/core/security/authentication/cookie?view=aspnetcore-10.0),
[antiforgery](https://learn.microsoft.com/aspnet/core/security/anti-request-forgery?view=aspnetcore-10.0),
[rate limiting](https://learn.microsoft.com/aspnet/core/performance/rate-limit?view=aspnetcore-10.0).
