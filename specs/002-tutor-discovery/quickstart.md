# Sprint 2 validation guide

These are implementation acceptance steps, not executed results. Prerequisites: .NET 10, Docker, project Node environment, configured backend/frontend environment files, disposable PostgreSQL and Mailpit. Never use personal production data.

## Setup

From repository root, start services using the existing PROJECT.md instructions:

```sh
docker compose --env-file backend/.env -f backend/compose.yaml up -d --wait
dotnet run --project backend/tools/TutorMatching.DatabaseMigrator
dotnet run --project backend/src/TutorMatching.Api
npm --prefix frontend run dev
```

Run API and frontend in separate terminals. Migration runs after stopping any old API. Verify the API-configured database connection explicitly; Compose can target a different local instance. Phases6–7 add no migration. Seed fixtures must provide admin, learner, two tutors, all profile states, active/inactive accounts, active/inactive subjects, mapped/unmapped legacy data, schedules and courses; fixture creation is T004/T026, not an existing command.

## Independent acceptance

| Story      | Scenario                                                                                                  | Required evidence                                                                               |
| ---------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Foundation | anonymous status=all/pending and direct unapproved ID, inactive account, catalog role denial              | API tests prove no leakage; no private fields in public DTO                                     |
| US1        | owner drafts incomplete profile, completes subjects/levels/modes/rate, submits; other tutor denied        | draft roundtrip, field errors, pending non-public, legacy data retained                         |
| US2        | adjacent/overlapping/reversed slots; concurrent writes; invalid course count/rate; hide referenced course | valid data retained, no race overlap, soft deletion retains references                          |
| US3        | approve, request changes, reject; two admins race; edit approved core                                     | one winning decision, 409 loser, note required, atomic audit + notification; owner sees history |
| US4        | each filter then combinations, subject-level same association, repeated windows, capacity boundaries      | all returned tutors match; invalid inputs fail; count/page/empty stable on unchanged data       |
| US5        | open approved detail then lock account/change core                                                        | unavailable response and UI; public fields only; active courses and active subjects only        |

Example capacity fixture: Monday 18:00–20:00 with duration 60 supports two sessions; requesting three excludes tutor. Duplicate desired windows must not increase capacity.

## Automated checks

```sh
dotnet test backend/TutorMatching.slnx
npm --prefix frontend run test
npm --prefix frontend run lint
npm --prefix frontend run build
npm --prefix frontend run test:e2e
```

Prefer targeted test projects/files during implementation; run the complete checks before handoff. Docker is required for integration fixtures. Compare implemented OpenAPI against contracts/openapi.json; validate existing onboarding compatibility as well as new routes.

## Performance and report

Create 10,000 synthetic tutor profiles with mixed status/subjects and realistic schedule distribution. Exercise first-page simple/combined queries with 100 concurrent users after warm-up; record hardware, seed version, duration, throughput, error count and p95. Pass: p95 ≤3 seconds for first-page core searches. Inspect query plans: filtering/count/paging before materialization. AI is excluded.

Store actual command outcomes, migration counts, scenario results and performance report in an evidence file linked from tasks.md when implementation is performed. A pending test is never a pass.


## Implemented search/detail smoke checks

Restart the existing backend process to load the current build (do not launch a second listener on5014). Public fixtures need an APPROVED profile, ACTIVE TUTOR account, positive sessionRateVnd and a linked active subject. Search/Detail tests create disposable examples; the UI no longer injects mock profiles into an empty developer database.

```sh
curl 'http://localhost:5014/api/v1/tutors?page=1&pageSize=20&sort=priceAsc'
curl 'http://localhost:5014/api/v1/tutors?name=nguyen&subjectId=02000000-0000-0000-0000-000000000001&levelCode=HIGH_SCHOOL'
curl --get 'http://localhost:5014/api/v1/tutors' --data-urlencode 'sessionsPerWeek=2' --data-urlencode 'durationMinutes=60' --data-urlencode 'weeklyWindows=[{"dayOfWeek":1,"startTime":"18:00","endTime":"20:00"}]'
```

Open /tutors, apply a filter, change page/sort, clear filters and open a returned profileId link. Detail shows active subjects/levels, valid weekly availability and active courses. Lock the fixture account and refresh detail: it must become unavailable and remove stale profile content. Public detail accepts profileId only; prior userId URLs are intentionally404. Browser E2E/performance evidence is still pending Phase8; executed unit/integration/component outcomes live in evidence.md.
