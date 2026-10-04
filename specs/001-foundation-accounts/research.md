# Research: Foundation and Accounts

## Canonical account roles

**Decision**: Persist `ADMIN`, `LEARNER`, and `TUTOR`. Treat `LEANER` in the SRS as a spelling defect;
parents and students share the `LEARNER` role in the MVP.

**Rationale**: `LEARNER` matches the defined term and avoids encoding a typo in claims, migrations,
tests, and later APIs.

**Alternatives considered**: Preserve `LEANER` for literal SRS compatibility; split `PARENT` and
`STUDENT`. Both were rejected because the SRS defines one shared learner role for this version.

## Authentication and session model

**Decision**: Use ASP.NET Core Identity with an HTTP-only secure cookie and server-side security
stamp/session revocation. Use `SameSite=Lax` by default, HTTPS-only cookies outside local development,
anti-forgery protection for state-changing requests, and credentialed CORS restricted to the known
frontend origin.

**Rationale**: The product is a browser-only web MVP. A framework-maintained cookie flow avoids
exposing bearer tokens to browser JavaScript and provides password hashing, lockout, roles, security
stamps, and reset-token support.

**Alternatives considered**: JWT access/refresh tokens add rotation and storage complexity; custom
opaque session tokens duplicate framework security behavior. Both can be reconsidered if native
mobile or third-party clients enter scope.

## Lockout and session defaults

**Decision**: Lock sign-in for 15 minutes after five failed attempts; session idle expiry is 30
minutes with an eight-hour absolute limit; logout revokes the current session; password reset
revokes existing sessions through the security stamp.

**Rationale**: These are conservative MVP defaults that are testable and configurable without
permanent account lockout.

**Alternatives considered**: Permanent lock requires Admin intervention; unlimited attempts violate
the SRS; long-lived sessions increase exposure.

## Database and persistence

**Decision**: Use PostgreSQL with EF Core 10 and Npgsql. Identity tables are the source for account,
role, login, token, and claim state; add a private profile table and audit-event table where Identity
does not model project data.

**Rationale**: PostgreSQL is a supported relational database, works well with containerized local
development, and preserves production-like constraints in integration tests.

**Alternatives considered**: SQLite is convenient but differs in concurrency and relational
behavior; SQL Server/MySQL are valid but offer no project-specific advantage.

## Email delivery

**Decision**: Define an application email port. Use an SMTP sandbox adapter for development/demo and
an in-memory capture adapter for integration tests. Do not log reset links or raw tokens.

**Rationale**: The SRS permits SMTP sandbox use and the abstraction makes reset behavior testable
without sending real messages.

**Alternatives considered**: Logging reset links violates the no-token-in-log rule; requiring a
production email provider is outside the PBL3 MVP.

## Testing strategy

**Decision**: Use xUnit for domain/application tests and `WebApplicationFactory` with PostgreSQL for
API integration tests. Use frontend component tests for validation/state behavior and Playwright for
the five independent acceptance journeys.

**Rationale**: Authentication, database uniqueness, cookie behavior, and authorization require
integration coverage; UI and end-to-end checks provide acceptance evidence.

**Alternatives considered**: Unit-only tests cannot validate HTTP security or database constraints;
manual-only testing is not repeatable evidence.

## API and errors

**Decision**: Expose versioned `/api/v1` JSON endpoints documented by OpenAPI. Use Problem Details
for errors, neutral forgot-password responses, `401` for unauthenticated access, `403` for denied
access, `409` for uniqueness conflicts, and `422` for validation failures.

**Rationale**: The status set matches the SRS and creates stable frontend contracts.

**Alternatives considered**: Ad hoc error shapes and unversioned routes make frontend behavior and
contract testing unstable.
