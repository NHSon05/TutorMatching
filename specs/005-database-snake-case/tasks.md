# Tasks: Database snake_case

## Approved security follow-up (2026-10-11)

- [x] T008 Add regression tests for role removal/replacement, timestamp transitions and preservation across fresh/current/legacy migrations.
- [x] T009 Replace token-state booleans with timestamps, add forward migration, validate current roles on access/refresh.
- [x] T010 Run targeted/full backend checks, inspect migration/model diff, document unknown historical timestamps and deployment, update memory.

Dependencies: T008 → T009 → T010. No index/audit policy changes in this follow-up.

Follow-up evidence (2026-10-11): 19 targeted tests and 92 full backend tests passed (74 API,
16 Application, 2 Domain); EF has no pending model changes. Known legacy timestamps, unknown
boolean-only times, inconsistent old representations and role removal/replacement are covered.
Migration tested on disposable PostgreSQL only; existing local/remote DB deployment remains an
operator step requiring old API shutdown. No index/audit permissions/retention changes.

## Phase 1: Setup

- [x] T001 Record scope/design in specs/005-database-snake-case/spec.md and plan.md.

## Phase 2: US1 — Consistent names

- [x] T002 [US1] Add model and history naming conventions in backend/src/TutorMatching.Infrastructure/Persistence; update configurations, raw SQL and constraint-name mapping.
- [x] T003 [US1] Generate and inspect a rename-only migration in backend/src/TutorMatching.Infrastructure/Persistence/Migrations; cover retained legacy columns and sequences.
- [x] T004 [US1] Test physical identifiers and account behavior in backend/tests/TutorMatching.Api.IntegrationTests/Fixtures/SnakeCaseSchemaTests.cs.

## Phase 3: US2 — Preserve existing databases

- [x] T005 [US2] Add explicit history-compatible runner in backend/tools/TutorMatching.DatabaseMigrator and Infrastructure/Persistence/DatabaseMigrationRunner.cs.
- [x] T006 [US2] Test populated PascalCase/history upgrades and adapt legacy token tests in backend/tests/TutorMatching.Api.IntegrationTests.

## Phase 4: Verification and handoff

- [x] T007 Update docs/DatabaseSchema.md and run full backend tests, model/diff checks and local catalog/data-preservation verification; update docs/agent-memory.

Dependencies: T001 → T002 → T003 → T004; T005 supports T003/T006; T007 follows all checks.
Work one phase at a time; same-file dependencies are sequential. No agent delegation required.
Independent checkpoints: fresh schema/account tests for US1; populated upgrade and rerun for US2.

Evidence (2026-10-11): 69 API integration + 16 Application + 2 Domain tests pass; migrator build clean; no pending EF model changes; local catalog contains zero uppercase identifiers. All 11 table OIDs and application row counts preserved; history increases by one migration row. Upgrade/collision/legacy/naming tests cover FR-001–FR-005. No remote database was modified.
