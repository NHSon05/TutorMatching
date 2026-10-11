# Upgrade and verify

1. Configure backend/.env or process environment for the intended database; stop old API workers.
2. Run `dotnet run --project backend/tools/TutorMatching.DatabaseMigrator` from the repo root.
   This normalizes old migration history before applying pending migrations. Use it for first upgrade;
   plain `dotnet ef database update` alone cannot discover the renamed legacy history.
3. Start the updated API. JSON fields and stored enum values remain unchanged.
4. Run `dotnet test backend/TutorMatching.slnx` with Docker available.
5. Verify zero mixed-case identifiers in application tables/columns/constraints/indexes/sequences.

Do not reset the database or delete migration history. Remote deployment is an operator step.

The follow-up migration `20261011113055_UseTokenStateTimestamps` removes token state booleans.
Stop old API workers before running the upgrade and start only the updated binary afterward.
Known event times are retained. Unknown legacy revoked/consumed times use `-infinity`, which
must be presented as unknown rather than an actual date. The migration does not reactivate tokens.

The rename/adoption migrations intentionally reject automatic downgrade: custom historical
identifiers cannot be reconstructed reliably. Use a reviewed forward migration for corrections.
Historical migration files/designer models retain PascalCase for replay; only the latest schema
and model snapshot represent the required snake_case database.

Verified 2026-10-11: 69 API integration + 16 Application + 2 Domain tests passed; no pending model
changes; the local database has zero uppercase identifiers and unchanged application-table row
counts/OIDs. History has exactly one new rename migration record. Remote DBs were not changed.
