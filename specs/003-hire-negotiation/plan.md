# Implementation Plan: Hire Requests and Negotiation

**Feature**: `003-hire-negotiation` | **Date**: 2026-10-28 | **Spec**: [spec.md](spec.md)
**Git branch**: `main` (existing checkout; no new branch created).
**Status**: Phases 1–5 / US1–US3 (T001–T034) complete; US4–US5 and final gates pending.

## Summary

Extend existing hiring entities with durable create idempotency, versioned transitions, immutable
proposal snapshots and an accepted agreement. Persist request, history, conversation and notification
atomically. Implement participant-only API reads/actions and replace the hire dialog's simulated
success with a real request journey. No Sprint 4 messaging implementation is needed.

## Technical Context

- Language/version: C#/.NET 10; TypeScript, Next.js 16.3.6 and React 19.2.8.
- Dependencies: ASP.NET Core, EF Core 10/Npgsql, existing cookie/CSRF authentication, Axios,
  TanStack Query v5 and existing UI primitives.
- Storage: PostgreSQL 17; snake_case relational schema and additive EF migrations.
- Testing: existing Domain/Application unit tests, API integration tests with PostgreSQL
  Testcontainers, frontend component tests and Playwright journeys.
- Target/platform: responsive web client and ASP.NET Core API.
- Performance: SC-006, p95 interaction latency at most three seconds at 100 concurrent users.
- Constraints: integer VND/session, ISO weekday 1–7, Asia/Ho_Chi_Minh weekly times, UTC event timestamps;
  backend role/ownership checks, immutable history and accepted terms.
- Scope: all five stories; payments, recurring lesson management, dispute handling and messaging UI excluded.

## Constitution Check

| Principle | Before research | After design |
| --- | --- | --- |
| I: Traceability | FR-011/013 conflict identified | User clarified recipient acceptance and accepted cancellation; original SRS references retained. |
| II: Security/privacy | Existing auth reused | Participant scope, role denial, CSRF and safe DTO tests specified. |
| III: Layers/contracts | Existing four layers retained | Domain rules, Application ports, Infrastructure transactions, API contract in contracts/openapi.json. |
| IV: Evidence | Story tests identified | quickstart.md maps independent checkpoints; no implementation completion claimed. |
| V: Simplicity | Existing tables reusable | Database notifications; no broker, payments or new architectural layer. |

Gate: PASS for planning. Implementation review must verify source requirements, migration safety,
contract parity and passing tests before delivery. No constitution exception is requested.

## Project Structure

```text
specs/003-hire-negotiation/
  spec.md, plan.md, research.md, data-model.md, quickstart.md
  contracts/openapi.json
  tasks.md                         # next workflow stage
backend/src/TutorMatching.Domain/Hiring/
backend/src/TutorMatching.Application/Hiring/       # new use cases and ports
backend/src/TutorMatching.Infrastructure/Hiring/    # new transactional adapter
backend/src/TutorMatching.Infrastructure/Persistence/Configurations/
backend/src/TutorMatching.Infrastructure/Persistence/Migrations/
backend/src/TutorMatching.Api/Controllers/HireRequestsController.cs
backend/tests/TutorMatching.Domain.UnitTests/
backend/tests/TutorMatching.Application.UnitTests/
backend/tests/TutorMatching.Api.IntegrationTests/
frontend/src/lib/api/hire-requests.ts
frontend/src/components/hiring/
frontend/src/components/tutors/HireTutorDialog.tsx
frontend/src/app/(public)/learner/requests/
frontend/src/app/(tutor)/tutor/requests/
```

Domain owns validation and transitions without EF dependencies. Application orchestrates current
user, clock, authorization and persistence ports. Infrastructure implements transactions and locks.
API maps versioned JSON/errors and adds Idempotency-Key to the explicit CORS header allowlist. Frontend uses the existing authenticated client/private cache;
inspect local Next.js docs and design-system primitives before UI implementation.

## Delivery Sequence

1. Foundation: domain rules, migration/backfills, transactional port and test fixtures.
2. US1: atomic idempotent creation and real tutor-detail form.
3. US2: participant list/detail foundation, tutor initial accept/reject.
4. US3: immutable proposals and recipient acceptance.
5. US4: full filters, cursor pagination and ordered histories.
6. US5: cancellation/completion with confirmation and reason rules.
7. Contract/auth/concurrency/UI/performance evidence and converge.

Generate dependency-ordered tasks with `$speckit-tasks`, then analyze before implementation.

## Complexity Tracking

No violations or additional architectural layers.
