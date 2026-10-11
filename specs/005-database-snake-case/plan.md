# Implementation Plan: Database snake_case

Date: 2026-10-10 | Spec: [spec.md](spec.md)

## Summary and Technical Context

.NET 10 / EF Core 10 / Npgsql / PostgreSQL. Apply a central naming convention to all EF
tables, columns, keys, indexes and constraints. Update SQL expressions and exception mapping.
Generate a rename migration; preserve historical migration files. Include legacy audit
columns and Identity sequences not represented in the current EF model.

## Constitution Check

Traceable to the explicit maintenance request and foundation account requirements.
Preserve data/security state (II), Infrastructure-only persistence (III), real PostgreSQL
upgrade/regression tests (IV), and no new product behavior (V). No exceptions.

## Design

Use a small deterministic snake_case converter at model construction; no new runtime package.
Configure a snake_case migrations history repository using the provider extension point.
Existing history must be renamed before EF discovers pending migrations, so provide an explicit
DatabaseMigrator command: normalize history in a transaction, then apply EF migrations.
Application startup does not mutate schema. Fail on conflicting histories.
Current/fresh/legacy database paths are tested. Identifier changes preserve data and API contracts.
Generated drop/recreate constraints should be replaced by PostgreSQL RENAME where possible.
Renaming identifiers does not change enum strings or C# member names.

## Project Structure

- Infrastructure/Persistence: convention, history repository, migration runner and migration.
- Infrastructure/Authentication: raw locking SQL and unique-constraint error mapping.
- backend/tools/TutorMatching.DatabaseMigrator: explicit upgrade command.
- API integration tests: catalog naming, populated upgrades and regression scenarios.
- docs/DatabaseSchema.md: snake_case database documentation.

## Delivery

Security follow-up: replace persisted booleans with nullable RevokedAt/ConsumedAt. A new forward
migration adds missing columns, preserves known timestamps, backfills true booleans with PostgreSQL
`-infinity` (unknown legacy event time, mapped by Npgsql to DateTimeOffset.MinValue), then drops
booleans. Do not fabricate event times. Runtime writes clock.UtcNow once per transition.
Check exactly one current Identity role matching the session during validation and refresh;
refresh revokes on mismatch. No new dependency, API contract or audit/index policy changes.

1. Model/history mapping and runtime SQL.
2. Additive rename migration and explicit history-compatible upgrade command.
3. Real database tests, docs, local upgrade and verification.

## Validation

Full backend suite; EF pending-model check; catalog scan for mixed-case identifiers;
compare records and constraints before/after upgrade; rerun upgrade; apply only to inspected local DB.
