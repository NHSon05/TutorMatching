# Feature Specification: Database snake_case

Created: 2026-10-10
Status: Ready for implementation
Input: Refactor the entire database to snake_case; no camel/Pascal-case identifiers.

## User Scenarios & Testing

### US1 — Consistent database names (P1)

As a maintainer, I can query all application tables and columns using lowercase snake_case.
Independent test: inspect a newly provisioned database and exercise account/session workflows.

1. All table, column, constraint, index and sequence names use lowercase snake_case,
   including Identity, migration history and retained legacy token columns.
2. Registration, duplicate validation, login, refresh, logout and audit persistence still work.

### US2 — Preserve existing databases (P1)

As an operator, I can upgrade the existing database without losing records or migration history.
Independent test: upgrade populated PascalCase and historical timestamp schemas, compare data
and migration records, verify constraints, and rerun the upgrade without changes.

### Edge Cases

- Conflicting old/new names stop the upgrade rather than overwrite either object.
- Historical migrations retain their original identifiers for replay; final schema is snake_case.
- Authentication state, hashes, timestamps, roles and identifiers must be preserved.

## Requirements

- FR-001: All physical database identifiers owned by this application MUST use snake_case.
- FR-002: Migration MUST preserve rows, keys, relationships, defaults and security state.
- FR-003: Upgrade MUST support fresh, current and legacy timestamp databases and be repeatable.
- FR-004: Existing API contracts MUST remain unchanged; behavior changes are limited to the
  approved role-validation security follow-up below.
- FR-005: Automated tests MUST verify identifiers, existing-data preservation and account behavior.

### Approved security follow-up (2026-10-11)

- FR-006: Persist session revocation and refresh-token consumption using nullable timestamps only;
  retain known historical times and preserve revoked/consumed state when the time is unknown.
- FR-007: Validate current role membership on access validation and refresh. A missing or changed
  role must deny access; refresh must revoke the mismatched session without issuing a token.
- FR-008: Preserve refresh/reuse/logout serialization and API contracts. Index expansion and audit
  retention/permissions are outside this follow-up.

Independent tests: fresh/boolean/legacy timestamp migrations, role removal/replacement without
security-stamp changes, unchanged-role success, and existing concurrent refresh/logout tests.

## Success Criteria

- SC-001: Zero uppercase identifiers in application tables, columns, indexes, constraints and sequences.
- SC-002: No records or relationships lost during upgrade; no credential reactivated.
- SC-003: All backend regression tests pass after migration.

## Assumptions and Traceability

Scope is physical database names, not C# members, JSON fields or stored enum values.
System schemas/extensions and external databases are excluded. Local database is in scope;
remote environments receive a tested upgrade command. Supports foundation FR-001–FR-019 and
Constitution II–IV. The approved follow-up strengthens existing authentication requirements;
it does not add a new product feature.
