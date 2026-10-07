# Versioned OpenAPI (T017)

`AddVersionedOpenApi()` registers document `v1` using OpenAPI 3.1 and product version `1.0.0`.
`/openapi/v1.json` is available only in Development and Testing. The document includes
implemented routes under `/api/v1/`; the WeatherForecast template is excluded, not deleted.
Document naming does not rewrite HTTP routes: new endpoints must explicitly use `/api/v1/`.

The document describes cookie and CSRF security schemes, a typed CSRF response, Problem
Details (including the runtime traceId extension) and Retry-After on documented 429 responses.
Cookie names follow configuration. Public operations override default cookie security;
unsafe operations require the CSRF cookie/header pair in the generated document.

`OpenApiContractTests` reads the checked-in `specs/001-foundation-accounts/contracts/openapi.yaml`
and compares it with the document fetched from the real API host. It normalizes server/path
prefixes, then checks operation IDs, response codes, media types, declared schema constraints,
required fields, headers and security schemes. Unexpected generated operations fail the test.

Only `GET /api/v1/auth/csrf` is implemented at this foundation checkpoint. Seven planned
account operations are explicitly listed as pending in the test; no fake endpoints are added.
When implementing a story, remove its operation from `PendingOperations` so removal/missing
implementation becomes a failure. Extend schema comparisons for new constructs (e.g. allOf)
as those contracts become executable. T052 verifies the full completed feature surface.

Run: `dotnet test backend/tests/TutorMatching.Api.IntegrationTests/TutorMatching.Api.IntegrationTests.csproj --filter FullyQualifiedName~OpenApiContractTests`
Docker is required because this uses the PostgreSQL-backed API fixture.
