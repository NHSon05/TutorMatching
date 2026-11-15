# Research: Sign In and Register with Google

All Technical Context unknowns are resolved below. Product decisions come from
[spec.md](spec.md) (confirmed 2026-11-14).

## R1. Authentication flow

- **Decision**: Google Identity Services (GIS) ID-token flow. The browser obtains a Google-signed ID
  token (`credential`) through the GIS button/popup and posts it to `POST /api/v1/auth/google`. The
  backend verifies it and issues the existing dual-cookie session.
- **Rationale**: Reuses the existing JSON + CSRF + `ITokenSessionService.CreateAsync` +
  `JwtCookieTokens.Issue` path unchanged. No client secret, no extra cookie scheme, no `state`
  handling across the Vercel frontend and the separately hosted API.
- **Alternatives considered**: ASP.NET `AddGoogle` server redirect (authorization-code flow) —
  needs a client secret, a temporary external cookie, callback redirects across two domains and a
  second session-issuing path; rejected for complexity. NextAuth/Auth.js on the frontend — would
  create a second session authority alongside the backend; rejected (constitution II/III).

## R2. ID-token verification

- **Decision**: `Google.Apis.Auth` `GoogleJsonWebSignature.ValidateAsync` with
  `Audience = [Google:ClientId]`, default issuer check (`accounts.google.com` /
  `https://accounts.google.com`), expiry check with a small clock tolerance (≤ 5 minutes), and
  `EmailVerified == true` enforced by the Application handler.
- **Rationale**: Maintained Google library; caches Google signing certificates; satisfies
  constitution II ("maintained security libraries").
- **Alternatives considered**: Manual JWKS validation with `Microsoft.IdentityModel` — more code
  and cert-rotation handling to own.
- **Port**: `IGoogleIdTokenVerifier` in Application; the Infrastructure adapter maps the payload to
  `ExternalIdentity(Subject, Email, EmailVerified, FullName, PictureUrl)` and returns `null` on any
  validation exception (exception text is never logged with the token).

## R3. Pending registration (role step)

- **Decision**: Stateless token from ASP.NET Data Protection `IDataProtector`, purpose
  `TutorMatching.GoogleSignup.v1`; payload = verified `ExternalIdentity` plus an expiry instant
  (10 minutes) serialized as JSON and checked against the injected `TimeProvider` (testable, unlike
  `ITimeLimitedDataProtector`, which reads the system clock). Returned only in the 202 response body.
- **Rationale**: Tamper-proof and expiring without a new table or Redis key; `AddDataProtection()` is
  already registered in `Infrastructure/DependencyInjection.cs`.
- **Risk**: Data Protection keys are currently not persisted. A restart or a second API instance
  invalidates outstanding pending tokens; acceptable because the user simply restarts Google sign-in
  (spec US2 scenario 4). Persisting keys is a deployment follow-up, not part of this feature.
- **Alternatives considered**: DB table of pending signups (needs cleanup job); Redis key (adds a
  Redis dependency to authentication).

## R4. Link storage

- **Decision**: Use the existing Identity `asp_net_user_logins` table through
  `UserManager.FindByLoginAsync` / `AddLoginAsync` (`ApplicationUserStore` extends `UserOnlyStore`,
  which implements `IUserLoginStore`). `login_provider = "Google"`, `provider_key = sub`,
  `provider_display_name = "Google"`. Add a unique index `(user_id, login_provider)` to enforce at
  most one Google link per account.
- **Rationale**: No new table; the PK `(login_provider, provider_key)` already guarantees one account
  per Google identity.

## R5. Auto-link policy

- **Decision**: Link only when the Google email is verified, an account with the same normalized email
  exists, it is `ACTIVE`, not deleted, not `ADMIN`, and has no Google link. Link and sign-in run in
  one transaction and write `ExternalLoginLinked` + `ExternalSignInSucceeded` audit events.
- **Rationale**: Product decision Q1; Google is authoritative for verified emails.

## R6. Password-less accounts

- **Decision**: `UserManager.CreateAsync(user)` without a password (`password_hash` stays null).
  The existing `SignInAsync` path calls `CheckPasswordSignInAsync`, which fails for a null hash and
  returns `InvalidCredentials`, so no change is needed beyond a regression test (FR-013).

## R7. Refusals and errors

- **Decision**: Every refusal (invalid/expired token, unverified email, admin, locked/deleted,
  email linked to another Google identity) returns `401` with the single title
  `Google sign-in failed.` and writes `ExternalSignInFailed` (actor null, entity = user id only
  when known). Missing/oversized `credential` returns `400`. An invalid or expired pending token on
  completion returns `401` with the same title; the frontend restarts the flow.
- **Rationale**: FR-011 non-enumeration; mirrors `InvalidCredentials` on password login.

## R8. Rate limiting and CSRF

- **Decision**: No new code. Both endpoints live under `/api/v1/auth` and are `POST`, so the existing
  10-per-window auth limiter and the global antiforgery middleware apply automatically.

## R9. Concurrency (FR-018)

- **Decision**: Account creation and `AddLoginAsync` run in one transaction (same pattern as
  `IdentityAccountService.RegisterAsync`). On a duplicate email or duplicate login key, roll back,
  re-read with `FindByLoginAsync`, and sign in the account that won the race if it belongs to the
  same Google subject; otherwise return the generic refusal.

## R10. Avatar

- **Decision**: Store the Google `picture` URL in `AvatarUrl` (max 2048) only for new accounts;
  never overwrite on link. Add `lh3.googleusercontent.com` to `images.remotePatterns` in
  `frontend/next.config.*` if avatars render through `next/image`.

## R11. Frontend integration

- **Decision**: Load `https://accounts.google.com/gsi/client` with `next/script`
  (`strategy="afterInteractive"`), call `google.accounts.id.initialize({ client_id, callback,
  ux_mode: "popup" })` and `renderButton` inside a `GoogleSignInButton` client component. The
  callback calls `useGoogleSignIn` (TanStack mutation, `retry: false`) which reuses
  `replaceSession` from `use-auth.ts`. A 202 response shows `SelectRoleCard`; PARENT/STUDENT map
  to `LEARNER` exactly as `RegisterCard` does. Redirect logic is extracted from `LoginCard` into a
  shared helper so both paths route identically (FR-017).
- **Config**: `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (frontend) and `Google__ClientId` (backend) must match.
  If the button is not configured, it is not rendered.

## R12. Testing strategy

- **Decision**: Application unit tests use a fake verifier and a fake protector. API integration tests
  replace `IGoogleIdTokenVerifier` with `FakeGoogleIdTokenVerifier` in `ApiWebApplicationFactory`
  (same pattern as `CapturedEmailSender`), so tests never call Google. Playwright mocks
  `/api/v1/auth/google*` responses and stubs `window.google`.
