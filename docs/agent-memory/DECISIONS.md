# TutorMatching Decision Memory

Search by ADR ID, subsystem, or keyword. Add only durable decisions; keep each ADR at 12 lines or fewer.

## ADR-001 - Repository-backed progressive memory

- Date: 2026-10-02
- Status: Accepted
- Context: Codex sessions need continuity without replaying full transcripts or loading all project documentation.
- Decision: Keep a short root `AGENTS.md` router, stable facts in `PROJECT.md`, one replaceable handoff in `SESSION.md`, and compact durable decisions in this file.
- Decision: Track all memory files in Git; update them only after material changes and never store secrets, personal data, raw logs, or transcripts.
- Consequence: New sessions search and load only relevant memory, while completed session history is intentionally discarded.
- Consequence: Contributors must repair stale memory when a code or product change invalidates it.

## ADR-002 - Spec Kit for feature delivery

- Date: 2026-10-02
- Status: Accepted
- Context: A single sprint document mixed requirements, design, tests, status, and AI guidance.
- Decision: Use the official Spec Kit constitution and one `specs/<feature-id>/` artifact set per feature.
- Decision: Keep reusable AI guidance in `docs/guides/AI-WORKFLOW.md`; sprint pages are short indexes.
- Consequence: Review gates follow specify, plan, tasks, analyze, implement, and converge artifacts.
- Consequence: Application behavior is not implemented until its feature tasks and gates are ready.

## ADR-003 - Unified frontend design system and semantic tokens

- Date: 2026-10-05
- Status: Accepted
- Context: Frontend UI lacked unified typography, role colors, and reusable component primitives.
- Decision: Enforce single Montserrat font globally, Photonix-aligned button primitive in `components/button.tsx`, and semantic Tailwind v4 tokens in `globals.css`.
- Decision: Role color convention: Blue for Learner/Brand, Amber for Tutor, Crimson for Admin, Indigo for Shared/Messaging.
- Decision: Single source of design system truth is maintained under `frontend/docs/design-system/`.
- Consequence: All frontend pages and future components must use design system tokens and primitives without raw hex codes.

## ADR-004 - Dual JWT-refresh cookie authentication

- Date: 2026-10-09
- Status: Accepted
- Context: Browser clients require stateless access validation with server-side revocation and no credential leakage into JavaScript.
- Decision: Replace legacy Identity ticket cookies with short-lived (5m) HS256 JWT `accessToken` (path `/`) and single-use rotating `refreshToken` (path `/api/v1/auth`), both HttpOnly, Lax and Secure.
- Decision: Store SHA-256 refresh hashes and session family rows in PostgreSQL; detect reuse and revoke the family atomically.
- Decision: Preserve Identity lockout, CSRF, allowlisted CORS, 30m idle and 8h absolute session deadlines; tokens never appear in JSON.
- Consequence: Existing Identity authentication cookies are rejected; users must log in again. Frontend refresh handling is required upon access expiry.

## ADR-005 - Physical database identifiers use snake_case

- Date: 2026-10-11
- Status: Accepted
- Context: User requested consistent snake_case for the entire database, including Identity/history.
- Decision: Central EF model naming plus a customized provider history repository; no CLR/JSON/enum changes.
- Decision: Upgrade by renaming existing objects; preserve rows, relationships, security state and history.
- Decision: An explicit DatabaseMigrator normalizes old history before EF discovers migrations; startup never mutates schema.
- Consequence: Stop old API processes before upgrade; use forward fixes because original custom legacy names cannot be reconstructed reliably.
- Evidence: 87 backend tests pass; local catalog has zero uppercase identifiers with unchanged table OIDs/data row counts.

## ADR-006 - Canonical token timestamps and live role validation

- Date: 2026-10-11
- Status: Accepted
- Context: Approved removal of duplicated token state and stale session authorization.
- Decision: Persist nullable revoked_at/consumed_at only; preserve known legacy times and use -infinity for unknown historical events without reactivating credentials.
- Decision: Validate exactly one current Identity role matching the session on access and refresh; revoke mismatched sessions on refresh.
- Consequence: Npgsql infinity conversion stays enabled; unknown times must not be presented as real event dates. Stop old API before forward-only migration.
- Evidence: 92 backend tests pass, including inconsistent legacy state, timestamp transitions and role changes without stamp changes.

## ADR-007 - Unified root route and persistent learner layout shell

- Date: 2026-10-12
- Status: Accepted
- Context: Need unified `/` for guest landing and learner dashboard; eliminate layout remount/full reloads across learner routes.
- Decision: Reorganize routes under persistent `SiteShell`; guest sees `LandingView` on `/`, authenticated `LEARNER` sees `LearnerDashboardClient` on `/`.
- Decision: For `LEARNER`, keep persistent `LearnerShell` (`LearnerNavigationRail` + `DashboardTopBar`) across `/`, `/tutors`, `/messages`, `/settings`, and `/learner/*`.
- Decision: Internal navigation items in `navigation-rail.tsx` use Next.js `<Link>`. Legacy `/learner/dashboard` redirects to `/`. Tutors and Admins retain separate dashboard layouts.
- Consequence: Layout shells remain mounted without flicker or state wipe. No duplicate headers/footers.

## ADR-008 - Unified registration and progressive tutor onboarding

- Date: 2026-10-13
- Status: Accepted
- Context: Need unified identity registration with role-based routing and a multi-step onboarding flow for tutors.
- Decision: Use unified `POST /api/v1/auth/register` and `POST /api/v1/auth/login`. Response includes `role` and `tutorProfileStatus` (`DRAFT`, `PENDING_REVIEW`, `APPROVED`, `REJECTED`).
- Decision: Dedicated `TutorOnboarding` API (`/api/v1/tutor/onboarding/*`) supports draft autosave across 6 steps, avatar/cert uploads, and review submission.
- Consequence: Frontend routes `TUTOR` dynamically: `DRAFT` to `/tutor/onboarding`, `PENDING_REVIEW` to `/tutor/profile-edit`, and `APPROVED` to `/tutor/dashboard`.

## ADR-009 - Merge account roles directly into user_accounts

- Date: 2026-10-18
- Status: Accepted
- Context: DatabaseSchema designed single role directly in users table, but identity foundation split roles into asp_net_user_roles and asp_net_roles.
- Decision: Add `role` column to `user_accounts` table with canonical check constraint (`ADMIN`, `LEARNER`, `TUTOR`).
- Decision: Replace multi-table role storage with custom `ApplicationUserStore: IUserRoleStore<ApplicationUser>`, removing `asp_net_roles`, `asp_net_user_roles`, `asp_net_role_claims`.
- Consequence: Users have exactly one canonical role stored directly on `user_accounts`. Migration backfills existing roles from `asp_net_user_roles` before dropping legacy tables.


## ADR-010 - Version every tutor review decision

- Date: 2026-10-21
- Status: Accepted (Sprint 2 US3 / research R3, R11)
- Decision: Require the displayed expectedVersion on all admin decision routes, including Sprint 1 approve/reject aliases; no unversioned compatibility bypass.
- Decision: Keep full reasons in immutable action/version history, persist audit and Notification in the same transaction, and leave unknowable legacy reviewedVersion null.
- Consequence: Older clients must fetch admin review detail and send its current version; stale/resubmitted profiles return409.
