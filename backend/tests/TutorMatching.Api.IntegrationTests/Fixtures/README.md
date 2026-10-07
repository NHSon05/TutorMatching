# PostgreSQL API fixtures (T015)

Start Docker Desktop, then run from the repository root:

```sh
dotnet test backend/tests/TutorMatching.Api.IntegrationTests/TutorMatching.Api.IntegrationTests.csproj
```

The `PostgreSQL API` xUnit collection starts its own `postgres:17.6-alpine` container
with an automatically assigned host port. Each `CreateFactoryAsync()` creates a unique
database in that container, starts the real API in `Testing`, and applies EF migrations.
Dispose each factory with `await using`; collection teardown removes the temporary container
and its databases. No migration/reset is run against Supabase or the development database.
The first run may download container images. An unavailable Docker daemon fails the tests;
these tests are not silently skipped.

`ApiWebApplicationFactory` overrides database configuration and EF registrations, disables
development seeding by environment, uses ephemeral data-protection keys, and replaces SMTP
with a factory-local `CapturedEmailSender`. Sending is synchronous-in-memory (no sleeps or
external email server); cancellation is respected and concurrent capture is safe. Avoid
logging captured recipients/bodies/tokens; `CapturedEmail.ToString()` is redacted.

Use a new factory per test for database, email, cookie-key and rate-limit isolation.
The collection disables parallel execution because startup currently loads `.env` into
process environment variables. Test overrides always take precedence for database and SMTP.

Evidence: `PostgreSqlFixtureTests` checks real API startup, migrations, roles, audit persistence,
invalid audit rejection, database/email isolation, cancellation and capture reset.
