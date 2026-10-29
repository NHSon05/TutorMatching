# Current Session Handoff

Updated: 2026-10-29
Status: Sprint 3 Phases 1–3 complete (T001–T019); Phase 4 / US2 next.

## Completed and evidence

- POST /api/v1/hire-requests: authenticated learner, UUID Idempotency-Key, strict JSON integers,
  current public tutor/subject/course eligibility, date/location/schedule validation under locks.
- Listed price creates PENDING; alternate price NEGOTIATING. Initial terms, schedules, event,
  conversation, recipient notification and durable original outcome commit in one transaction.
- Learner/key advisory lock precedes profile/account/catalog locks. Replay checks caller/fingerprint
  before current offering/date; returns original 201 after later state changes. Unique-PK loser
  fallback rolls back and reloads. Never change recorded snapshots/history/outcomes.
- Store rejects pending context changes but detaches unchanged reads loaded by cookie authentication.
- Hiring errors: 400 malformed/invalid terms or CSRF, 403 role, 409 stale price/availability/key.
- Real form on tutor detail/card: actual offerings, date/duration/location/weekly windows/price;
  server-confirmed success, stable retry key/payload, explicit refresh, no Sprint 4 messages dependency.
- Full backend 293/293 passed (20 Domain, 50 Application, 223 API); final focused foundation/create/
  security/contract 51/51, then final create/reliability/security 39/39 after availability mapping.
- Frontend full 226/226; TypeScript, changed-file ESLint and diff/whitespace checks pass.
- Isolated browser create/lost-response/retry passed: 4,614ms, 2 deliveries/1 key; all six business
  row counts exactly one. Synthetic automation timing is not a human study or load benchmark.
- Detailed commands/findings: specs/003-hire-negotiation/evidence.md (Phase 3).
- HireTutorDialog delegates its three queries to usePublicCatalog/usePublicTutorDetail hooks;
  cache keys, enabled conditions and refetch behavior preserved. Focused 11/11 tests, tsc and ESLint pass.
- Shared date/time helpers live in frontend/src/lib/date-time: Vietnam calendar date and immutable
  weekly schedule sorting. HireTutorDialog uses both; focused 11/11 tests, tsc and ESLint pass.
- HireForm now uses useHireRequestForm + hire-request-form.reducer (offer/values/submission).
  Subject/province changes reset dependents; API calls and retry refs stay in the hook.
- Fixed both review findings: detail errors preserve an open form/key; explicit refresh removes
  invalid selected slots with notice, preserving valid slots/notes. Failed refresh preserves snapshot.
- Latest refactor verification: 22/22 focused frontend tests, tsc, changed-file ESLint pass.
- Docker was restarted with explicit user approval after daemon stalled. Testcontainers cleaned up.
  Existing frontend dev server at :3000 reused; browser API routed only to fixture :5108.

## Next executable step

- Implement Phase 4 / US2 T020–T027 only when requested: review/respond, participant-scoped queries,
  initial acceptance/rejection and their UI/tests. Negotiation/track/close follow in later phases.
- Existing HireRequestsController authorizes LEARNER at class level; scope that policy to create
  when adding participant/tutor endpoints. Derive actor from ICurrentUser, never request bodies.
- ExecuteAsync callback stages only DB work; no external effects. Project response after commit
  to obtain rotated Version. Legacy null actor/listed price remains supported.
- Local PostgreSQL at configured localhost:5433 upgraded on 2026-10-29 via DatabaseMigrator.
  Verified HireNegotiationFoundation history and hire_create_operations; zero hire requests before/after.
  Other deployment databases still require their own preflight and legacy acceptance review.
- No commit created. User changes and earlier phase documents remain in working tree.
