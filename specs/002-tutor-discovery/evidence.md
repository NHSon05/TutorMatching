# Sprint 2 implementation evidence

## Phase 1 — 2026-10-20

- Requirements checklist: 16 checked, 0 unchecked. No extensions.yml hooks present.
- T001: real HTTP onboarding draft/read and partial update preservation; empty legacy draft save followed by rejected submission. Both tests passed on disposable Testcontainers PostgreSQL 17.6.
- Compared frontend/src/lib/api/tutor-onboarding.ts with current DTOs. Corrected planned OpenAPI onboarding sections and submit response; expectedVersion remains additive rollout work, not an implemented requirement for legacy clients.
- T002: 11 public eligibility cases executed: 2 passed (draft omitted by default list; approved active profile discoverable), 9 failed (5 hidden-detail cases; 2 status override list cases; 2 locked/inactive list cases). Failures are assertions against actual public responses, not fixture errors. T002 remains unchecked until gate becomes green after T003.
- Command: `dotnet test backend/tests/TutorMatching.Api.IntegrationTests --no-restore --filter 'FullyQualifiedName~OnboardingContractTests|FullyQualifiedName~PublicEligibilityTests' --logger 'console;verbosity=normal'`.
- Final result: 13 tests, 4 passed, 9 failed; compilation succeeded. Product behavior unchanged; no full solution test run needed for this test-only baseline.
- Initial fixture registration returned 422; isolated onboarding/discovery fixtures now create users through UserManager and authenticate through real login. Public registration issue remains outside this phase and needs a separate Sprint 1 regression investigation; no claim about its root cause.
- Frontend AGENTS.md and TextField design-system guidance read; no UI modifications.
- Diff whitespace check passed for changed test/feature files. No implementation checkpoint marked fully passed.

Next: T003 shared APPROVED+ACTIVE gate, removal of status override, public projection cleanup; rerun these tests and complete T002 only when all eligibility cases pass.

## Phase 2 — 2026-10-20

Implemented T003–T010; T002 regressions now pass. Public list/detail share PublicTutorQueries (APPROVED + ACTIVE), reject status override, no-store, rating null and no certificate file URLs. Frontend shows “Chưa có đánh giá”.

Catalog: public active-only reads, ADMIN reads including inactive and create/update for subjects/provinces/districts/teaching-levels; ownership-independent admin role boundary, CSRF, validation, duplicates and province relationship checks, audit on writes. UI /admin/catalog uses existing primitives and Axios/session handling. Catalog rows are small reference datasets materialized before DTO sorting; tutor search pagination remains later US4 work.

Persistence: TeachingLevel/TutorSubjectLevel, UUID version concurrency and normalized name; DiscoveryFoundation migration seeds four levels and one canonical subject. Explicit exact-name mapping preserves legacy JSON; unknown approved subjects or missing price/levels downgrade to DRAFT with audit. Incomplete active courses become HIDDEN. No production geographic dataset is invented: admins enter project areas. SQL constraints for new/updated rows use NOT VALID to retain old invalid historical schedules. Migration downgrade is explicitly blocked; use reviewed backup restoration. The EF snapshot also adopts relationships already present in the preceding hand-authored schema migration; duplicate FK additions were removed from the generated delta.

Verification:

- Final focused backend run: 22 tests, 21 passed, 1 failed. All 20 Tutor/Admin/Catalog/Onboarding/Migration tests passed; conflicting-history schema test passed. Remaining fresh-schema test passes catalog/model constraint checks, then fails creating a user with the pre-existing registration 422 issue.
- Migration tests: fresh seed/idempotence and actual upgrade from 20261019090000 with mapped/unmapped approved profiles; legacy text retained, unknown profile drafted, audit written, no fabricated admin review.
- Earlier full solution run: Domain 2/2, Application 45/45; API integration 75 passed/35 failed before the FK-name and migration-count fixes. Failures include registration 422 cascades, undocumented admin extension operations in the old aggregate OpenAPI check, and legacy Pascal-case migration object-identity checks. Not a clean full-backend result.
- Frontend final suite: 22 files, 181/181 tests passed, including two catalog UI tests.
- Frontend production build and TypeScript passed; /admin/catalog generated. Targeted new-file ESLint and diff whitespace checks passed.
- Migration only executed against disposable test databases. Developer database not upgraded.

Remaining release gates: investigate registration 422 separately; reconcile aggregate OpenAPI contract tests with implemented admin/catalog deltas; resolve legacy Pascal-case migration regression. No claim that the complete backend or browser E2E suite passes.

## Release-gate repairs — 2026-10-21

All backend gates described in Phase 2 above are now resolved.

- Registration 422: IdentityAccountService assigned role on account creation, then called AddToRoleAsync for the same role. Removed the redundant call. Existing LEARNER/TUTOR registration and authorization scenarios now pass. Role removal is explicitly rejected because every persisted account requires a canonical role; role replacement still invalidates access/refresh sessions without relying on a security-stamp change.
- Contract: checked-in admin-catalog-implemented.openapi.json is merged with the foundation contract during strict comparisons; server prefixes are normalized and inherited cookie/CSRF requirements explicit. New unnamed operations receive stable method/route IDs. No new paths are exempted from comparison.
- Legacy migration: object identity is checked specifically across UseSnakeCaseDatabaseNames, then later role/schema migrations and preserved data are verified separately. Migration counts follow the actual migration list rather than a stale literal seven.
- Final full command: `dotnet test backend/TutorMatching.slnx --no-build --no-restore --logger 'console;verbosity=minimal'` completed successfully. Domain 2/2, Application 45/45, API integration 109/109: total 156 passed, 0 failed, 0 skipped. Build had succeeded before the final run. Scoped diff whitespace check passed.
- Local database: configured localhost:5433/tutormatching upgraded through DatabaseMigrator after backup. PostgreSQL and Mailpit started through project compose; no API listener was active on port 5014. Verified all eight migrations through DiscoveryFoundation and four teaching levels. Database at port 5432 was not migrated.
- Pre-upgrade custom-format backup: /private/tmp/tutormatching-before-discovery-20261021.dump, owner-only permissions. Keep separately if long-term retention is needed; /tmp is temporary storage.

Next feature work is T011. Browser E2E and later sprint tasks are not implied complete by these backend repairs.

## Phase 3 / US1 — 2026-10-21

T011–T014 complete.

- Added additive owner response version/discovery and normalized subject/level selection, teaching modes and service area. Legacy step-based drafts still roundtrip; legacy free-text subject edits cannot replace existing normalized associations. Incomplete drafts may keep subjects without levels; active subject plus active level per subject is required at submission.
- Domain TutorProfile owns CanEdit/CanSubmit/ReconsiderApproval lifecycle checks. Draft/save and submit serialize on the tutor-profile row in retryable transactions. Pending edits and stale versions return 409; approved edits require current version. Valid submission requires version, positive session rate (no hourly/monthly conversion), qualification and configured owner completeness fields. Offline/hybrid require an active district belonging to an active province.
- Changed approved core content becomes PENDING_REVIEW when complete, otherwise DRAFT; approvedAt cleared immediately. Shared account full-name edits also trigger re-review and cannot change the name during pending review. Public eligibility tests remain green.
- Owner UI and onboarding wizard now use public catalogs, per-subject levels, teaching modes, areas, session rate and review submission. Pending forms lock; conflicts preserve input and ask refresh. Inactive catalog choices can be removed. Avatar upload keeps navigation disabled until the latest profile version is refreshed, preventing a stale next-step save.
- New TutorProfileTeachingModes migration adds teaching_modes jsonb with [] for existing rows; legacy teaching mode is not guessed. Local backup /private/tmp/tutormatching-before-us1-20261021.dump made with owner-only permissions, then configured localhost:5433 database upgraded. Verified latest migration 20261021104138_TutorProfileTeachingModes and new column access; no API listener was active during upgrade.

Verification:

- Full backend command `dotnet test backend/TutorMatching.slnx --no-restore`: Domain 2/2, Application 45/45, Integration 116/116; total 163 passed, 0 failures/skips.
- Seven new integration cases cover pending/stale/complete and incomplete re-review, positive price validation, wrong role/foreign routes, invalid/inactive catalogs/areas and incomplete level drafts. Existing registration/admin/migration/OpenAPI/private-field tests pass.
- Full frontend suite 23 files / 184 tests passed. After the final upload-race regression was added, targeted tutor-profile.test.tsx passed 4/4 (three already included in the full suite plus one new upload/version timing case).
- Production frontend build and TypeScript passed. Targeted ESLint passed without errors; scoped diff whitespace check passed. Browser E2E was not run in this phase.

Next: T015 in Phase 4, availability/course independent tests.

## Phase 4 / US2 — 2026-10-21

T015–T019 complete. No database migration: existing availability_slots/courses schema reused.

- Domain WeeklyAvailability validates ISO weekday 1–7 and start<end, half-open overlap rules, and computes duration capacity from merged availability/request intersections without double counting adjacent or duplicate windows. Course.ValidOffer enforces name/content/count/price/status limits.
- Application ITutorOfferService and Infrastructure TutorOfferService implement owner-scoped CRUD, with retryable transactions locking the tutor profile before schedule/course writes. Availability excludes dated/invalid historical rows from the weekly UI but retains storage; deletion sets isActive=false. Concurrent overlap attempts produce one success and one 409.
- Course ACTIVE/HIDDEN CRUD checks tutor-subject membership and catalog activity; an existing hidden course may retain an inactive historical subject. DELETE always sets HIDDEN/deletedAt, retaining the row and references. Invalid activation/count/price and foreign ownership are rejected.
- API /api/v1/tutor/availability and /courses expose GET/POST and PUT/DELETE by resource ID. TUTOR only, claims-derived ownership, CSRF, no-store. Times use HH:mm and Asia/Ho_Chi_Minh. Validation errors identify fields; overlap 409, foreign/missing/deleted ID 404, invalid data 422. Offer edits do not modify approval status.
- UI /tutor/offers has empty/loading/error/retry, edits, deletion and course status controls, preserves unrelated drafts, and isolates private caches/forms by account. Unapproved tutors can access offers/profile-edit; teaching/dashboard still require approval. Navbar provides management links during onboarding.

Verification:

- Full backend suite: Domain 4/4 + Application 45/45 + Integration 121/121 = 170 passed, no failures/skips.
- After adding field validation: OfferTests + OpenApiContractTests 6/6 passed. Final expanded offer assertions (unlinked/inactive subject, hidden retention, overlap race, foreign owners, wrong roles) 5/5 passed.
- Full frontend final: 25 files, 193/193 tests passed using `npm --prefix frontend run test -- --maxWorkers=2`. This includes five offer editor tests and three route-access tests. An earlier unconstrained run timed out waiting for the catalog row while build ran concurrently; no tests/assertions were removed, and the worker-limited complete run passed.
- Production frontend build and TypeScript passed, route /tutor/offers generated. Targeted ESLint and scoped diff whitespace checks passed.
- Browser E2E and booking reservations are outside this phase. Existing local schema remains current from Phase 3; no new migration or local data writes required.

Next: T020, Phase 5 review queue/decisions/history and concurrency tests.

## Phase 5 — US3 — 2026-10-21

T020–T023 complete. Requirements checklist remains 16/16; no implementation extension hooks present.

Implementation:

- ITutorReviewService/TutorReviewService provide pending-active queue, consistent admin detail, three decision actions and owner-only history. Detail reuses the owner onboarding DTO with string status and includes per-subject level labels, area names and history.
- Request changes → DRAFT, reject → REJECTED, approve → APPROVED. Nonblank reason required for request changes/reject. Every decision route, including Sprint 1 aliases, requires expectedVersion from the displayed detail. Stale version/state and inactive accounts return 409.
- Profile/account row locks serialize decisions; history (actor, action, reviewedVersion, statuses, full note, time), audit event, notification and profile status/version commit atomically. Application persistence disallows modifying/deleting existing review history.
- TutorReviewDecisions migration adds action/nullable reviewed_version and history index. Legacy action backfills from recorded target status (unknown target → LEGACY_REVIEW); historical versions stay null. Original reasons, actors and dates remain intact.
- Real admin UI replaces mock approvals at /admin/tutor-approvals: pagination, detail, reason validation, actions, stale conflict/reload and loading/error/empty states. Tutor professional form and onboarding show status/history/reasons. Existing owner tests now mock the added history dependency without weakening save-error assertions.

Verification:

- `dotnet test backend/TutorMatching.slnx --no-restore`: Domain 4 + Application 45 + Integration 130 = **179 passed**, zero failed/skipped (`/tmp/s5-backend-final.log`). Nine TutorReviewTests cases cover transitions/race, role denial, stale resubmission, missing/invalid tokens/actions/pages, inactive accounts, long reasons, immutable history, CSRF, owner isolation and legacy migration/idempotence. Existing four admin extension cases still pass with versioned requests.
- Strict OpenAPI aggregate compares new admin routes and owner review history; narrowed the preexisting tutor skip for this new owner endpoint. Final dedicated contract check **1/1 passed** after this test-only strengthening (`/tmp/s5-contract-owner-final.log`). Initial contract failures exposed required-token/security declaration changes; contracts were updated, no new endpoint was exempted.
- `npm --prefix frontend run test -- --maxWorkers=2`: **26 files / 198 tests passed** (`/tmp/s5-frontend-final.log`), including five review UI tests. An initial older form test exposed its unmocked history request; added that dependency mock and retained its original input-preservation assertion.
- Frontend production build/TypeScript passed (`/tmp/s5-fe-build-final.log`); scoped ESLint and backend/frontend/spec diff whitespace checks passed. Browser E2E remains Phase 8, not claimed here.

Local deployment and backup caveat:

- Applied migration **20261021161732_TutorReviewDecisions** through DatabaseMigrator to the API-configured **localhost:5433/tutormatching**. Direct psql verification confirmed this migration and zero empty/null review actions.
- Stopped the identified existing API process and restarted its updated build at http://localhost:5014. Smoke: OpenAPI 200 with all three review paths; anonymous queue 401.
- The pre-upgrade Compose dump targeted a different PostgreSQL instance (its history is still AddDatabaseSchemaEntities), so it is **not a valid pre-upgrade backup of the API database**. This was detected in final direct verification; do not claim a current pre-upgrade restore point from that dump.
- Created and verified a nonempty, owner-only **post-migration** backup of the correct configured database at `/private/tmp/tutormatching-after-us3-5433-20261021.dump` (temporary local storage). The Compose instance was not migrated. Future backups must resolve the API connection explicitly.

Next: Phase 6 / T024, US4 search/filter tests. AI stays deferred after MVP.

## Phase 6 — US4 — 2026-10-22

T024–T028 checkpoint: five Domain CapacityTests, 31 PostgreSQL search/public-gate cases and nine frontend search/regression cases passed (`/tmp/s67-search2.log`, `/tmp/s67-search-ui.log`). Query validation returns400, filters/count/page stay in PostgreSQL; bounded page projections use normalized catalog labels. Weekly matching uses PostgreSQL numeric multirange union of same-day intersections, equivalent to Domain WeeklyAvailability.Capacity; duplicate/adjacent windows do not inflate capacity and gaps do not combine into longer sessions. Teaching-mode filtering uses JSONB ?| because the existing list value converter cannot translate collection LINQ. Initial combined-filter test caught that translation issue; corrected without moving filtering to memory.

UI applies filters through URL, resets page on filter/sort change, preserves filters between pages and removes mock fallback. Existing modal/hiring tests were replaced with no-mock-leak regressions: the real discovery flow opens canonical /tutors/{profileId} detail; the prototype hire-success UI is not attached to this public flow. Learner discovery entry point also uses real search. Full build/regression and contract verification follow the Phase7 integration below.

## Phase 7 — US5 and final Phase6–7 verification — 2026-10-22

T029–T031 complete; T001–T031 are checked. Requirements checklist16/16, no extension hooks. AI remains deferred.

- Public detail now has an Application port and Infrastructure projection, canonical profileId-only lookup, repeatable-read snapshot and exact public DTO allowlist. Anonymous detail uses the same APPROVED/ACTIVE-TUTOR/positive-session-price/active-subject gate as search. Public normalized subject/level names, broad area, weekly availability and courses are explicit projections; no owner/contact/certificate-file fields or invented prices/ratings.
- Only active valid WEEKLY slots and ACTIVE/nondeleted courses with positive count/price, active subject and tutor-subject membership appear. Hidden/deleted/inactive/dated rows remain stored and do not appear publicly. Losing account/profile/last-subject eligibility yields404.
- Real route /tutors/{profileId} supports loading, retry, unavailable and empty-offer states; refetch hides cached content, checks on mount/focus/manual refresh. Existing public list cards link to canonical profile IDs. Both public endpoints are no-store.
- New SQL capacity oracle test compares actual API results with Domain WeeklyAvailability.Capacity for16 combinations across durations30/60/90/240, frequencies1/2/3/21, fragmented multi-day availability and duplicate requested windows. Additional validation covers out-of-range frequency/duration/day and invalid/reversed time syntax.
- Existing PublicEligibility fixture now has a valid session price/active subject. CurrentProfileEndpointTests privacy fixture also uses its real profileId instead of userId. Original privacy assertions remain intact; an initial full regression caught this old identifier assumption and it was migrated rather than bypassed. Routing assertions preserve prior role/session coverage while replacing mock names with API-backed empty-state expectations.
- Strict aggregate OpenAPI check now includes list and detail instead of the earlier broad tutor skip, preserving its other assertions. Implemented schemas/paths are frozen in contracts/openapi.json and the aggregate implemented contract. Query integer/UUID metadata and public additionalProperties=false are generated explicitly.

Final evidence:

- `dotnet test backend/TutorMatching.slnx --no-restore`: **Domain9 + Application45 + Integration160 =214 passed**, zero failed/skipped (`/tmp/s67-backend-final2.log`). Includes strict OpenAPI and prior registration/migration/account/profile/offer/review regressions.
- `npm --prefix frontend run test -- --maxWorkers=2`: **28 files /210 tests passed** (`/tmp/s67-frontend-final2.log`). Eight search tests, four detail tests, two no-mock-fallback regressions; routing integration passes. Clear-all explicitly resets unsaved input even when the URL is already empty; final reset regression8/8 also passed before the full run.
- `npm --prefix frontend run build`: production build and TypeScript passed; /tutors and /tutors/[id] emitted (`/tmp/s67-build-final.log`). Scoped ESLint passed with zero warnings (`/tmp/s67-lint-final2.log`); git diff --check passed.
- No migration added and no developer database writes made for Phases6–7. The existing listener on5014 was not restarted or duplicated; restart that backend process to load the new code.
- Browser E2E, 10,000-profile/100-user benchmark/query plans and whole-sprint convergence remain T032–T035, **not claimed complete**. Existing local certificate file-serving policy is unchanged; this phase protects public JSON/UI field exposure.

Next: Phase8 / T032 performance corpus and load runner, then T033–T035.

## Tutor-list UI correction — 2026-10-22

User requested the earlier card-list appearance instead of the expanded form. Restored a compact name search and four dropdown filters, original-style avatar/professional/subject/experience/price card grid, compact sort toolbar, rounded CTA and centered responsive layout. Advanced price/qualification/district/schedule filters remain available in a collapsed accordion (auto-open for applied advanced URL criteria). Real API filtering, pagination and canonical detail links remain. Multi-select options now support keyboard Enter/Space and selected-state semantics.

Root cause of the empty local list:10 APPROVED demo profiles had positive session prices but zero normalized subject associations. DevelopmentDataSeeder previously skipped existing demo accounts and created new ones without normalized links. The fix normalizes new demo subjects/levels and explicitly sets the fixture mode ONLINE; recognizes unchanged demo records by known email/name/legacy content/status; repairs only those without associations. It never reapproves edited profiles or reactivates disabled catalog items. Real accounts are not migrated by this demo repair.

Verification:

- Frontend full suite28 files211/211 passed (`/tmp/tutor-ui-frontend-full.log`); scoped search/UI/routing28/28 and final search9/9 passed, lint and production build/TypeScript passed. Last changes after the build were layout/theme/rounding classes and the background wrapper, checked by frontend tests and browser screenshot.
- Added DevelopmentTutorSeedTests (idempotence/discoverability/edit preservation and legacy repair/inactive catalog preservation); backend compiled. Testcontainers execution was interrupted because the Docker API (including docker ps) remained unresponsive; do not count these tests as passed.
- Alternative native PostgreSQL verification used the API-configured localhost:5433 connection. Pre-repair pg_dump backup verified nonempty85199 bytes and owner-only at /private/tmp/tutormatching-before-demo-repair-20261022.dump. Restored it into a uniquely named disposable database, ran seed-only twice and verified identical counts:10 visible tutors,23 subject links,11 total profiles. Removed that temporary database, then ran seed-only against the configured developer database with the same result. No migration or duplicate API listener was used.
- Live GET /api/v1/tutors returned totalCount10/items10; in-app browser /tutors visibly showed the restored filters and tutor cards. No mock fallback or public gate relaxation. Non-demo DRAFT profile remained unchanged.
- Performance/E2E/full discovery convergence remain Phase8; this browser check is a focused UI smoke, not whole-journey E2E.

## Phase 8 — Polish, cross-cutting verification and closure — 2026-10-23

Tasks T032–T035 complete; all Sprint 2 tasks T001–T035 are checked. Requirements checklist 16/16 verified. AI tutor recommendations remain deferred after MVP.

### T032: Performance benchmark (10k tutors, 50k availability slots)

- Corpus: Seeded 10,000 synthetic profiles (8,000 APPROVED + ACTIVE, 2,000 mixed DRAFT/PENDING_REVIEW/REJECTED/LOCKED) and 50,000 weekly slots (5 slots per tutor) in isolated Testcontainers PostgreSQL 17.6-alpine.
- Environment: .NET 10.0.10, macOS 15.6.1, Arm64 (8 logical processors), Kestrel loopback HTTP transport, `work_mem = 64MB`, rate limiter disabled in isolated test harness.
- Workload: 21 warmup requests per scenario; 100 concurrent workers executing 10 requests each (1,000 measured requests per scenario).
- Metrics:
  - `simple` (`/api/v1/tutors?page=1&pageSize=20`): 1,000 requests, 141.6 req/s, p95 **1,403.7ms** (SLA ≤ 3.0s: PASS), max 2,259.1ms, 0 errors.
  - `combined` (`/api/v1/tutors?page=1&pageSize=20&subjectId=02000000-0000-0000-0000-000000000001&levelCode=HIGH_SCHOOL&mode=ONLINE&minPrice=100000&maxPrice=200000&sort=priceAsc`): 1,000 requests, 109.9 req/s, p95 **1,501.9ms** (SLA ≤ 3.0s: PASS), max 2,465.9ms, 0 errors.
  - `capacity` (`/api/v1/tutors?page=1&pageSize=20&sessionsPerWeek=2&durationMinutes=60&weeklyWindows=[{"dayOfWeek":1,"startTime":"18:00","endTime":"21:00"}]`): 1,000 requests, 62.0 req/s, p95 **2,680.5ms** (SLA ≤ 3.0s: PASS), max 4,221.4ms, 0 errors.
  - Overall benchmark verdict: **PASSED (true)**.
- Query plan analysis:
  - Partial covering index `ix_availability_slots_search` on `(day_of_week, tutor_profile_id, start_time, end_time)` with predicate `WHERE is_active AND availability_type = 'WEEKLY'` enabled `Index Only Scan` without visiting heap blocks.
  - Materializing capacity `matchingIds` via single query execution avoids repeating PostgreSQL multirange aggregation (`range_agg` / `unnest`) between total count and pagination queries.
  - `work_mem = 64MB` eliminated disk spill batches (`Disk Usage: 0kB`, `Batches: 1`) during concurrent hash aggregations.

### T033: Multi-role E2E browser test (`frontend/tests/e2e/tutor-discovery.spec.ts`)

- Executed in Google Chrome via `BrowserFixture.cs` on standalone Kestrel port 5108 and Next.js port 3108 with isolated database fixture.
- Journey coverage:
  - Tutor onboarding draft submission (subjects, levels, online mode, session rate, bio, avatar).
  - Tutor schedule slots (`/tutor/availability`) and course creation (`/tutor/courses`).
  - Tutor profile submission -> PENDING_REVIEW; verified profile is invisible in public search.
  - Admin review cycle at `/admin/tutor-approvals`:
    - Action `REQUEST_CHANGES` (reason recorded) -> DRAFT; owner sees review note; tutor resubmits.
    - Action `REJECT` (reason recorded) -> REJECTED; owner sees review note; tutor resubmits.
    - Action `APPROVE` -> APPROVED; profile becomes discoverable in public search.
  - Public search at `/tutors`: filter by name, verified URL update, clicked result via keyboard navigation (Tab focus + Enter).
  - Public detail at `/tutors/{id}`: verified header, active course "Browser mathematics", verified zero private data fields exposed (email, phone, birth date, user ID, certifications, version).
  - Mobile responsiveness: 390x844 viewport checked for horizontal overflow (`scrollWidth <= innerWidth`); full-page screenshot captured to `discovery-mobile.png`.
  - Dynamic account lock: Playwright IPC file signal `/tmp/.../lock-account` observed by backend runner; account updated to `AccountStatus.LOCKED` in PostgreSQL; UI recheck confirmed "Hồ sơ gia sư không còn khả dụng", direct API returned 404, search count returned 0.
- Test outcome: **1 passed (11.4s)**.

### T034: OpenAPI contract parity and backward compatibility

- Verified OpenAPI 3.1 contract parity against `specs/002-tutor-discovery/contracts/openapi.json`.
- `DiscoveryContractTests.cs` and `OpenApiContractTests.cs` passed 4/4 with 0 discrepancies.
- Step-based draft autosave compatibility preserved for legacy tutor onboarding clients.

### T035: Quality convergence and quickstart validation

- Automated test suite results:
  - Backend: `dotnet test backend/TutorMatching.slnx` -> **217 passed, 0 failed** across Domain (9), Application (45), and Integration (163).
  - Frontend: `npm --prefix frontend run test` -> **211 passed, 0 failed** across 28 test files.
  - Frontend lint: `npm --prefix frontend run lint` -> **0 errors/warnings**.
  - Frontend production build: `npm --prefix frontend run build` -> **Compiled successfully in 3.1s, 26 routes generated**.
  - EF migration status: `dotnet ef migrations has-pending-model-changes` -> **0 pending changes**.
- Quickstart guide validated against implemented API and frontend routes.
