# Tasks: Hire Request Payment & Post-Lesson Tutor Reviews

**Input**: [spec.md](spec.md), [plan.md](plan.md), [data-model.md](data-model.md)  
**Created**: 2026-11-08  
**Status**: Completed

---

## Phase 1: Setup & Specification

- [x] T001 Create Spec Kit documentation under `specs/009-hire-payment-and-reviews/` (`spec.md`, `plan.md`, `data-model.md`, `tasks.md`) and sprint summary `docs/sprints/SPRINT-09-HIRE-PAYMENT-AND-REVIEWS.md`.

## Phase 2: Foundational Domain & Database Migration

- [x] T002 [P] Add unit tests in `backend/tests/TutorMatching.Domain.UnitTests/Hiring/HirePaymentAndReviewTests.cs` verifying:
  - Package billing calculation (`Course.SessionCount ?? SessionsPerWeek * 4`, `AmountVnd = AgreedPriceVnd * BillingSessions`).
  - `HireRequest.Complete()` throws `HireRuleException("payment_required")` when `PaymentStatusCode != "PAID"` (unless `IsLegacy == true`).
  - `HireReview` rating bounds (`1..5`), comment/reply validation (`<= 1000` chars), and single-reply invariant.
- [x] T003 Implement domain entities `backend/src/TutorMatching.Domain/Hiring/HirePayment.cs` and `backend/src/TutorMatching.Domain/Hiring/HireReview.cs`; extend `backend/src/TutorMatching.Domain/Hiring/HireRequest.cs` (`PaymentStatusCode`, `PaidAt`, payment gate in `Complete`) and `backend/src/TutorMatching.Domain/Tutors/TutorProfile.cs` (`AverageRating`, `ReviewCount`).
- [x] T004 Configure EF Core snake_case mappings in `backend/src/TutorMatching.Infrastructure/Persistence/Configurations/HirePaymentConfiguration.cs`, `HireReviewConfiguration.cs`, `HireRequestConfiguration.cs`, `TutorProfileConfiguration.cs`, and `ApplicationDbContext.cs`; generate migration `AddHirePaymentsAndReviews`.

## Phase 3: US1 — Package Tuition Payment via VietQR + Sandbox Confirmation (P1)

- [x] T005 [P] [US1] Add integration tests in `backend/tests/TutorMatching.Api.IntegrationTests/Hiring/HirePaymentEndpointTests.cs` covering idempotent payment creation, 1-month (`SessionsPerWeek * 4`) vs `Course.SessionCount` calculation, sandbox confirmation, `409 payment_required` when completing an unpaid request, and role/participant authorization.
- [x] T006 [US1] Implement `backend/src/TutorMatching.Application/Hiring/PayHireRequest.cs` (`CreateAsync`, `ConfirmAsync`) and extend `IHireRequestStore`, `HireRequestStore`, `IHireRequestQueries`, and `HireRequestQueries` to persist payments and expose `PaymentStatus`, `PaidAt`, `LatestPayment`, and `CanPay` in `HireDetail` / `HireSummary`.
- [x] T007 [US1] Expose `POST /api/v1/hire-requests/{id:guid}/payments`, `POST /api/v1/hire-requests/{id:guid}/payments/{paymentId:guid}/confirm`, and `GET /api/v1/hire-requests/{id:guid}/payments` in `backend/src/TutorMatching.Api/Controllers/HireRequestsController.cs`; register `PayHireRequest` in `Program.cs`.
- [x] T008 [US1] Extend `frontend/src/lib/api/hire-requests.ts` and `frontend/src/hooks/use-hire-requests.ts` with payment types and mutations; build `frontend/src/components/hiring/PaymentCheckoutDialog.tsx` (VietQR card + billing breakdown + Sandbox Confirm button) and wire into `frontend/src/components/hiring/HireRequestDetail.tsx`.
- [x] T009 [P] [US1] Add component tests in `frontend/tests/components/PaymentCheckoutDialog.test.tsx`.

## Phase 4: US2 — Post-Lesson Tutor Review, Tutor Reply & Public Ratings (P1)

- [x] T010 [P] [US2] Add integration tests in `backend/tests/TutorMatching.Api.IntegrationTests/Hiring/HireReviewEndpointTests.cs` covering review submission on `COMPLETED` requests, `409` on non-completed or duplicate reviews, tutor reply, atomic recalculation of `tutor_profiles.average_rating` & `review_count`, and anonymous pagination on `GET /api/v1/tutors/{id}/reviews` with zero PII leakage.
- [x] T011 [US2] Implement `backend/src/TutorMatching.Application/Hiring/ReviewHireRequest.cs` (`SubmitAsync`, `ReplyAsync`) and public review queries in `PublicTutorService.cs` / `HireRequestQueries.cs`.
- [x] T012 [US2] Expose `POST /api/v1/hire-requests/{id:guid}/review` and `POST /api/v1/hire-requests/{id:guid}/review/reply` on `HireRequestsController.cs`, and `GET /api/v1/tutors/{id:guid}/reviews` on `TutorsController.cs`.
- [x] T013 [US2] Build `frontend/src/components/hiring/LeaveReviewDialog.tsx` and `frontend/src/components/hiring/HireReviewCard.tsx`, integrate into `HireRequestDetail.tsx`, and surface `averageRating` / `reviewCount` + public review list on `TutorCard.tsx` and `/tutors/[id]`.
- [x] T014 [P] [US2] Add component tests in `frontend/tests/components/LeaveReviewDialog.test.tsx`.

## Phase 5: End-to-End Verification & Convergence

- [x] T015 Add Playwright E2E test `frontend/tests/e2e/hire-payment-and-review.spec.ts` verifying the complete learner-tutor flow: Accept → Pay via VietQR Sandbox → Complete Lesson → Submit 5-Star Review → Tutor Replies → Public Tutor Profile displays updated rating.
- [x] T016 Run full backend and frontend verification suites, record results in `specs/009-hire-payment-and-reviews/evidence.md`, and update project memory.
