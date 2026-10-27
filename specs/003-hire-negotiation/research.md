# Research: Hire Requests and Negotiation

Date: 2026-10-28. Findings are based on repository source; no framework upgrade is proposed.

## Existing foundation

- `Domain/Hiring` already contains HireRequest, RequestSchedule, Negotiation,
  NegotiationSchedule and RequestStatusHistory. No hiring workflow API exists yet.
- `ConversationConfiguration` already has a unique HireRequestId index.
- `TutorOfferService` and `TutorOnboardingService` serialize offering edits on the profile row.
  `TutorReviewService` locks profile then account and writes notifications in the same transaction.
- `ApplicationDbContext` applies snake_case naming and rotates profile concurrency versions.
- `HireTutorDialog` currently sets local success and routes to `/messages`; it does not persist hiring.

## Decisions

### Permissions

Decision: both parties may counter; only the recipient accepts the latest proposal. Tutor alone
accepts/rejects the initial offer or rejects the request. Learner cancels before acceptance; either
participant cancels accepted requests with confirmation/reason or completes with confirmation.
Rationale: explicitly confirmed by user on 2026-10-28; reconciles FR-011/013 and US3.
Alternative: tutor-only negotiation conflicts with the agreed two-party flow.

### Atomicity and notifications

Decision: one PostgreSQL transaction writes all business records and the recipient notification.
Notification insertion failure rolls back the operation. No external delivery runs inside it.
Rationale: existing review workflow demonstrates this pattern and satisfies FR-006/020.
Alternative: async-only notification creation would violate creation atomicity; a broker is unnecessary.

### Idempotency

Decision: durable create operation keyed by learner ID and client UUID, with canonical payload hash
and original creation result. Same key/payload replays the original result; changed payload is 409.
Retain records for the lifetime of the request. Race losers reload the committed winner after rollback.
Rationale: unique database constraint survives retries, multiple API instances and process restarts.
Alternative: button disabling or memory caches do not guarantee exactly one business outcome.

### Concurrency

Decision: Guid expectedVersion on every action; row locking plus EF concurrency token. Acquire
profile, tutor account, relevant catalog rows and then request locks consistently. Catalog checks
must hold shared row locks through commit; existing catalog mutation paths must be audited for
compatible ordering. Recheck availability/offering on create, proposal and acceptance. Read detail
under a consistent snapshot. Rotate version only on successful mutation.
Rationale: matches existing offering lock and prevents stale availability/state writes.
Alternative: unlocked validation has a check/write race; optimistic checks alone do not protect offerings.

### Time and schedule interpretation

Decision: recurring weekly windows use ISO weekdays and Asia/Ho_Chi_Minh; event times use UTC.
Start date is strictly after today's local date. Every requested window must be fully covered by
active availability; merged windows must provide at least sessionsPerWeek slots of durationMinutes
using WeeklyAvailability.Capacity. Overlapping/duplicate input windows are rejected. Midnight-crossing
windows must be split. This models preferred windows, not reserved lesson appointments.
Rationale: existing hire UI offers broad windows and discovery already uses capacity semantics.
Alternative: one interval equals one session would silently change that representation.

### Snapshot and migration

Decision: store full effective proposal terms, immutable accepted snapshot (including location labels),
monotonic proposal/event sequence and deterministic ordering. Nullable legacy fields are not silently
invented. Preflight legacy rows; backfill only recoverable facts, stop with actionable diagnostics for
ambiguous legacy agreements before enforcing constraints. Preserve existing rows and references.
Rationale: existing SetNull course/location FKs cannot preserve historical terms alone.
Alternative: reconstructing terms from live tutor/course records changes history.

### UI and scope

Decision: dedicated participant list/detail routes; query invalidation after mutations, preserved
form input on errors/conflicts, text status labels and confirmation dialogs. Create idempotency key
survives network retries; new payload requires a new explicit submission identity. Use database
notification rows without requiring Sprint 4 inbox UI. Admin monitoring is optional (FR-008 MAY)
and remains in Sprint 4; this feature exposes no admin mutation capability.
Rationale: independently demonstrable stories without expanding into messaging/admin release.
