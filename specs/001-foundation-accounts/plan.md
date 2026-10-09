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

Replace Identity tickets with five-minute HS256 JWT access cookies and opaque, rotating refresh cookies. Signing key is externally configured (base64, at least 32 random bytes). Persist session family, stamp snapshot and SHA-256 refresh hashes in PostgreSQL; serialize refresh/logout with row locks. Validate session/account/stamp/role on every authenticated request, retaining 30-minute idle/eight-hour absolute limits. Keep Identity password checks, lockout, CSRF and CORS. Cookie names: accessToken (path /), refreshToken (path /api/v1/auth); HttpOnly, host-only, Lax and Secure except explicit local Development override. No raw tokens in JSON/logs. Add refresh endpoint and allow logout with a valid refresh credential after access expiry. Legacy tickets are rejected. Frontend refresh integration is deferred and existing clients will need it after access expiry.

Governance: manually align spec → plan → tasks because Spec Kit skills are unavailable in this session. Automated analyze/converge, build, migration and test checks remain required; do not mark this amendment verified from code alone.

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
