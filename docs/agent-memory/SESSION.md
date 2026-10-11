# Current Session Handoff

Status: CODE COMPLETE — TOKEN SECURITY MIGRATION AWAITS DEPLOYMENT
Updated: 2026-10-11

## Completed scope

- Approved follow-up: timestamp-only token state and current-role validation, not index/audit policy.
- TokenSession.RevokedAt / SessionRefreshToken.ConsumedAt replace persisted booleans.
- New forward migration 20261011113055_UseTokenStateTimestamps preserves known times and
  maps true booleans without a time to PostgreSQL -infinity (unknown time, not migration time).
- Access validation and refresh require exactly one current role matching the session;
  refresh revokes on mismatch even when security stamp has not changed.
- Refresh/logout row locks retained; repeated logout preserves first revocation timestamp.
- Prior snake_case/JWT/frontend changes remain uncommitted. Scope: specs/005-database-snake-case.

## Verification

- Targeted session/schema/migration suite: 19 passed.
- Full backend: 74 API integration + 16 Application + 2 Domain = 92 passed.
- EF reports no pending model changes; git diff --check clean.
- Tests cover role removal/replacement with unchanged stamp, event timestamps, repeated logout,
  legacy/current/fresh schemas, inconsistent legacy state and concurrent refresh/logout.
- Frontend unchanged this turn; prior verification: 83 tests, TypeScript/scoped lint.

## Deployment / next executable step

- New timestamp migration NOT applied to existing local or remote databases this turn.
- Local DB was previously upgraded through UseSnakeCaseDatabaseNames only.
- Stop old API, run `dotnet run --project backend/tools/TutorMatching.DatabaseMigrator`
  against the intended environment, then start updated API. Old binaries require removed booleans.
- Do not reset DB/history or disable Npgsql infinity conversion; forward fixes only.
- Remote runs require --allow-remote. Index/audit retention/permissions remain out of scope.
- Existing account browser E2E tasks T031/T037/T058 and profile/password-reset work remain pending.
