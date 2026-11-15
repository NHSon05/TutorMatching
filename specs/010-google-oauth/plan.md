# Implementation Plan: Sign In and Register with Google

**Feature Directory**: `010-google-oauth` | **Date**: 2026-11-14 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/010-google-oauth/spec.md`

## Summary

Add "Continue with Google" to sign-in and registration. The browser obtains a Google ID token through
Google Identity Services and posts it to `POST /api/v1/auth/google`. The backend verifies it with
`Google.Apis.Auth`, then signs in a linked account, auto-links a same-email active learner or tutor
account, or returns a 10-minute protected pending token. With that token,
`POST /api/v1/auth/google/complete` creates a password-less account with the chosen role (plus a
DRAFT tutor profile for tutors). Every success reuses the existing `TokenSession` + dual-cookie
session. Links are stored in the existing Identity `asp_net_user_logins` table. See
[research.md](research.md).

## Technical Context

**Language/Version**: C# / .NET 10 (backend); TypeScript 5, React 19.2, Next.js 16.3.6 (frontend)

**Primary Dependencies**: ASP.NET Core Identity, EF Core 10 + Npgsql, ASP.NET Data Protection, new
`Google.Apis.Auth` NuGet package; TanStack Query v5, Axios `http` client, Google Identity Services
script (`accounts.google.com/gsi/client`)

**Storage**: PostgreSQL 17 — existing `user_accounts`, `tutor_profiles`, `asp_net_user_logins`,
audit events; one migration adds a unique index `(user_id, login_provider)`

**Testing**: xUnit (Domain/Application unit, API integration with Testcontainers and a fake Google
verifier), OpenAPI contract test, Vitest + Testing Library, Playwright (mocked Google)

**Target Platform**: Browser web app (local `localhost:3000`, Vercel deployment) + Linux-hosted API

**Project Type**: Web application (separate `frontend/` and `backend/`)

**Performance Goals**: Google sign-in round trip (excluding Google UI) under 10 s (SC-001); backend
verification uses cached Google certificates

**Constraints**: No client secret; no token or email in logs or audit; generic 401 for all refusals;
existing auth rate limit (10 per window per IP) and antiforgery apply; ADMIN excluded

**Scale/Scope**: 2 new endpoints, 1 index migration, 4 audit actions, about 4 frontend components or
hooks; classroom-scale traffic (≤ 100 concurrent users)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Assessment | Status |
|---|---|---|
| I. SRS traceability | Extends SRS FR-01/FR-02; recorded as a change request approved by the product owner on 2026-11-14 in spec Input/Traceability | PASS (approved change) |
| II. Security and privacy | Maintained library verifies tokens; audience/issuer/expiry/email_verified checks; time-limited protected pending token; generic 401 (no enumeration); CSRF + rate limit reused; ADMIN blocked; no tokens/PII in logs; tests cover failure, role denial, enumeration | PASS |
| III. Layered boundaries | Application owns `GoogleSignInHandler`, `CompleteGoogleRegistrationHandler` and ports (`IGoogleIdTokenVerifier`, `IPendingGoogleRegistrationProtector`, `IExternalAccountService`); Infrastructure implements Google/Identity/Data Protection; Api maps HTTP; versioned contract in [contracts/openapi.json](contracts/openapi.json); reviewed migration | PASS |
| IV. Evidence-first | Each user story has an independent test; quickstart lists runnable checks; `evidence.md` required before closing tasks | PASS |
| V. MVP simplicity | ID-token flow chosen over redirect flow; no new tables; stateless pending token; unlinking, password-add and other providers excluded | PASS |

Post-design re-check: no violations introduced; Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/010-google-oauth/
├── spec.md
├── plan.md                 # This file
├── research.md             # Phase 0
├── data-model.md           # Phase 1
├── quickstart.md           # Phase 1
├── contracts/openapi.json  # Phase 1
├── checklists/requirements.md
└── tasks.md                # Phase 2 ($speckit-tasks)
```

### Source Code (repository root)

```text
backend/src/
├── TutorMatching.Application/
│   ├── Abstractions/
│   │   ├── IGoogleIdTokenVerifier.cs                 # new port + ExternalIdentity record
│   │   ├── IPendingGoogleRegistrationProtector.cs    # new port
│   │   ├── IExternalAccountService.cs                # new port: SignInWithExternalLoginAsync, RegisterExternalAsync
│   │   └── IAuditWriter.cs                           # + 4 AccountAuditAction values
│   └── Authentication/Google/
│       ├── GoogleSignInHandler.cs                    # verify → linked | link | pending
│       ├── CompleteGoogleRegistrationHandler.cs      # pending + role → create
│       └── GoogleSignInResult.cs
├── TutorMatching.Infrastructure/
│   ├── Authentication/
│   │   ├── GoogleIdTokenVerifier.cs                  # Google.Apis.Auth adapter
│   │   ├── DataProtectionPendingGoogleRegistrationProtector.cs
│   │   ├── GoogleOptions.cs                          # Google:ClientId
│   │   └── IdentityExternalAccountService.cs         # external sign-in/link/register (transactional)
│   ├── Persistence/Configurations/                   # unique (user_id, login_provider) index
│   ├── Persistence/Migrations/<ts>_AddExternalLoginUniqueness.cs
│   └── DependencyInjection.cs                        # register adapters + options
└── TutorMatching.Api/
    ├── Controllers/AuthController.cs                 # POST auth/google, auth/google/complete
    └── Contracts/Auth/GoogleContracts.cs             # request/response records

backend/tests/
├── TutorMatching.Application.UnitTests/Authentication/GoogleSignInHandlerTests.cs
├── TutorMatching.Api.IntegrationTests/Authentication/GoogleAuthTests.cs
├── TutorMatching.Api.IntegrationTests/Fixtures/FakeGoogleIdTokenVerifier.cs
└── TutorMatching.Api.IntegrationTests/TutorMatching.Api.IntegrationTests.csproj  # link contract

frontend/src/
├── lib/auth/session.ts                 # + googleSignIn, completeGoogleRegistration
├── lib/auth/post-login-redirect.ts     # shared role/tutor-status redirect (from LoginCard)
├── hooks/use-auth.ts                   # + useGoogleSignIn, useCompleteGoogleRegistration
├── components/auth/GoogleSignInButton.tsx
├── components/auth/GoogleRoleStep.tsx  # wraps SelectRoleCard for the pending token
├── components/auth/LoginCard.tsx       # add button + shared redirect
└── components/auth/RegisterCard.tsx    # add button
frontend/tests/components/GoogleSignIn.test.tsx
frontend/tests/e2e/google-auth.spec.ts
```

**Structure Decision**: Existing four-layer backend and `frontend/` app. Google code lives in a new
`Authentication/Google` use-case folder (Application) and in `Infrastructure/Authentication`
adapters, mirroring the Register/Sessions use cases.

## Implementation Notes

- `GoogleSignInHandler` decision order follows the flow in [data-model.md](data-model.md); every
  refusal maps to one `AccountFailure.InvalidCredentials` → 401 `Google sign-in failed.`
- The controller reuses `tokens.CreateAsync(account.Id)` + `cookies.Issue(...)` and returns the
  existing `LoginResponse` shape; `Cache-Control: no-store` on both endpoints.
- `IdentityExternalAccountService` wraps create + `AddLoginAsync` (+ DRAFT tutor profile) in one
  transaction; on unique violation it re-resolves by login (research R9).
- `GoogleSignInButton` renders nothing when `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is empty, so local
  environments without Google config keep working.
- Contract: link `specs/010-google-oauth/contracts/openapi.json` into the integration test project
  and merge its paths in `OpenApiContractTests`, as done for `discovery.json`.

## Complexity Tracking

Not required — no constitution violations.
