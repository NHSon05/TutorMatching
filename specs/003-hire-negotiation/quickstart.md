# Sprint 3 Validation Guide

Status: planned acceptance checks; hiring endpoints/tests are not implemented yet.
Contract: [OpenAPI](contracts/openapi.json). Rules: [data model](data-model.md).

## Prerequisites and commands

Use local .NET 10, Node/npm and Docker with PostgreSQL test containers available. Configure the
existing backend/frontend environment files without committing credentials. Use synthetic accounts:
learner A, learner B, approved active tutor T, unrelated tutor U, and an admin. Give T an active
subject/course and explicit availability covering the requested windows. Keep fixtures isolated.

```sh
docker compose --env-file backend/.env -f backend/compose.yaml up -d --wait
dotnet build backend/TutorMatching.slnx
dotnet test backend/tests/TutorMatching.Domain.UnitTests
dotnet test backend/tests/TutorMatching.Application.UnitTests
dotnet test backend/tests/TutorMatching.Api.IntegrationTests
npm --prefix frontend run test
npm --prefix frontend run lint
npm --prefix frontend run build
npm --prefix frontend run test:e2e
```

Stop old API processes before applying reviewed migrations to a disposable configured database:
`dotnet run --project backend/tools/TutorMatching.DatabaseMigrator`.
Start API with `dotnet run --project backend/src/TutorMatching.Api` and frontend with
`npm --prefix frontend run dev`. Follow existing auth/CSRF client flow; never paste real cookies
into evidence. New hiring test names and a runnable load-test command must be supplied by tasks
and implementation before claiming these scenarios pass.

## Independent story checkpoints

| Story | Procedure | Required result |
| --- | --- | --- |
| US1 / FR-001–007 | Submit from tutor detail at listed and alternate prices; replay identical key concurrently; reuse key with changed payload. | PENDING/NEGOTIATING respectively; one request/conversation/initial event/notification; original result on replay; changed payload 409. |
| US2 / FR-008,011,012 | Tutor lists/details initial offers, accepts one, rejects another with reason. Try learner B/tutor U direct reads and writes. | Exact agreement snapshot; correct history and notification; unrelated actors denied without existence disclosure. |
| US3 / FR-013–016 | Exchange offers; attempt sender acceptance, obsolete acceptance and concurrent acceptance/counter. | Only recipient accepts latest; one concurrent action succeeds, stale loser 409; immutable ordered offers. |
| US4 / FR-009,010 | Filter/paginate both participant lists while inserting new records; inspect details after profile/course edits. | Stable cursor ordering without insertion duplicates; no private identity fields; historical agreement unchanged. |
| US5 / FR-017–019 | Learner cancels open requests; both actors cancel accepted requests with reason, or complete with confirmation. | Correct actor/time/reason, one notification; terminal and stale actions rejected. |

## Cross-cutting failure and boundary suite

- No auth, wrong role, self-hire, locked account, hidden/unapproved tutor, inactive subject/course.
- Frequency 0/1/21/22, duration 29/30/240/241, zero/negative/overflow/noninteger price.
- Today/past/future local date, invalid weekdays, reversed/overlapping windows, insufficient capacity,
  full-window availability coverage, and availability edit racing create/proposal/accept.
- Invalid or missing offline/hybrid province/district; mismatched province and district.
- Force notification insertion failure: request/action, event, conversation and idempotency writes
  all roll back. Retry after transient failure and after lost success response.
- Race two matching creates and two versioned actions using separate database connections.
- Migration rehearsal against empty and legacy fixtures; preserve rows and stop on unrecoverable
  agreements; verify unique constraints, snake_case names and query indexes.
- UI preserves input on validation/network/conflict errors, prevents blind stale retries, shows
  loading/success, text status labels and explicit confirmation. No success UI before server success.
- SC-001: timed synthetic learner creates within three minutes. SC-006: seed representative data,
  run 100 concurrent users across list/detail/actions, record p95 latency and error rate; do not
  count only successful requests or silently ignore contention. Target p95 <= 3 seconds.

Store commands, outcomes and relevant diffs in feature evidence during implementation; none of
these acceptance checks is reported as passed by this planning change.
