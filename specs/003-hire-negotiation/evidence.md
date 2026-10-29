# Sprint 3 Evidence

Date: 2026-10-28. Scope: Phases 1–3 / T001–T019. This record distinguishes test infrastructure
verification from unimplemented hiring acceptance criteria. No production migration or application
behavior is changed by Phase 1.

## Traceability matrix

FR-001–007 and SC-002 have US1 implementation evidence below. FR-020–022 and SC-003/007
have create-only evidence; their other story cases remain pending. SC-001 has a timed synthetic
browser check, not a human usability study. Remaining entries are planned evidence destinations.

| Requirement | Observable result | Tasks | Planned evidence |
| --- | --- | --- | --- |
| FR-001 | Learner-only create; no self-hire | T012,T015,T017 | CreateHireRequestTests |
| FR-002 | Approved active tutor and offered active subject/course | T012,T015 | CreateHireRequestTests |
| FR-003 | Future date, schedules, frequency/duration, mode/location, VND | T003,T005,T012 | HireTermsTests; CreateHireRequestTests |
| FR-004 | Current availability validated under serialization | T010,T013 | HireCreationReliabilityTests |
| FR-005 | Listed price PENDING; alternate NEGOTIATING | T012,T015,T019 | CreateHireRequestTests; hire-creation.spec.ts |
| FR-006 | Atomic request/history/conversation/notification | T013,T016 | HireCreationReliabilityTests |
| FR-007 | Durable replay without duplicate rows | T013,T016,T019 | HireCreationReliabilityTests |
| FR-008 | Participant-only reads; admin monitoring deferred (MAY) | T021,T035,T046 | TutorResponseTests; HireQueryTests; HiringContractTests |
| FR-009 | Stable pages/status filter/text labels | T035–T039 | HireQueryTests; hire-tracking.test.tsx |
| FR-010 | Safe identities, ordered detail and histories | T021,T024,T035,T038 | TutorResponseTests; HireQueryTests |
| FR-011 | Tutor initial response; recipient accepts latest proposal | T020,T023,T028–T034 | InitialResponseTests; NegotiationEndpointTests |
| FR-012 | Reason required for rejection | T020–T027 | InitialResponseTests; TutorResponseTests |
| FR-013 | Both participants can counter | T028–T034 | NegotiationTests; NegotiationEndpointTests |
| FR-014 | Immutable full proposal versions | T006,T028,T032 | NegotiationTests; NegotiationEndpointTests |
| FR-015 | Accepted latest terms frozen | T028–T034 | NegotiationEndpointTests |
| FR-016 | Terminal requests reject negotiation | T028,T040 | NegotiationTests; CloseHireRequestTests |
| FR-017 | Learner open cancellation; either accepted with reason | T040–T045 | CloseHireRequestTests; hire-close.spec.ts |
| FR-018 | Confirmed completion, actor/reason/time recorded | T040–T045 | CloseHireRequestTests |
| FR-019 | Expected version and competing actions | T010,T021,T029,T041 | TutorResponseTests; NegotiationEndpointTests; CloseHireRequestTests |
| FR-020 | Recipient notification; no partial state on failure | T013,T021,T029,T041 | Story transaction failure suites |
| FR-021 | Preserve input; loading/errors/conflicts/confirmation | T014,T022,T030,T036,T042 | Story UI suites |
| FR-022 | Required denial/boundary/race/order/failure tests | T012–T048 | Story suites and final cross-cutting run |
| SC-001 | Create in <= three minutes | T019 | Timed synthetic create journey |
| SC-002 | Exactly one create outcome in all retry cases | T013,T019 | Concurrent create row counts |
| SC-003 | Zero unauthorized reads/writes | T021,T035,T046 | Authorization matrix |
| SC-004 | All permitted/disallowed transitions tested | T020,T028,T040,T045 | Exhaustive lifecycle matrix |
| SC-005 | Stable history under races | T029,T035,T041 | Concurrent action history assertions |
| SC-006 | 95% interactions <= 3 seconds, 100 users | T047 | Load harness and error/latency report |
| SC-007 | Five journeys independent of Sprint 4 | T019,T027,T034,T039,T045,T048 | Independent browser checkpoints |

## Analyze and source/contract review

Reviewed spec.md, plan.md, tasks.md, data-model.md, research.md, quickstart.md, OpenAPI and constitution.
29/29 FR/SC entries have planned task coverage (100%); 50 tasks, no unmapped tasks (shared setup and
verification support delivery). No remaining critical/high blocker after A1 remediation. Coverage
is a planning metric, not completed feature coverage. Duplication count: 0 actionable issues.
Ambiguity/inconsistency count: 2 findings below; no constitution exception introduced.

| ID | Severity | Locations | Finding and disposition |
| --- | --- | --- | --- |
| A1 | High, resolved | contracts/openapi.json Event.actorId; Domain/Hiring/RequestStatusHistory.cs ActorUserId; data-model.md migration | Existing history permits null actor, but contract prohibited it while migration forbids inventing facts. Contract now permits null for legacy events only; new events still require authenticated actor. T004/T009/T046 must preserve/test this distinction. |
| A2 | Medium, documented | contracts/openapi.json responses; Api/Controllers/TutorOffersController.cs | Sprint 3 documents validation 400; existing offers use 422. Different feature contracts may differ. Implement hiring's explicit 400 contract and verify runtime parity at T009/T046; do not reuse offers' mapping blindly. |

Existing conversation mapping already enforces unique HireRequestId. Current hiring entities lack
version/idempotency/final snapshot implementation; these remain Phase 2 work. Tutor offers lock
profile rows, and review actions lock profile then account; T010 still needs the complete writer
lock-order audit. Existing notifications are database rows; T002 injects failure at the PostgreSQL
INSERT boundary without introducing production hooks. Hiring endpoints do not yet exist.

Requirements checklist: 16 checked, 0 unchecked; no checklist markers modified. Extension configuration
`.specify/extensions.yml` absent: no before/after analyze or implement hooks. Git/Docker ignores already
cover backend generated artifacts and local environment files; no repository reinitialization needed.

## Reproducible baseline

Run from repository root with .NET 10 and Docker available. Testcontainers creates disposable,
uniquely named databases; no developer connection string is used. Never capture credentials in evidence.

- `dotnet test backend/TutorMatching.slnx --no-restore --verbosity minimal`
  - Baseline outcome: PASS — Domain 9/9, Application 45/45, API integration 167/167;
    221 total, zero failures/skips. Baseline started before new fixture tests were compiled.
- Initial sandbox attempts could not bind MSBuild sockets or reach the Docker socket; these are
  environment permission errors, not application test failures. The above command was retried outside
  the sandbox with authorized tool escalation. Docker daemon reports 28.4.0.
- Frontend baseline is not run: this phase changes only backend test infrastructure and documentation.
  Frontend and feature-wide acceptance remain in later checkpoints.

## T002 fixture verification

Files: `backend/tests/TutorMatching.Api.IntegrationTests/Hiring/HiringFixture.cs` and
`HiringFixtureTests.cs`. Uses the existing PostgreSqlFixture and ApiWebApplicationFactory without
changing their public setup or introducing a production service.

- Isolated learner, unrelated learner, tutor, unrelated tutor and admin; real Identity login and CSRF.
- Two approved active profiles, active subject, course with distinct course/session rates, weekly
  Monday/Wednesday/Friday 18:00–21:00 availability and synthetic location. Future date derives from
  the factory clock in Asia/Ho_Chi_Minh.
- RaceAsync opens independent scoped database connections before releasing both delegates; bounded
  cancellation is passed to callbacks. Callbacks own transactions and must observe cancellation.
- FailNotificationWritesAsync installs a test-only trigger in the factory database, fails INSERTs
  from any connection/API scope and returns an async lease which removes it. Dispose the lease before
  the fixture. A failed transaction must be rolled back/disposed before subsequent reads.

Command: `dotnet test backend/tests/TutorMatching.Api.IntegrationTests --no-restore --filter FullyQualifiedName~HiringFixtureTests --verbosity minimal`

| Test | Proves | Result |
| --- | --- | --- |
| SeedsPublicOfferingAndIndependentAuthenticatedActors | Real per-role sessions, public tutor eligibility, relational offerings and empty hiring baseline | PASS |
| RaceUsesTwoConnectionsAndIndependentTransactions | Distinct PostgreSQL backend PIDs and separately committed writes | PASS |
| NotificationFailureRollsBackEarlierWriteAndLeaseRestoresWrites | Actual database failure rolls back an earlier saved row; writes work after cleanup | PASS |
| FactoryIsolationKeepsFaultInjectionAndRowsLocal | Trigger/data cannot leak to a different factory database | PASS |

Initial new-suite run: 3 passed, 1 failed because the test used lowercase role and expected 200 for an
existing endpoint that requires canonical uppercase role and returns 204. Fixed the test to match
UsersController; this was a new-test assertion issue, not a pre-existing product regression.

Final fixture run: PASS — 4/4, zero failures/skips. `git diff --check` passed.

## Phase boundary

At the Phase 1 checkpoint, no T003–T050 acceptance was claimed. The Phase 2 work below retains this baseline and confirms A1 remains
aligned in migration/DTO tests. Subsequent implementation must add evidence rather than interpreting
this traceability matrix as passing feature tests.

## Phase 2 — foundational implementation (2026-10-28)

Scope: T003–T011 only; HTTP hiring workflows and frontend remain Phase 3 onward.

| Task | Implemented foundation | Verification |
| --- | --- | --- |
| T003/T005 | Domain HireTerms uses immutable weekly windows; numeric/text bounds, minute precision, full availability coverage/capacity, local future date, offered mode and valid location. FinalAgreement normalizes accepted time to UTC. | HireTermsTests: 11 new cases (Domain suite 20/20). Initial test-first run failed to compile because HireTerms did not yet exist; passing result follows implementation. |
| T004/T008 | `20261027173545_HireNegotiationFoundation` plus designer/snapshot; preflight before DDL, recoverable legacy snapshots, sequence ordering `(created_at,id)`, unknown actors/price retained, safe downgrade guard. | HiringMigrationTests 3/3: empty/current model parity; legacy upgrade/downgrade/re-upgrade; unrecoverable agreement aborts without schema or row loss. |
| T006/T007 | Guid concurrency token, original/final/proposal JSON snapshots, immutable history and schedule writes, per-request sequences, durable creation identity/outcome, indexes/checks/FKs. | HiringFoundationTests exercise immutable initial/final data, late schedule append denial, duplicate request identity, original outcome replay and no-op version stability. |
| T009 | Explicit command/response DTOs and transaction port in Application/Hiring. Required-vs-nullable fields, numeric/text bounds, unknown JSON members and minute-format schedule times align with contract. | HireContractTests 5/5; includes null legacy actor, required acceptance sequence, unknown actor injection, explicit confirmation, overflowing/noninteger price and optional-field null rejection. |
| T010 | Profile/account/catalog/request lock order, live role/account/participant checks, expectedVersion and one commit for request/history/conversation/notification/operation; clears tracked changes on rollback. | Concurrent writers produce one success/one conflict; notification failure leaves no aggregate rows; account/catalog/profile writers cannot bypass held locks; later availability changes are read fresh. |
| T011 | Scoped IHireRequestStore registered through AddInfrastructure already called by Program; explicit CORS Idempotency-Key allowlist. Existing auth/CSRF pipeline retained. | DI resolution and allowed/untrusted-origin preflight tests. No placeholder hiring routes or unused handlers added. |

### Lock-order audit

| Writer | Actual order / compatibility |
| --- | --- |
| HireRequestStore | Profile FOR UPDATE → caller/tutor accounts sorted by UUID FOR SHARE → subject/course/province/district FOR SHARE → request FOR UPDATE. Checks run after locks. Caller must be active; offering eligibility is optional only for later closing use cases. |
| TutorOfferService | Profile FOR UPDATE before availability/course changes. Hiring uses the same profile row to protect complete availability reads and offered subject/course membership. |
| TutorOnboardingService draft/submit | Profile lock before profile/subject updates; compatible with hiring. |
| TutorOnboardingService avatar | Found implicit mixed profile/account update order. Changed to explicit profile → account locks in one transaction; targeted test verifies it waits on the profile and updates both avatar fields after release. |
| TutorReviewService | Profile → tutor account; compatible with hiring's shared account locks. |
| IdentityAccountService profile edits | Profile lock before account update when the tutor name changes; account-only edits do not acquire profile locks afterward. Registration creates new rows. |
| CatalogService | Updates catalog rows and audit only; no later profile lock. Hiring's FOR SHARE blocks concurrent catalog UPDATE until commit. |
| Token sessions / Identity writes | Session/account operations do not subsequently lock tutor profiles; no cycle with hiring, which does not lock sessions. |

`WriteScopeHoldsEligibilityLocksUntilCommit` uses a bounded PostgreSQL lock timeout for profile,
caller account and subject updates, then verifies a subsequent availability edit is observed.
`AvatarWriterWaitsForProfileBeforeAccountAndUpdatesBothRows` checks the actual onboarding writer.
A clean scoped context is required by the port; callbacks stage database work only and must not
perform external effects. Construct mutation responses from the aggregate after ExecuteAsync returns,
so a rotated version is reflected. Durable replay/create orchestration remains T015–T016.

### Migration and compatibility decisions

- Original terms, proposal effective terms and accepted agreement are JSONB snapshots with immutable
  domain values; relational schedule rows remain for compatibility. Snapshot comparisons detect EF
  modifications. New history must record an actor; imported history may retain null.
- `is_legacy` is internal provenance on requests/proposals/events, not an API flag. Imported listed
  price remains null because the old schema never recorded it. New requests require listed price.
- Legacy proposal order uses timestamp then UUID; omitted price/schedule inherits previous effective
  terms. No acceptance actor, historical listed price or historical location name is fabricated.
- Any evidence of past acceptance without a verified agreement snapshot stops upgrade with
  `HIRE_LEGACY_REVIEW_REQUIRED`. Correct/reconcile such data from verified records before deployment.
- Downgrade is allowed for untouched imported data and blocked once new hiring records, events,
  proposals or final agreements exist, to avoid dropping information unavailable to the old schema.
- Migration was generated and exercised only in Testcontainers databases; no user/developer database
  was upgraded. Stop old API writers before any later deployment migration.

### Commands and results

- `dotnet test backend/tests/TutorMatching.Domain.UnitTests --no-restore --verbosity minimal`: 20 passed.
- `dotnet test backend/tests/TutorMatching.Application.UnitTests --no-restore --verbosity minimal`: 50 passed.
- `dotnet test backend/tests/TutorMatching.Api.IntegrationTests --no-restore --filter FullyQualifiedName~Hiring --verbosity minimal`: intermediate foundation run 13 passed; additional lock/snapshot tests added afterward.
- `dotnet test backend/TutorMatching.slnx --no-restore --verbosity minimal`: 254 passed
  (Domain 20, Application 50, API 184), zero failures/skips, before the final avatar lock adjustment.
- Final contract check: 5/5 passed after optional/null converter refinement.
- Final foundation/onboarding check: 27/27 passed, zero failures/skips; command filters `FullyQualifiedName~Hiring|FullyQualifiedName~TutorProfileTests|FullyQualifiedName~OnboardingContractTests`.
- Development-only failures corrected during implementation: legacy fixture omitted required
  certifications JSON; optional dictionary converter had a type-generation syntax error; avatar
  lock test initially expected raw PostgresException rather than the existing execution strategy's
  InvalidOperationException wrapper. These are resolved before checkpoint completion.

No SRS user journey is marked accepted by this foundation checkpoint. Feature endpoint authorization,
state-machine behavior and browser journeys still require their own story checks.

Final rollback refinement: `dotnet test backend/tests/TutorMatching.Api.IntegrationTests --no-restore --filter FullyQualifiedName~NotificationFailureRollsBackEntireAggregateAndRetrySucceeds --verbosity minimal` passed 1/1; failed updates preserve the persisted version, note and notification count as well as rolling back failed creation.

**Phase 2 checkpoint: PASS.** T003–T011 checked complete. Diff whitespace checks passed for tracked
and new source/docs. No extension hooks configured. Next: T012–T019 / US1; call domain validation
under the locked offering and implement durable replay orchestration before exposing POST create.


## Phase 3 — US1 create and replay (T012–T019)

Implementation:
- Application `CreateHireRequest` derives the learner from ICurrentUser, normalizes optional strings
  and sorted minute-precision schedules, hashes the full canonical payload (including displayed price),
  validates under current offering locks and creates PENDING at listed price / NEGOTIATING otherwise.
- Store takes a transaction-scoped learner/key advisory lock before profile/account/catalog locks.
  Composite PK remains authoritative; defensive unique-PK losers roll back and reload the winner.
  Replay checks active learner authorization and fingerprint before current offering/date validation,
  returning the original immutable 201 even after the request or tutor price changes.
- Cookie validation may track an unchanged Identity user; the store detaches reads before locking,
  while rejecting contexts with pending changes. All six business record categories commit together.
- POST `/api/v1/hire-requests` validates UUID identity, LEARNER role, shared CSRF and strict JSON
  integer types. Hiring field validation is 400 with camel-case fields; conflicts are 409; errors
  include a safe code. Shared CSRF rejection remains 400, role denial 403. OpenAPI generation checks implemented create input, success, headers/security
  and response media/statuses. Error media corrected to application/problem+json with traceId.
- Form selects actual subjects/courses, future date, frequency, duration, offered mode, catalog location,
  available weekly windows and integer VND price. It uses shared authenticated Axios, waits for 201,
  retains payload/key on transport failure, and creates a new identity after explicit content edits.
  Background public refetches cannot silently change retry terms. Explicit refresh updates the offer.
  Dialog scrolls within viewport and prevents closing during submission; success needs no messages page.
  Tutor detail now opens this real form.

Verification record:
- API red baseline before endpoint: 15/15 failed as expected. First implementation exposed the tracked
  Identity context issue; fixed and verified by actual authenticated HTTP requests.
- Create/security acceptance: initial expanded run 32/32 passed; final focused suite listed below.
- Full backend: `dotnet test backend/TutorMatching.slnx --no-restore --verbosity quiet` —
  293/293 passed (Domain 20, Application 50, API 223), including separate-connection eligibility races.
- Full frontend: `npm --prefix frontend test -- --maxWorkers=2` — **226/226 passed** (31 files).
- Focused hiring/foundation/security/generated-contract suite — **51/51 passed**, including the
  extra public-profile eligibility test after the full backend run. Final create checks below
  additionally verify 400 structural errors versus 409 current-availability conflicts.
- `npx tsc --noEmit` and ESLint on changed frontend sources/tests passed; `git diff --check` passed.
- `dotnet run --project backend/tests/performance/tutor-discovery --no-restore -- --hire-browser
  /tmp/hiring-browser-evidence-final` — browser journey passed, with real API and disposable PostgreSQL.
  The existing Next dev server on port 3000 was reused; all browser API traffic was routed to isolated
  API port 5108. No developer account/database writes. Fixture seeds only synthetic accounts.
- Final browser elapsed: **4,614 ms**, two deliveries / one idempotency key; database counts exactly
  `[1,1,1,1,1,1]` for request, schedule, initial event, conversation, notification, operation.
  First delivery committed then response was intentionally dropped; second returned original 201.
  SC-001 automated scenario is below three minutes; SC-006 load and human usability remain unmeasured.
- Browser artifacts: `/tmp/hiring-browser-evidence-final/hiring-timing.json`, `hiring-counts.json`,
  `hire-created.png`. Earlier screenshot inspected: readable confirmation and request ID.
- Docker became unresponsive mid-run; user explicitly authorized restart, after which tests recovered.
  Initial E2E failures were fixture port/routing and custom-checkbox automation; corrected and rerun.
  Existing performance-project Pkcs advisory warnings and EF collection-comparer warnings remain;
  no unrelated dependency changes were made.

Scope boundary: list/detail reads, initial response, negotiation, tracking, cancellation/completion
and final load/accessibility gates remain Phase 4 onward. Migration remains unapplied to user DB.

Final checkpoint: **T012–T019 complete**. Final create/reliability/security rerun:
`dotnet test backend/tests/TutorMatching.Api.IntegrationTests --no-restore --filter
'FullyQualifiedName~CreateHireRequestTests|FullyQualifiedName~HireCreationReliabilityTests|FullyQualifiedName~HiringApiSecurityTests'
--verbosity quiet` — **39/39 passed** after separating invalid requested schedules (400) from
changed/unavailable tutor schedules (409). No task beyond Phase 3 marked complete.


### US1 form state refactor — 2026-10-29

- `useHireRequestForm` owns validation, payload construction, catalog queries, API effects and
  idempotency/in-flight refs. `hire-request-form.reducer` owns offer snapshot, input values,
  submission union and explicit refresh transitions. Component renders state and invokes actions.
- Background detail errors no longer unmount a populated form, including when the parent detail
  page changes to its error view. Same-payload retry preserves its original key.
- Explicit offering refresh retains valid selected schedules and notes, drops removed/changed-day/
  out-of-bounds slots with a visible reselection notice. Failed refresh preserves inputs and snapshot.
- Verification (frontend working directory):
  - `npm test -- --maxWorkers=2 tests/components/HireTutorDialog.test.tsx tests/components/TutorCard.test.tsx tests/tutor-detail.test.tsx tests/hire-request-form.reducer.test.ts`: 22/22 pass.
  - `npx tsc --noEmit`: pass.
  - ESLint on the two form hook/reducer files, dialog/detail components and changed tests: pass.
- Existing full-suite and browser evidence above predates this refactor; they were not rerun here.


### Local schema repair — 2026-10-29

- Reported create failure: PostgreSQL 42P01, missing `hire_create_operations`.
- Read-only inspection of the API-configured localhost:5433 database confirmed latest migration
  was `20261022162700_AddDiscoveryPerformanceIndexes`; hire_requests contained zero rows.
- Ran `dotnet run --project backend/tools/TutorMatching.DatabaseMigrator`: exit 0, migration complete.
- Post-upgrade read-only verification: `20261027173545_HireNegotiationFoundation` recorded,
  `to_regclass('hire_create_operations')` resolves, hire_requests remains empty.
- No request was submitted on the user's behalf; end-to-end create after this local upgrade remains
  to be exercised through the UI. Earlier statements about not migrating locally describe prior checks.


## Phase 4 — US2 review and respond (T020–T027)

Implementation:
- Domain `HireRequest` state transition rules:
  - Added `CanRespond(Guid actor, Guid tutor)`: actor == tutor && status in ("PENDING", "NEGOTIATING").
  - Added `CanAcceptInitial(Guid actor, Guid tutor)`: `CanRespond` && `LatestProposalSequence == 0` && `FinalAgreement == null`.
  - Added `AcceptInitial(...)`: enforces actor == tutor, freezes `FinalAgreement` (copying InitialTerms, actor, UTC acceptedAt, province/district labels), sets `AgreedPriceVnd` and transition event to "ACCEPTED".
  - Added `Reject(...)`: validates non-blank reason (1–1000 characters), transition event to "REJECTED" with reason.
  - Added `HireRuleException` carrying error codes: "forbidden", "state_conflict", "invalid_reason".
- Application use case `RespondToHireRequest`:
  - Enforces `ICurrentUser` actor with `AccountRole.TUTOR`.
  - Executes within `IHireRequestStore.ExecuteAsync`:
    - On acceptance: validates proposalSequence is null, revalidates offering eligibility, future start date and weekly window capacity under row locks.
    - On rejection: does not re-require offering validity (expired/unavailable requests can still be rejected), validates trimmed reason length.
    - Emits one `RequestStatusHistory` and one recipient notification to learner.
  - Returns `HireResult` (Id, Version, Status) projected after commit to reflect the rotated optimistic concurrency `Version`.
- Queries `IHireRequestQueries` and `HireRequestQueries`:
  - Participant-scoped list and detail queries running with `IsolationLevel.RepeatableRead` and `AsNoTracking()`.
  - Enforces actor role (LEARNER or TUTOR) and matches against `RequesterUserId` or tutor profile `UserId`. Non-participants receive 404 without leaking request existence.
  - Keyset cursor pagination over `(CreatedAt DESC, Id DESC)` with boundary validation, status filter, and `pageSize` bounded to 1–100 (default 20).
  - Server-computed `allowedActions` based on actor role and request status.
- API `HireRequestsController`:
  - Scoped `[Authorize(Roles = "LEARNER")]` strictly to POST create.
  - Added GET `/api/v1/hire-requests` for list (LEARNER and TUTOR).
  - Added GET `/api/v1/hire-requests/{id}` for detail (LEARNER and TUTOR).
  - Added POST `/api/v1/hire-requests/{id}/accept` (TUTOR role, requires matching `expectedVersion` and `proposalSequence: null`).
  - Added POST `/api/v1/hire-requests/{id}/reject` (TUTOR role, requires matching `expectedVersion` and 1–1000 char reason).
  - Registered `RespondToHireRequest` and `IHireRequestQueries` into DI.
- Frontend Client & Hooks:
  - Added types and methods `listHireRequests`, `getHireRequest`, `acceptHireRequest`, `rejectHireRequest` in `frontend/src/lib/api/hire-requests.ts`.
  - Added TanStack Query hooks in `frontend/src/hooks/use-hire-requests.ts`: `useHireRequests`, `useHireRequestDetail`, `useAcceptHireRequest`, `useRejectHireRequest`.
- Tutor UI:
  - `TutorGuard`: permitted `/tutor/requests` so tutors can review/reject requests even if profile is not yet approved.
  - `TutorSidebar`: added "Yêu cầu thuê" navigation item with inbox icon.
  - `HireRequestDetail`: status badge, participant identities, initial & current terms, frozen final agreement display, full chronological history timeline, accept button, rejection reason form with live validation and character count, and 409 conflict handling with draft retention and refresh.
  - `frontend/src/app/(tutor)/tutor/requests/page.tsx`: keyset paginated request list with status badges, loading skeletons, error card, and empty state.
  - `frontend/src/app/(tutor)/tutor/requests/[id]/page.tsx`: detail view with conflict recovery, draft preservation, and accept/reject mutations.
- Test suites created & verified:
  - Domain: `InitialResponseTests.cs` (13 tests: state transitions, authorization, reason validation, agreement freezing).
  - Integration: `TutorResponseTests.cs` (13 tests: initial acceptance, rejection, unauthorized blocking, 404 isolation, notification rollback, competing responders race, keyset pagination).
  - Frontend: `hire-response.test.tsx` (9 tests: component rendering, action visibility, accept action, reason validation, 409 conflict banner and draft retention).
  - Frontend pages: `hire-response-pages.test.tsx` (3 tests: keyset pagination navigation stack, 409 ApiError draft retention, private draft clearing on account switch).
  - E2E: `hire-response.spec.ts` executed via `dotnet run --project backend/tests/performance/tutor-discovery -- --hire-response-browser /tmp/phase4-response-final`.
    - Elapsed: 16,121 ms; verified 2 requests, 4 histories, 2 conversations, 2 operations, 4 notifications (2 to learner), frozen agreement price 150,000 VND.

Verification summary:
- Full backend: `dotnet test backend/TutorMatching.slnx` — **320/320 passed** (Domain 33, Application 50, API Integration 237), 0 failed, 0 skipped.
- Full frontend: `npm --prefix frontend test` — **245/245 passed** (34 files), 0 failed.
- Frontend lint: `npm --prefix frontend run lint` — passed.
- Frontend build: `npm --prefix frontend run build` — passed.
- E2E browser: `--hire-response-browser` passed (exit code 0); `--hire-browser` passed (exit code 0).

**Phase 4 checkpoint: PASS.** T020–T027 checked complete. Next: Phase 5 / US3 (T028–T034) — Counter-proposal negotiation.
