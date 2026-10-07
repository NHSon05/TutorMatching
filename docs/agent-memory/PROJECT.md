# TutorMatching Project Memory

Stable, compact facts for agents. Search by heading or keyword and read only the relevant section.

## Product

- TutorMatching is a web platform for learners/parents to find tutors, submit hire requests, negotiate, and message.
- Product requirements: `docs/Final_SRS_TutorMatch_PBL3.pdf`.
- Data-model proposal: `docs/DatabaseSchema.md`.
- Spec Kit constitution: `.specify/memory/constitution.md`.
- Sprint features: `001-foundation-accounts` is planned/tasked; `002-tutor-discovery`,
  `003-hire-negotiation`, and `004-messaging-admin-release` are defined and awaiting planning.
- Shared AI usage guide: `docs/guides/AI-WORKFLOW.md`.
- Sprint 1 persistence and Application ports are in place; account use cases and HTTP endpoints remain pending in `specs/001-foundation-accounts/tasks.md`.

## Stack and layout

- Frontend: Next.js 16.3.6, React 19.2.8, TypeScript, Tailwind CSS 4 in `frontend/`.
- Frontend design system: single Montserrat font, semantic role tokens (Blue Learner, Amber Tutor, Crimson Admin, Indigo Shared) in `globals.css`, and primitives documented in `frontend/docs/design-system/`.
- Backend: ASP.NET Core targeting .NET 10 in `backend/`.
- Backend solution projects: `TutorMatching.Api`, `TutorMatching.Application`, `TutorMatching.Domain`, and `TutorMatching.Infrastructure`.
- Layered backend project references and Domain/Application/API test projects are registered in the solution.
- Local PostgreSQL 17 and Mailpit run through `backend/compose.yaml`; backend and frontend use separate environment files.
- API startup and EF design-time tooling share `Infrastructure/Configurations/DotEnvLoader.cs`; it loads `.env` only beside `TutorMatching.slnx` and preserves existing process environment variables. Published deployments should supply environment variables directly.
- Sprint 1 persistence uses ASP.NET Core Identity with UUID keys, EF Core 10, Npgsql, canonical roles/statuses, account constraints, UTC timestamps, and an initial migration validated locally and applied to Supabase through its IPv4 Session pooler.
- T010 ports live in `TutorMatching.Application/Abstractions/`: current user, UTC clock, email, allowlisted account audit, and account service; Application references Domain only. See the local README for adapter responsibilities.
- T011 security lives in `TutorMatching.Api/Security/`: Identity cookie (30m idle/8h absolute), per-request stamp/status validation, default authenticated access, role policies, allowlisted credentialed CORS, CSRF via `/api/v1/auth/csrf` + `X-CSRF-TOKEN`, and per-IP limits (120/min overall, 10/min auth writes). Identity lockout is configured at 5 attempts/15m; login counting and logout revocation remain T028.
- T015 API fixtures require Docker: Testcontainers PostgreSQL 17.6, a unique database per WebApplicationFactory, migrations and factory-local email capture. T017 exposes OpenAPI 3.1 `/openapi/v1.json` in Development/Testing and tests implemented operations against the YAML contract; later account operations remain explicitly pending.
- T014 adapters live in `Infrastructure/Email`: SMTP sandbox via MailKit with required STARTTLS when enabled, 15s default send deadline and sanitized transport errors; `CapturedEmailSender` is substituted only in test factories. Email content/tokens are never logged. Tests use a separate disposable Mailpit container.

## Commands

- Frontend development: `npm --prefix frontend run dev`.
- Frontend lint: `npm --prefix frontend run lint`.
- Frontend production check: `npm --prefix frontend run build`.
- Backend development: `dotnet run --project backend/src/TutorMatching.Api`.
- Backend build: `dotnet build backend/TutorMatching.slnx`.
- Backend tests: `dotnet test backend/TutorMatching.slnx`.
- Frontend component tests: `npm --prefix frontend run test`.
- Frontend E2E tests: `npm --prefix frontend run test:e2e`.
- Local services: copy `backend/.env.example` to `backend/.env`, then run `docker compose --env-file backend/.env -f backend/compose.yaml up -d --wait`.

## Architecture boundaries

- `Domain`: business entities, value objects, state rules, and domain behavior without infrastructure dependencies.
- `Application`: use cases, ports/interfaces, DTOs, validation, and authorization orchestration.
- `Infrastructure`: database, identity, messaging, storage, email, and external integrations.
- `Api`: HTTP contracts, authentication middleware, dependency injection, and composition root.
- Frontend talks to the backend through versioned JSON REST APIs; do not embed server secrets in Next.js client code.
- Treat these as intended boundaries until project references and architecture tests enforce them.

## SRS invariants

- Public tutor results require an `APPROVED` tutor profile and an `ACTIVE` account.
- Private email, phone, birth date, and exact address must not appear in public search/profile responses.
- Hire-request terminal states are `REJECTED`, `CANCELLED`, and `COMPLETED`; terminal requests cannot continue negotiation.
- A hire request requires at least one schedule, a start date, sessions per week, and duration per session.
- Sessions per week must be 1-21; duration must be 30-240 minutes; VND prices are positive integers.
- `ONLINE` location is optional; `OFFLINE` and `HYBRID` require province and district.
- A conversation is created only after its hire request is created successfully.
- Creating a hire request, conversation, and initial notification must not leave partial state.
- Only request participants may access its conversation; administrative access is limited to authorized violation handling.
- Account lock, tutor approval, and catalog changes require audit records; logs must exclude secrets and private content.

## Product boundaries

- MVP excludes online payments, e-contracts, video calls, maps/distance, AI tutor recommendations, mobile apps, automatic credential verification, disputes, and refunds.
- Payment and lesson delivery happen outside the system in the MVP.
- Search, tutor approval, hiring/negotiation, request-scoped messaging, notifications, and basic administration are in scope.

## Resolved specification issue

- Canonical persisted roles are `ADMIN`, `LEARNER`, and `TUTOR`; `LEANER` in the SRS is treated as
  a spelling defect, while parents and students share `LEARNER` in the MVP.

## Agent-memory protocol

- Root `AGENTS.md` is the always-loaded router.
- `SESSION.md` holds only unfinished-work handoff and is replaced, not accumulated.
- `DECISIONS.md` holds short durable ADRs and is searched selectively.
- Update this file only when stable project facts change; transient progress belongs in `SESSION.md`.
- Feature requirements, plans, contracts, and task progress belong in `specs/`, not agent memory.
