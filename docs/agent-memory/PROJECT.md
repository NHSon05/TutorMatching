# TutorMatching Project Memory

Stable, compact facts for agents. Search by heading or keyword and read only the relevant section.

## Product

- TutorMatching is a web platform for learners/parents to find tutors, submit hire requests, negotiate, and message.
- Product requirements: `docs/Final_SRS_TutorMatch_PBL3.pdf`.
- Data-model proposal: `docs/DatabaseSchema.md`.
- Spec Kit constitution: `.specify/memory/constitution.md`.
- Sprint features: `001-foundation-accounts` has core auth/profile implementation; `002-tutor-discovery` phases 1–4 are implemented.
  `003-hire-negotiation` Phases 1–3 / create US1 (T001–T019) are implemented; US2–US5 pending.
  Hiring snapshot/version/idempotency migration applied to local PostgreSQL via DatabaseMigrator on 2026-10-29.
  `004-messaging-admin-release` is defined and awaiting planning.
- `005-database-snake-case` is implemented and applied to local PostgreSQL; physical names include Identity and EF history.
- Shared AI usage guide: `docs/guides/AI-WORKFLOW.md`.
- Sprint 1 persistence and Application ports are in place. Registration, JWT login/logout/refresh and authorization are implemented; browser E2E verification, profile editing and password reset remain pending in `specs/001-foundation-accounts/tasks.md`.

## Stack and layout

- Frontend: Next.js 16.3.6, React 19.2.8, TypeScript, Tailwind CSS 4 in `frontend/`.
- API state: TanStack Query v5 `QueryProvider` wraps the root layout; `useSession`/`useLogin`/`useRegister`/`useLogout` call Axios services. Private queries default to private (`meta.public: true` opts out); logout/expiry/login cancel private reads and clear old data. Session revalidates on route/focus, retry is disabled, credential mutations reset after form handling; cache is not persisted.
- Frontend design system: single Montserrat font, semantic role tokens (Blue Learner, Amber Tutor, Crimson Admin, Indigo Shared) in `globals.css`, and primitives documented in `frontend/docs/design-system/`.
- Backend: ASP.NET Core targeting .NET 10 in `backend/`.
- Backend solution projects: `TutorMatching.Api`, `TutorMatching.Application`, `TutorMatching.Domain`, and `TutorMatching.Infrastructure`.
- Layered backend project references and Domain/Application/API test projects are registered in the solution.
- Local PostgreSQL 17 and Mailpit run through `backend/compose.yaml`; backend and frontend use separate environment files.
- API startup and EF design-time tooling share `Infrastructure/Configurations/DotEnvLoader.cs`; it loads `.env` only beside `TutorMatching.slnx` and preserves existing process environment variables. Published deployments should supply environment variables directly.
- Sprint 1 persistence uses ASP.NET Core Identity with UUID keys, EF Core 10, Npgsql, canonical statuses/roles, account constraints, UTC timestamps, and migrations applied via DatabaseMigrator.
- All current physical tables/columns/keys/indexes/sequences use snake_case. Role is persisted directly as `user_accounts.role` with canonical check constraint (`ADMIN`, `LEARNER`, `TUTOR`) via custom `ApplicationUserStore: IUserRoleStore<ApplicationUser>`, replacing `asp_net_roles` and `asp_net_user_roles`. Historical migrations retain original names.
- T010 ports live in `TutorMatching.Application/Abstractions/`: current user, UTC clock, email, token sessions, allowlisted account audit, and account service; Application references Domain only. See the local README for adapter responsibilities.
- Authentication uses dual HttpOnly cookies (`accessToken` JWT 5m path `/`, `refreshToken` opaque rotating path `/api/v1/auth`), server-side TokenSessions, 30m idle/8h absolute limits, per-request stamp/status/role validation, CSRF, and allowlisted credentialed CORS. Login counts failures (5 attempts/15m); logout revokes all sessions via security stamp. `/users/me` derives ownership from claims; `/users/me/access/{role}` checks current database role. Frontend guards use `/users/me`, not editable role cookies.
- `Jwt__SigningKey` is required Base64 (at least 32 random bytes), without fallback. `AddTokenSessions` migration creates session/refresh tables. Refresh/logout serialize on a PostgreSQL session row lock. Frontend `http` in `frontend/src/lib/api/http.ts` is the shared Axios browser client (get/post/put/patch/delete, standard response.data). Its fetch adapter uses no-store and cookies; mutations obtain CSRF automatically. Protected 401s use a shared renewal promise and same-origin Web Locks, probe under the lock and retry once with fresh CSRF. Auth routes bypass renewal. Requires HTTPS/localhost and Web Locks; transient failures do not log out.
- Token migration also adopts the legacy timestamp schema (`20261009000000_AddTokenSessions`, absent from repo), preserving revoked/used states and bounded expiry. Automatic downgrade is blocked to avoid dropping adopted tables. Local PostgreSQL upgraded 2026-10-10; other deployment databases still require migration.
- `UseTokenStateTimestamps` replaces token booleans with nullable `revoked_at`/`consumed_at`. Known times survive; unknown legacy events use PostgreSQL `-infinity` / `DateTimeOffset.MinValue`. Runtime writes actual UTC times. Access/refresh require current Identity role matching the session; refresh revokes role mismatches even without stamp changes. Stop old API before migrating.
- T015 API fixtures require Docker: Testcontainers PostgreSQL 17.6, a unique database per WebApplicationFactory, migrations and factory-local email capture. T017 exposes OpenAPI 3.1 `/openapi/v1.json` in Development/Testing and tests implemented operations against the YAML contract; registration is covered while later account operations remain explicitly pending.
- T014 adapters live in `Infrastructure/Email`: SMTP sandbox via MailKit with required STARTTLS when enabled, 15s default send deadline and sanitized transport errors; `CapturedEmailSender` is substituted only in test factories. Email content/tokens are never logged. Tests use a separate disposable Mailpit container.

## Commands

- Frontend development: `npm --prefix frontend run dev`.
- Frontend lint: `npm --prefix frontend run lint`.
- Frontend production check: `npm --prefix frontend run build`.
- Backend development: `dotnet run --project backend/src/TutorMatching.Api`.
- Backend build: `dotnet build backend/TutorMatching.slnx`.
- Backend tests: `dotnet test backend/TutorMatching.slnx`.
- Database upgrade: stop old API processes, run `dotnet run --project backend/tools/TutorMatching.DatabaseMigrator`, then start updated API. Runner normalizes legacy history before EF migration discovery; first upgrade must use the runner, not bare `dotnet ef database update`. Remote targets require `-- --allow-remote` and explicit environment configuration.
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

- Sprint 2 catalog/public gate: `/admin/catalog` UI and `/api/v1/catalog/{kind}` / admin catalog APIs; `DiscoveryFoundation` migration normalizes known subject/level data while preserving legacy JSON. Use the API-configured connection at port 5433 for migration/backup; the Compose instance can be different. See `specs/002-tutor-discovery/evidence.md`.

- Sprint 2 US1 owner profile supports versioned edits, normalized subjects/levels, teaching modes/service area and re-review on core/name changes. Local DB includes TutorReviewDecisions (2026-10-21); see feature evidence for validation.

- Sprint 2 US2: owner availability/course APIs and `/tutor/offers`; profile-row locks prevent overlapping writes, course/slot removals are soft. `WeeklyAvailability.Capacity` supplies reusable duration matching for later search.

- Sprint 2 US3: admin queue/detail/decision + owner history; all review routes (including old approve/reject aliases) require expectedVersion. Three actions commit status/history/audit/Notification atomically. Legacy reviewedVersion stays null; full notes in immutable history. See feature contract/evidence.

- Sprint2 US4/US5: /tutors uses server-side filters/count/page and canonical /tutors/{profileId} detail, no mock fallback. IPublicTutorService/PublicTutorService use PostgreSQL JSONB/range union capacity and repeatable-read projections; public inventory also requires active subject and positive session rate. Legacy userId detail lookup returns404. DevelopmentDataSeeder normalizes demo subjects/levels and conservatively repairs unchanged, unlinked legacy demo profiles; UI uses compact filters and tutor cards.
