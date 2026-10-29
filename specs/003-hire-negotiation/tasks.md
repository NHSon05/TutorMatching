# Tasks: Hire Requests and Negotiation

**Input**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [data-model.md](data-model.md), [OpenAPI](contracts/openapi.json), [quickstart.md](quickstart.md).
**Created**: 2026-10-28. **Status**: Phases 1–2 complete (T001–T011); user stories pending.
**Tests**: Required by FR-022 and constitution IV. Write failing behavior tests before or with implementation; record actual passing evidence before checking tasks off.

## Format and execution rules

`- [ ] Tnnn [P?] [USn?] Description with repository-relative paths`.
Paths naming new files are intended destinations. [P] marks independent work within the same phase
once its entry prerequisites are complete; it does not authorize bypassing dependencies. Shared-file
implementation tasks run sequentially. Follow frontend/AGENTS.md, local Next.js docs and design-system
primitives before UI edits. Do not create extra projects or replace existing authentication.

Run `$speckit-analyze` before implementation; resolve blocking findings in the owning artifact.
Do not apply a migration to a user database merely to complete these tasks. Use disposable test databases.
Each checkpoint requires relevant checks, reviewed diff and evidence in `specs/003-hire-negotiation/evidence.md`.

## Phase 1: Setup

Goal: establish traceability and reproducible checks without reinitializing the repository.

- [x] T001 Create the FR-001–022 / SC-001–007 evidence matrix and record baseline commands, existing failures and source/contract review findings in `specs/003-hire-negotiation/evidence.md`; resolve analyze blockers before Phase 2.
- [x] T002 Add reusable synthetic learners, tutors, offered course/subject and availability fixtures using the existing PostgreSQL factory in `backend/tests/TutorMatching.Api.IntegrationTests/Hiring/HiringFixture.cs`; include unrelated actors and helpers for separate-connection races and notification-write failure injection.

**Phase 1 evidence**: [evidence.md](evidence.md) — 221 baseline tests and 4 fixture tests pass; analyze blocker A1 resolved.

## Phase 2: Foundational (blocks all stories)

Goal: shared model, transaction and API boundaries. Entry: Phase 1 complete.

- [x] T003 [P] Add invariant tests in `backend/tests/TutorMatching.Domain.UnitTests/Hiring/HireTermsTests.cs`: “frequency 1–21”, “duration 30–240”, “positive int32 VND”, “Notes max 2000; reasons max 1000; location detail max 500”, ISO weekdays 1–7, “StartTime < EndTime”, duplicate/overlap rejection, full availability coverage, capacity, and future date using Asia/Ho_Chi_Minh.
- [x] T004 [P] Add legacy/empty-database migration tests in `backend/tests/TutorMatching.Api.IntegrationTests/Hiring/HiringMigrationTests.cs` for preserved rows, deterministic sequence, tokens, unique keys, snake_case and fail-fast unrecoverable agreements; do not fabricate actor or agreement facts.
- [x] T005 Implement shared term validation and immutable value snapshots in `backend/src/TutorMatching.Domain/Hiring/HireTerms.cs` and `backend/src/TutorMatching.Domain/Hiring/FinalAgreement.cs`: enforce T003 constraints, “valid province/district for OFFLINE/HYBRID”, offered ONLINE/OFFLINE/HYBRID modes, local dates, UTC events, and contract schedule count 1–147. Reuse WeeklyAvailability capacity; distinguish weekly preferences from appointments.
- [x] T006 Extend `backend/src/TutorMatching.Domain/Hiring/HireRequest.cs`, `Negotiation.cs`, `RequestStatusHistory.cs` and new `HireCreateOperation.cs` in that directory: Guid Version, listed price, unique per-request proposal/event Sequence, “FinalAgreement snapshot (nullable until accepted)”, “null for initial offer” accepted sequence, “Creation has null previous state”, immutable full effective proposal terms and original terms; “LearnerId + IdempotencyKey unique” and “RequestId unique”, canonical fingerprint/original result/CreatedAt with no TTL during request lifetime.
- [x] T007 Configure mappings, snapshots, required/null fields, indexes, constraints and token handling in `backend/src/TutorMatching.Infrastructure/Persistence/Configurations/HireRequestConfiguration.cs`, sibling `NegotiationConfiguration.cs`, `RequestStatusHistoryConfiguration.cs`, new `HireCreateOperationConfiguration.cs` and `backend/src/TutorMatching.Infrastructure/Persistence/ApplicationDbContext.cs`; preserve unique conversation FK and do not rotate request versions on failed/replayed operations.
- [x] T008 Generate and review `backend/src/TutorMatching.Infrastructure/Persistence/Migrations/*_HireNegotiationFoundation.cs` plus its designer/model snapshot; backfill only recoverable facts before enforcing constraints, preserve existing references and snapshot location labels independently of SetNull FKs. Run T004 and record upgrade/rollback results in `specs/003-hire-negotiation/evidence.md`.
- [x] T009 Define typed commands/results, safe DTOs and transactional persistence port in `backend/src/TutorMatching.Application/Hiring/HireContracts.cs` and `IHireRequestStore.cs`; align required fields, nullable fields, enums, string/numeric bounds, unknown-property handling and Problem field errors with `specs/003-hire-negotiation/contracts/openapi.json`.
- [x] T010 Implement transaction/locking infrastructure in `backend/src/TutorMatching.Infrastructure/Hiring/HireRequestStore.cs`: consistent profile → tutor account → catalog → request ordering, shared catalog locks, expectedVersion checks and notification rollback; audit compatible locks in existing TutorOfferService, TutorReviewService and catalog/account writers and document results in `specs/003-hire-negotiation/evidence.md`. Protect caller account-state races without introducing lock inversions.
- [x] T011 Wire Application/Infrastructure hiring dependencies through `backend/src/TutorMatching.Api/Program.cs` and add `Idempotency-Key` to explicit allowed CORS headers in `backend/src/TutorMatching.Api/Security/ApiSecurityExtensions.cs`; retain cookie auth/CSRF, structured sanitized errors and no private payload logging.

**Checkpoint — PASS (2026-10-28)**: invariant/migration/transaction tests pass; build, contract boundaries and lock audit reviewed. See [evidence.md](evidence.md), Phase 2. No user-story implementation is included in this checkpoint.

## Phase 3: US1 — Send a hire request (P1, first MVP)

Goal: real tutor-detail submission. Independent test: submit listed/alternate price requests and replay; exactly one request, initial event, conversation and notification per submission identity. Covers FR-001–007,020–022.

- [x] T012 [P] [US1] Add create API/contract tests in `backend/tests/TutorMatching.Api.IntegrationTests/Hiring/CreateHireRequestTests.cs`: LEARNER-only, self-hire, hidden/locked tutor, inactive/mismatched offering, stale listed price, all numeric/date/location/schedule boundaries, 201 response and field errors. Verify subject-only and course-based pricing.
- [x] T013 [P] [US1] Add parallel create, changed-payload key reuse, lost-response replay, rollback/retry and availability/catalog/account race tests in `backend/tests/TutorMatching.Api.IntegrationTests/Hiring/HireCreationReliabilityTests.cs`; compare all business row counts and replay the immutable original result even after later state changes.
- [x] T014 [P] [US1] Add form tests in `frontend/tests/components/HireTutorDialog.test.tsx` for real submission, required fields, retained valid input/key on transport failure, refreshed key for explicitly changed submission, stale-price/conflict handling and no premature success.
- [x] T015 [US1] Implement learner create orchestration in `backend/src/TutorMatching.Application/Hiring/CreateHireRequest.cs`: ownership derived from current user, current offered terms/eligibility, canonical normalized payload, initial PENDING at listed price or NEGOTIATING otherwise.
- [x] T016 [US1] Implement durable idempotent creation in `backend/src/TutorMatching.Infrastructure/Hiring/HireRequestStore.cs`: transactionally persist terms/schedules, initial event, unique conversation, notification and operation result; matching replay returns original 201, changed fingerprint returns 409, unique-race loser rolls back and reloads winner.
- [x] T017 [US1] Expose POST `/api/v1/hire-requests` in `backend/src/TutorMatching.Api/Controllers/HireRequestsController.cs`, validate UUID Idempotency-Key and map contract responses; extend `backend/tests/TutorMatching.Api.IntegrationTests/Security/ApiSecurityTests.cs` for allowed-origin preflight, unauthorized role and missing CSRF.
- [x] T018 [US1] Add typed create client in `frontend/src/lib/api/hire-requests.ts` using shared authenticated Axios; connect `frontend/src/components/tutors/HireTutorDialog.tsx` to actual subject/course, start date, duration, location, weekly windows and price. Preserve retry identity and show server-confirmed outcome without requiring Sprint 4 messages.
- [x] T019 [US1] Create and run the create/retry browser journey in `frontend/tests/e2e/hire-creation.spec.ts`; time a synthetic learner submission (SC-001 <= three minutes), run T012–T014 and record counts/commands/results in `specs/003-hire-negotiation/evidence.md`.

**Checkpoint**: valid/invalid/replayed creation passes independently; no simulated success or partial writes.

## Phase 4: US2 — Review and respond (P1)

Goal: designated tutor can inspect and respond without negotiation or messaging. Independent test: accept one initial request, reject another; verify ownership, snapshot, event and notification. Covers FR-008,010–012,019–022.

- [ ] T020 [P] [US2] Add initial accept/reject transition tests in `backend/tests/TutorMatching.Domain.UnitTests/Hiring/InitialResponseTests.cs` for tutor-only action, nonblank reason max 1000, valid states, version and frozen agreement.
- [ ] T021 [P] [US2] Add list/detail/accept/reject endpoint tests in `backend/tests/TutorMatching.Api.IntegrationTests/Hiring/TutorResponseTests.cs`: initial NEGOTIATING offer acceptance, unrelated learner/tutor denial, no existence leak, admin exclusion, snapshot persistence after profile edits, notification rollback and two competing responders.
- [ ] T022 [P] [US2] Add tutor response UI tests in `frontend/tests/hire-response.test.tsx` for reason errors, loading/success and version conflicts with preserved input.
- [ ] T023 [US2] Implement initial response rules in `backend/src/TutorMatching.Domain/Hiring/HireRequest.cs` and `backend/src/TutorMatching.Application/Hiring/RespondToHireRequest.cs`; only designated tutor accepts initial terms when no proposal exists or rejects open requests, recording actor/reason/time.
- [ ] T024 [US2] Implement participant-scoped consistent-snapshot reads and initial response persistence in `backend/src/TutorMatching.Infrastructure/Hiring/HireRequestStore.cs`; preserve initial terms, atomically freeze accepted agreement plus history/notification and rotate version; include ordered empty/full histories and server-derived allowedActions.
- [ ] T025 [US2] Add GET list/detail and POST accept/reject to `backend/src/TutorMatching.Api/Controllers/HireRequestsController.cs` matching the full published shapes and bounded list behavior; add matching client methods in `frontend/src/lib/api/hire-requests.ts`. US4 expands pagination validation and UX, not authorization.
- [ ] T026 [US2] Build tutor list/detail pages at `frontend/src/app/(tutor)/tutor/requests/page.tsx` and `[id]/page.tsx`, with shared `frontend/src/components/hiring/HireRequestDetail.tsx`; use private queries, text statuses, reason form, safe error handling and invalidation.
- [ ] T027 [US2] Run the initial response journey in `frontend/tests/e2e/hire-response.spec.ts` and T020–T022; record independent accepted/rejected examples and unauthorized no-write results in `specs/003-hire-negotiation/evidence.md`.

**Checkpoint**: create → tutor inspect → accept/reject works end to end; this is the first useful two-role demo.

## Phase 5: US3 — Negotiate price and schedule (P1)

Goal: immutable proposals and recipient-only latest acceptance. Independent test: alternate proposals and accept latest; original terms/history and final agreement remain intact. Covers FR-013–016,019–022.

- [ ] T028 [P] [US3] Add proposal domain tests in `backend/tests/TutorMatching.Domain.UnitTests/Hiring/NegotiationTests.cs`: positive price or valid schedules required, “Require at least one changed price or schedule”, inherited omitted terms, immutable versions, sender/obsolete acceptance denial, future date and closed-state denial.
- [ ] T029 [P] [US3] Add proposal API tests in `backend/tests/TutorMatching.Api.IntegrationTests/Hiring/NegotiationEndpointTests.cs`: both participants, full ordered snapshots, latest sequence, recipient-only acceptance, concurrent counter/accept, revalidated availability and notification rollback.
- [ ] T030 [P] [US3] Add negotiation UI tests in `frontend/tests/hire-negotiation.test.tsx` covering preserved inputs, conflict refresh without blind resubmission, latest recipient action and proposal history.
- [ ] T031 [US3] Implement immutable proposal creation and recipient acceptance in `backend/src/TutorMatching.Domain/Hiring/HireRequest.cs`, `Negotiation.cs` and `backend/src/TutorMatching.Application/Hiring/NegotiateHireRequest.cs`; distinguish initial acceptance from proposalSequence and prohibit changes after ACCEPTED.
- [ ] T032 [US3] Persist numbered full proposal/schedule snapshots, NEGOTIATING-to-NEGOTIATING events, accepted snapshot and recipient notifications in `backend/src/TutorMatching.Infrastructure/Hiring/HireRequestStore.cs`; reject stale version/sequence under the shared lock protocol with no partial writes.
- [ ] T033 [US3] Expose POST proposals and extend accept in `backend/src/TutorMatching.Api/Controllers/HireRequestsController.cs`; extend `frontend/src/lib/api/hire-requests.ts` and add `frontend/src/components/hiring/NegotiationPanel.tsx` integrated into HireRequestDetail.
- [ ] T034 [US3] Add learner detail entry at `frontend/src/app/(public)/learner/requests/[id]/page.tsx` using existing auth guards and shared detail; run `frontend/tests/e2e/hire-negotiation.spec.ts` and T028–T030 for both roles, recording independent evidence in `specs/003-hire-negotiation/evidence.md`.

**Checkpoint**: both parties exchange offers; only recipient accepts latest; race loser cannot overwrite winner.

## Phase 6: US4 — Track status and history (P2)

Goal: complete participant tracking experience. Independent test: seeded requests in every state, filters/pages and chronological histories for both roles. Covers FR-008–010,021–022.

- [ ] T035 [P] [US4] Add stable cursor/status/ownership/history tests in `backend/tests/TutorMatching.Api.IntegrationTests/Hiring/HireQueryTests.cs`: tied timestamps, inserts between pages, status-membership changes, malformed/filter-mismatched cursor, pageSize 1–100 default 20, sequence ordering, and no contact/credential data.
- [ ] T036 [P] [US4] Add list/history UI tests in `frontend/tests/hire-tracking.test.tsx` for filters, next-page reset, empty/loading/error states, readable labels, keyboard access and private-cache clearing on account switch.
- [ ] T037 [US4] Complete query indexes/projections and opaque cursor handling in `backend/src/TutorMatching.Infrastructure/Hiring/HireRequestStore.cs`: `(CreatedAt DESC, Id DESC)` with upper boundary and bound status; always apply current participant scope, never trust cursor ownership; keep details transactionally consistent.
- [ ] T038 [US4] Create `frontend/src/app/(public)/learner/requests/page.tsx`, shared `frontend/src/components/hiring/HireRequestList.tsx` and `HireRequestTimeline.tsx`; reuse for tutor requests and both details, expose original/current/final terms, text states and chronological proposal/status history; connect request navigation in existing learner/tutor shells.
- [ ] T039 [US4] Run seeded tracking journey in `frontend/tests/e2e/hire-tracking.spec.ts` and T035–T036 with all six states and unrelated accounts; record stable pagination and identity-isolation outcomes in `specs/003-hire-negotiation/evidence.md`.

**Checkpoint**: both roles can find and understand their own requests without a messaging or admin UI.

## Phase 7: US5 — Cancel or complete (P2)

Goal: close requests according to confirmed permissions. Independent test: all allowed and disallowed terminal actions, reasons, confirmation, events and recipient notifications. Covers FR-016–022.

- [ ] T040 [P] [US5] Add exhaustive actor/state/action tests in `backend/tests/TutorMatching.Domain.UnitTests/Hiring/CloseHireRequestTests.cs`: learner-only cancellation before acceptance; either participant after acceptance with nonblank reason max 1000; confirmed true required; completion ACCEPTED-only; terminal states reject every action.
- [ ] T041 [P] [US5] Add terminal endpoint tests in `backend/tests/TutorMatching.Api.IntegrationTests/Hiring/CloseHireRequestTests.cs` covering stale version, competing cancel/complete, retry after lost response, history/notification counts, rollback, and cancellation/rejection of expired open requests.
- [ ] T042 [P] [US5] Add terminal confirmation UI tests in `frontend/tests/hire-close.test.tsx` for dismissed confirmation, missing reason, conflict recovery, loading/success and terminal controls.
- [ ] T043 [US5] Implement closing rules in `backend/src/TutorMatching.Domain/Hiring/HireRequest.cs` and `backend/src/TutorMatching.Application/Hiring/CloseHireRequest.cs`, transactional persistence in `backend/src/TutorMatching.Infrastructure/Hiring/HireRequestStore.cs`, and POST cancel/complete in `backend/src/TutorMatching.Api/Controllers/HireRequestsController.cs`; preserve accepted snapshot after cancellation/completion.
- [ ] T044 [US5] Add close mutations to `frontend/src/lib/api/hire-requests.ts` and `frontend/src/components/hiring/CloseRequestDialog.tsx`, integrated with both details; completion explicitly attests teaching concluded, and accepted cancellation requires confirmation and reason.
- [ ] T045 [US5] Run `frontend/tests/e2e/hire-close.spec.ts` and T040–T042 for both actors and every lifecycle state, then record the complete transition matrix and failure outcomes in `specs/003-hire-negotiation/evidence.md`.

**Checkpoint**: no invalid or concurrent action overwrites a terminal state; all valid actions produce one history event/notification.

## Phase 8: Polish and cross-cutting verification

Entry: all five story checkpoints complete. Goal: demonstrate full acceptance and reconcile artifacts.

- [ ] T046 [P] Add final runtime OpenAPI parity and all-eight-operation security matrix in `backend/tests/TutorMatching.Api.IntegrationTests/Hiring/HiringContractTests.cs`; verify required/null/boundary schemas, status codes, CSRF, unauthenticated/role/ownership/admin denials and current account state against `specs/003-hire-negotiation/contracts/openapi.json`.
- [ ] T047 [P] Create runnable 100-user load scenarios in `backend/tests/performance/hire-negotiation/HireNegotiation.Performance.csproj` and `Program.cs`, following the existing discovery harness; measure list/detail/action p95 <= 3 seconds, error rates and contention with synthetic isolated data, then document exact command and results in `specs/003-hire-negotiation/quickstart.md`.
- [ ] T048 Run layered unit/API suites, frontend tests/lint/build and all hiring browser journeys from `specs/003-hire-negotiation/quickstart.md`; verify schema migration, availability races, notification failures and account-switch cache behavior; record actual commands/results and remaining blockers in `specs/003-hire-negotiation/evidence.md`.
- [ ] T049 Reconcile reviewed schema changes in `docs/DatabaseSchema.md`, final interfaces in `specs/003-hire-negotiation/contracts/openapi.json` and validated setup in `specs/003-hire-negotiation/quickstart.md`; keep spec/plan aligned with implemented behavior and obtain decisions before altering approved product rules.
- [ ] T050 Run `$speckit-converge` for `specs/003-hire-negotiation/tasks.md`; append remaining work if found, close only evidenced tasks, then update `docs/sprints/SPRINT-03-HIRE-NEGOTIATION.md` and `docs/agent-memory/SESSION.md` with the true outcome and next step.

## Dependencies and execution order

```text
Setup T001–T002 → Foundation T003–T011 → US1 T012–T019
 → US2 T020–T027 → US3 T028–T034 → US4 T035–T039
 → US5 T040–T045 → Polish T046–T050
```

This is the recommended delivery order, not a claim that all business stories are unrelated.
US2 requires a request (US1 or fixture); US3 reuses US2 response/detail infrastructure;
US4 reuses US2 reads and US3 shared participant detail; US5 reuses US2 transaction/detail foundations.
US4 and US5 acceptance suites use fixtures, so neither requires live completion of the other's journey.
Do not parallelize story implementation that edits the shared store/controller/client/detail files.

Within Phase 2: T003/T004 may be authored together after Setup; T005 → T006 → T007 → T008;
T009 → T010 → T011 follows. Tests may initially fail; the phase checkpoint requires them passing.
Within each story: independent test tasks may be authored together at phase entry; implement
models/use cases before persistence, endpoints and UI, then run the checkpoint. Later tests needing
new helpers must add them sequentially rather than concurrently editing the common fixture.

## Parallel examples by story

| Story | Independent test authoring after prerequisites | Sequential integration |
| ----- | ---------------------------------------------- | ---------------------- |
| US1   | T012 API, T013 reliability, T014 form          | T015–T019              |
| US2   | T020 domain, T021 endpoints, T022 UI           | T023–T027              |
| US3   | T028 domain, T029 endpoints, T030 UI           | T031–T034              |
| US4   | T035 query, T036 UI                            | T037–T039              |
| US5   | T040 domain, T041 endpoints, T042 UI           | T043–T045              |

T046 and T047 can be authored in parallel after all stories; T048 waits for both.
These opportunities do not require spawning agents or changing the current one-phase-at-a-time workflow.

## Requirement coverage

| Requirements / outcomes | Primary tasks                                                   |
| ----------------------- | --------------------------------------------------------------- |
| FR-001–005              | T003, T005, T012, T015–T018                                     |
| FR-006–007              | T006–T010, T013, T016, T019                                     |
| FR-008–010              | T021, T024–T027, T035–T039                                      |
| FR-011–012              | T020–T027                                                       |
| FR-013–015              | T028–T034                                                       |
| FR-016–018              | T028, T040–T045                                                 |
| FR-019–020              | T010, T013, T016, T021, T024, T029, T032, T041, T043            |
| FR-021                  | T014, T018, T022, T027, T030, T033–T034, T036, T038, T042, T044 |
| FR-022                  | All story tests/checkpoints, T046, T048                         |
| SC-001–002              | T013, T019                                                      |
| SC-003                  | T021, T035, T046                                                |
| SC-004–005              | T020, T028–T029, T035, T040–T041, T045                          |
| SC-006                  | T047                                                            |
| SC-007                  | T019, T027, T034, T039, T045, T048                              |

## Implementation strategy

Deliver Setup/Foundation + US1 as the first independently demonstrable MVP. Add US2 for the first
useful learner-to-tutor response journey, then complete negotiation, tracking and closure. Validate
each checkpoint before continuing; do not mark a task complete based only on generated files.
Record only sanitized evidence. No payment, recurring scheduling, messaging UI or admin release work
is introduced. Task generation does not imply that implementation, tests or migration have run.
