# Sprint4 implementation validation guide

Design baseline: 2026-11-01. New endpoints/UI are not implemented by this planning change.
Use synthetic accounts only. Never point fixture/backup-rehearsal tools at a user database.

## Prerequisites and existing commands

Use existing .NET10, frontend Node/package runtime and Docker PostgreSQL Testcontainers.
Read `docs/agent-memory/PROJECT.md` Commands for environment/configuration and DatabaseMigrator
rules; never copy actual secrets into this document. Keep running dev build and isolated production
build output separate when `ISOLATED_E2E=1` is configured.

```sh
SPECIFY_FEATURE_DIRECTORY="$PWD/specs/004-messaging-admin-release" SPECIFY_FEATURE_NO_PERSIST=1 .specify/scripts/bash/check-prerequisites.sh --json
# Existing baseline commands; not proof of new feature support:
dotnet build backend/TutorMatching.slnx
dotnet test backend/TutorMatching.slnx
npm --prefix frontend test
(cd frontend && npx tsc --noEmit)
npm --prefix frontend run lint
(cd frontend && ISOLATED_E2E=1 npm run build)
```

Generate tasks next, then analyze. Record baseline failures separately from regressions in a new
feature evidence.md. Finalize OpenAPI schemas before endpoint implementation. Planned focused
test classes/E2E files must be created by tasks; do not claim a filter with zero matching tests passes.

## Independent journeys

1. US1: seed two participants, second request, outsider learner/tutor/admin and locked account.
   Open from hire detail, send from each side, retry lost response with same ID, conflict on changed
   payload, page tied-time history, add messages between pages, mark only rendered incoming IDs.
   Disconnect around commit, reconnect with a multi-page gap, verify duplicate/out-of-order events,
   receipt refresh, expired/locked-session disconnect and unauthorized channel denial.
   Inject notification insert failure, restart dispatcher, verify retained message and exactly one
   notification after recovery. Verify inaccessible conversations return404 and no private logs.
2. US2: generate each actual review/hiring/message event; check owned list/count, receipt retries,
   read-all racing new arrival, unavailable reference, server authorization on open. Switch accounts
   with in-flight queries; no old data/count/draft reappears. Verify SignalR handlers/connections are removed on logout/account switch.
3. US3: seeded admin searches/details, locks target with confirmation/version, old session fails,
   approved tutor disappears from discovery; unlock does not revive old session. Self-lock, nonadmin,
   stale-version and concurrent-admin cases deny safely; audit and histories remain correct.
4. US4: draft/edit/publish/hide article, direct public hidden-slug404, escaped markup; deactivate
   referenced catalog value, stale admin editor and normalized duplicate races; monitor request
   without chat access or participant writes. Show genuine empty/loading/error UI.
5. US5: seed all canonical roles/statuses + zero groups; compare exact dashboard source counts,
   simultaneous updates, filter/page audit, assert redaction of all secret/private fields.
6. US6: complete Sprint3 T046–T050; run registration -> approval -> discovery -> hire -> negotiate
   -> chat -> completion/cancellation and notification/admin flows from documented clean setup.
   Run Chromium/Firefox/WebKit with mobile/desktop viewport and keyboard; record exact tested
   versions and resolve SRS browser matrix before claiming compatibility. Run100 concurrent
   synthetic users including100 SignalR connections and reconnect bursts; p95 ordinary pages<=3s, bounded notification backlog.

## Recovery and release evidence

Create a disposable populated database with known counts, message/read states and pending outbox.
Use pg_dump/pg_restore matching deployed PostgreSQL version, restore to a separate empty database,
apply documented migration/startup procedure, compare fixture IDs/counts/snapshots and replay pending
notification once. Never drop/overwrite source database. Evidence excludes private payloads/secrets.

Handover must include sanitized configuration names, sample-data commands, deployment/restart
order, health probes, worker/backlog diagnosis, migration rollback limits, backup scope/recovery
steps and complete demo script. A second operator follows only these docs. Link each AC-01–10
and FR/SC to a passing check or explicit blocker. Run speckit-converge only after implementation;
no critical unresolved defect or unchecked prerequisite can be represented as a finished release.
