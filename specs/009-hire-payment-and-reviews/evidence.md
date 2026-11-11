# Verification Evidence: Sprint 9 (`009-hire-payment-and-reviews`)

**Date**: 2026-11-08

## 1. Domain Unit Tests (`T002`, `T003`)

- **Command**: `dotnet test backend/tests/TutorMatching.Domain.UnitTests/TutorMatching.Domain.UnitTests.csproj`
- **Result**: `134/134 passed` (including `10/10` in `HirePaymentAndReviewTests.cs`)
- **Coverage**:
  - Package billing calculation (`Course.SessionCount ?? SessionsPerWeek * 4`, `AmountVnd = AgreedPriceVnd * BillingSessions`).
  - `HireRequest.Complete()` throws `HireRuleException("payment_required")` when `PaymentStatusCode != "PAID"` unless `IsLegacy == true`.
  - `HireReview.Create()` rating bounds (`1..5`), comment length (`<= 1000` chars), and single-reply invariant (`HireReview.Reply()`).
  - `TutorProfile.UpdateRatingAggregate()` rounding and count recalculation.

## 2. Persistence & EF Core Migration (`T004`)

- **Migration**: `20261108111706_AddHirePaymentsAndReviews`
- **Local Dev DB Migration Command**: `dotnet run --project backend/tools/TutorMatching.DatabaseMigrator` → `Migration complete. History and application schema are up to date.`
- **Migration Integration Tests**: `dotnet test backend/tests/TutorMatching.Api.IntegrationTests/TutorMatching.Api.IntegrationTests.csproj --filter "FullyQualifiedName~HiringMigrationTests"` → `3/3 passed`

## 3. API Integration & OpenAPI Contract Tests (`T005`, `T006`, `T007`, `T010`, `T011`, `T012`)

- **Command**: `dotnet test backend/tests/TutorMatching.Api.IntegrationTests/TutorMatching.Api.IntegrationTests.csproj --filter "FullyQualifiedName~HirePaymentEndpointTests|FullyQualifiedName~HireReviewEndpointTests|FullyQualifiedName~OpenApiContractTests|FullyQualifiedName~TutorDetailTests"`
- **Result**: `17/17 passed` (`3/3` in `HirePaymentEndpointTests` + `HireReviewEndpointTests`, `14/14` in `OpenApiContractTests` + `TutorDetailTests`).
- **Full Hiring Suite**: `dotnet test backend/TutorMatching.slnx --filter "FullyQualifiedName~Hiring"` → `235/235 passed` (`100` Domain.UnitTests + `5` Application.UnitTests + `130` Api.IntegrationTests, `0` failed).

## 4. Frontend Vitest Component & Page Suite (`T008`, `T009`, `T013`, `T014`)

- **Command**: `npm --prefix frontend run test -- tests/components/PaymentCheckoutDialog.test.tsx tests/components/LeaveReviewDialog.test.tsx tests/components/TutorCard.test.tsx tests/hire-close.test.tsx tests/hire-negotiation.test.tsx tests/hire-response.test.tsx tests/hire-response-pages.test.tsx tests/tutor-detail.test.tsx`
- **Result**: `8/8 test files passed (38/38 tests passed)`.
- **Playwright E2E Spec (`T015`)**: `frontend/tests/e2e/hire-payment-and-review.spec.ts`.
