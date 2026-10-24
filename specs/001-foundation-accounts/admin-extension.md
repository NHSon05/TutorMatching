# Sprint 1 extension: admin users and tutor decisions

Requested 2026-10-20. Implements early slices of SRS FR-06/FR-14 and UC-06/UC-14; does not mark the complete Sprint 2 review story done.

## Acceptance

- Only authenticated ACTIVE ADMIN can list users or approve/reject a tutor.
- GET /api/v1/users and alias GET /api/v1/admin/users return all account types through pages (default 20, maximum 100), ordered by creation time then UUID; no password/token/security-stamp fields.
- Response: items [{id,fullName,email,role,status,tutorProfileId,tutorProfileStatus}], totalCount,page,pageSize. Email is admin-only. Cache-Control: no-store.
- POST /api/v1/admin/tutors/{id}/approve and /reject use TutorProfile ID. JSON body {"expectedVersion":"current-profile-uuid","note":"..."}; reject requires a nonblank note, maximum 4000 characters. Approve permits an omitted/null note. Since Sprint 2 US3, both routes require the version returned by GET /api/v1/admin/tutor-reviews/{id}; stale versions return 409 and omitted versions return 422.
- Only PENDING_REVIEW profiles of ACTIVE TUTOR accounts can be processed. Other states return 409; absent profile returns 404. Invalid body/page/range returns project-standard 422; anonymous 401, non-admin 403; existing CSRF required for mutations.
- Approval sets APPROVED and approvedAt; rejection sets REJECTED and clears approvedAt. History, audit and persistent notification are atomic with the decision. A repeated decision returns 409 without duplicate writes.

## Implementation plan

Application IAdminService defines DTOs/operations; Infrastructure AdminService queries EF and locks the profile row while processing a decision; Api AdminController provides HTTP and role boundary. Sprint 2 US3 adds action/reviewedVersion with TutorReviewDecisions migration and shares ITutorReviewService for all decision routes. Uses existing cookie auth/CSRF, clock and dependency injection.

## Work and verification

- [x] Implement Application port, EF adapter and admin endpoints.
- [x] Verify admin/anonymous/other-role access, paging, note validation, state transitions, repeat decision and atomic history/audit/notification in AdminEndpointTests.

Independent scenario: provision ADMIN and pending TUTOR fixture → list accounts → approve/reject → verify DB and repeat conflict. Test evidence is finalized after the targeted run.

## Limits

This extension does not provide admin UI, request-changes, full pending-profile review detail or optimistic profile version tokens. Sprint 2 contracts remain planned future interfaces and must be reconciled with these implemented routes when that story is executed. Existing public tutor eligibility defects from Sprint 2 Phase 1 are still outstanding and unaffected.

Evidence (2026-10-20): `dotnet test backend/tests/TutorMatching.Api.IntegrationTests --no-restore --filter FullyQualifiedName~AdminEndpointTests` passed 4/4 cases on disposable PostgreSQL 17.6. Compilation and scoped diff whitespace checks passed. Tests cover both roles denied, anonymous list denied, both decision outcomes, paging, invalid page size, missing rejection note, repeated decisions, and DB history/audit/notification counts. Concurrent-request stress and full solution suite were not run.

2026-10-21: aggregate OpenAPI coverage now includes the checked-in admin-catalog-implemented.openapi.json delta; all 156 backend checks pass. The earlier aggregate-contract limitation is resolved.
