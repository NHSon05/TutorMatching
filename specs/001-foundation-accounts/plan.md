# Implementation Plan: Foundation and Accounts

**Feature**: `001-foundation-accounts` | **Date**: 2026-10-02 | **Spec**: [spec.md](spec.md)

**Git branch**: `main` (Spec Kit git extension is not enabled; feature state is tracked by
`.specify/feature.json`.)

## Summary

Deliver Sprint 1 as five independently testable account journeys: registration, sign-in/sign-out,
authorization, personal profile management, and password reset. Use the existing Next.js frontend
and layered ASP.NET Core solution, add PostgreSQL persistence, ASP.NET Core Identity, secure cookie
authentication, versioned REST contracts, and automated security/acceptance tests. Exclude all
later-sprint and out-of-MVP capabilities.

## Technical Context

**Language/Version**: C# on .NET 10; TypeScript with Next.js 16.3.6 and React 19.2.8

**Primary Dependencies**: ASP.NET Core Identity, Entity Framework Core 10 with Npgsql; existing
Next.js and Tailwind CSS; xUnit and ASP.NET Core integration testing; Vitest/Testing Library and
Playwright for frontend and journey checks

**Storage**: PostgreSQL; versioned EF Core migrations; controlled development/demo seed data

**Testing**: xUnit unit and integration tests, PostgreSQL-backed integration fixtures, frontend
component tests, and Playwright acceptance journeys

**Target Platform**: Modern desktop/mobile browsers and an HTTPS-capable web deployment

**Project Type**: Web application with separate frontend and REST API

**Performance Goals**: 95% of ordinary account-page requests complete within three seconds at up to
100 concurrent demonstration users

**Constraints**: One business role per account; no public Admin registration; private data excluded
from public responses/logs; secure expiring/revocable sessions; SRS-aligned MVP scope

**Scale/Scope**: Sprint 1 account workflows only; five independently testable user stories; classroom
deployment and demo data, not commercial identity federation

## Constitution Check

_Gate evaluated before research and re-checked after design._

| Principle               | Design evidence                                                                          | Result |
| ----------------------- | ---------------------------------------------------------------------------------------- | ------ |
| SRS traceability        | `spec.md` maps each requirement to FR/UC/NFR/AC identifiers                              | PASS   |
| Security/privacy        | Identity, secure cookies, server authorization, neutral reset response, secret-free logs | PASS   |
| Layered contracts       | Domain/Application/Infrastructure/Api boundaries plus OpenAPI contract                   | PASS   |
| Evidence-first delivery | Independent story tests, integration tests, quickstart, and task checkpoints             | PASS   |
| MVP simplicity          | Later sprint features, AI recommendations, and payments are explicitly excluded          | PASS   |

**Post-design re-check**: PASS. No constitution violation or complexity exception is required.

## Project Structure

### Documentation for this feature

```text
specs/001-foundation-accounts/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── openapi.yaml
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source code

```text
backend/
├── src/
│   ├── TutorMatching.Api/
│   │   ├── Controllers/
│   │   ├── Contracts/
│   │   └── Program.cs
│   ├── TutorMatching.Application/
│   │   ├── Abstractions/
│   │   ├── Authentication/
│   │   └── Users/
│   ├── TutorMatching.Domain/
│   │   └── Users/
│   └── TutorMatching.Infrastructure/
│       ├── Authentication/
│       ├── Email/
│       └── Persistence/
└── tests/
    ├── TutorMatching.Domain.UnitTests/
    ├── TutorMatching.Application.UnitTests/
    └── TutorMatching.Api.IntegrationTests/

frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   └── profile/
│   ├── components/
│   └── lib/
└── tests/
    ├── components/
    └── e2e/
```

**Structure Decision**: Retain the existing four-project backend solution. Domain owns account-role
and account-state rules; Application owns use cases and ports; Infrastructure owns Identity,
persistence, cookie/session, and email implementations; Api owns HTTP contracts and composition.
Frontend calls only `/api/v1` contracts and never receives credential hashes or reset credentials.

## JWT cookie change — approved 2026-10-09

Replace Identity tickets with five-minute HS256 JWT access cookies and opaque, rotating refresh cookies. Signing key is externally configured (base64, at least 32 random bytes). Persist session family, stamp snapshot and SHA-256 refresh hashes in PostgreSQL; serialize refresh/logout with row locks. Validate session/account/stamp/role on every authenticated request, retaining 30-minute idle/eight-hour absolute limits. Keep Identity password checks, lockout, CSRF and CORS. Cookie names: accessToken (path /), refreshToken (path /api/v1/auth); HttpOnly, host-only, Lax and Secure except explicit local Development override. No raw tokens in JSON/logs. Add refresh endpoint and allow logout with a valid refresh credential after access expiry. Legacy tickets are rejected. Frontend refresh integration is included in the 2026-10-10 hardening below.

Authentication hardening approved 2026-10-10: require Base64 signing keys without a default; add the missing additive session migration; serialize refresh and logout with a PostgreSQL session row lock. Frontend protected requests now restore on 401 using a shared promise and an origin-scoped Web Lock, recheck the session after obtaining the lock, fetch fresh CSRF, then retry once. Auth endpoints are excluded. Web Locks require a supported browser in a secure context (HTTPS or localhost); unsupported contexts report a recoverable error rather than rotating without coordination. Verify real PostgreSQL concurrency, missing/invalid key configuration, and frontend renewal/error paths.

Existing-database compatibility: some installations have historical migration `20261009000000_AddTokenSessions` with `LastActivityAt`, `RevokedAt`, and `ConsumedAt`. The new migration adopts those tables, renames activity time, copies timestamp state into booleans and backfills refresh expiry with `min(created + 30m, absolute expiry)`. Preserve legacy nullable timestamps and all rows; never reset revoked/consumed state. Test both fresh databases and a populated legacy database. Downgrade is explicitly unsupported for this adoption migration; repairs use forward migrations.

## Shared browser HTTP client — 2026-10-11

Replace frontend fetch call sites with an Axios `http` instance in `frontend/src/lib/api/http.ts`, retaining standard AxiosResponse<T> and get/post/put/patch/delete options. Use Axios's fetch adapter with no-store caching, credentialed cookies, and a private transport for CSRF/probe/refresh. Reject URLs outside the configured backend. Mutations obtain fresh validated CSRF; protected 401s share one renewal promise and Web Lock, probe before rotation, and retry once. Auth routes do not recursively refresh. Preserve the existing Problem Details error shape, getSession null on terminal 401, logout idempotence, cancellation, and form contracts. No token storage in browser JavaScript, backend/API/schema changes, or TanStack dependency. Tests exercise the real Axios adapter and simulated cross-tab coordination; browser E2E remains a separate gate. Constitution pre/post-design check: PASS; existing US1–US3 traceability and security boundaries unchanged.

## TanStack Query hooks — 2026-10-11

Layer domain hooks over the existing Axios services: useSession uses one shared session key and forwards AbortSignal; useLogin/useRegister/useLogout use mutations. A client QueryProvider owns a stable, non-server-global QueryClient in the root server layout. Disable retries for auth and mutations; keep session staleTime zero and explicit focus/route revalidation. Centralize session-ended handling, cancel private queries before removing their cache, preserve the observed session query with null data, and seed the account only after removing old private data on login. Default queries are private unless meta.public is true. No persisted cache, tokens, SSR prefetch, or additional refresh mechanism. Mutation credentials are reset after form handling and unobserved mutations have zero gcTime. Existing component validation, role redirects and transient error behavior remain. Constitution pre/post-design check: PASS; no API/schema change.

## Navbar responsibility refactor — 2026-10-12

AuthGuard owns session/role verification only and provides the verified account through a derived context. LearnerNavbar consumes that context rather than mounting another stale session query, avoiding a refetch/unmount loop. The learner layout mounts the navbar above its dashboard toolbar; LogoutButton is an account-independent control using useLogout, with pending/error feedback inside the navbar. Preserve route/focus revalidation, redirects, cache cleanup and existing dashboard content. No backend or authentication contract changes.

## Delivery Phases

1. Align project references, configuration, tests, database, error handling, and OpenAPI.
2. Build shared identity, authorization, session, email, and audit foundations.
3. Deliver registration as the first deployable slice.
4. Deliver sign-in/sign-out and verify session revocation.
5. Enforce role and ownership authorization across direct API access.
6. Deliver private personal-profile management.
7. Deliver neutral, single-use password reset.
8. Run security, responsive UI, performance, and quickstart validation; converge against spec.

## Complexity Tracking

No constitution violations. ASP.NET Core Identity is used instead of custom credential primitives;
the four existing backend projects are retained rather than adding new services or repositories.
