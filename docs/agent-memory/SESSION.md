# Current Session Handoff

Status: IDLE
Updated: 2026-10-07

## Last completed work

- Completed T011: API cookie/session validation, authorization, CSRF, CORS and rate limiting in `backend/src/TutorMatching.Api/Security/`; Identity lockout configured in Infrastructure.
- Added anonymous `GET /api/v1/auth/csrf`; unsafe API requests need its token/cookie pair. OpenAPI documents CSRF and 429 responses; corrected the misplaced Problem schema so internal refs resolve.
- Verification: 16 security tests + 6 dotenv tests pass with fake Identity store/TestServer; 2 Domain tests pass. Application test project has no cases yet. Builds report no warnings/errors; YAML parses and all 44 refs resolve; diff check passes.
- No real database access/migration or login/logout endpoints were introduced. See Security/README.md for frontend flow, deployment constraints and scope boundaries.

## Next work

- Idle. Next Sprint 1 task is T012 when requested. T028 must enable Identity lockout counting and implement server-side logout revocation; T015 adds PostgreSQL-backed fixtures.
- Spec Kit defaults to another feature; use `SPECIFY_FEATURE_DIRECTORY=specs/001-foundation-accounts SPECIFY_FEATURE_NO_PERSIST=1` for Sprint 1 checks.
