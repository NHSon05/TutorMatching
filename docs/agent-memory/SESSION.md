# Current Session Handoff

- **Status**: Sprint 9 (`009-hire-payment-and-reviews`) implemented; code-review fixes applied (2026-11-10). Two integration tests still failing.
- **Feature**: Hire Request Tuition Payment (`VIETQR_SANDBOX`) & Post-Lesson Tutor Reviews (`hire_payments`, `hire_reviews`).
- **Review fixes applied**:
  1. `HireRequest.ConfirmPayment` rejects when payment or request is already PAID, and when the payment is not PENDING.
  2. `PayHireRequest.CreateAsync` reuses the outstanding PENDING payment (`IHireWriteSession.FindPendingPaymentAsync`) and returns the post-commit `requestVersion`.
  3. Detail `allowedActions` now owns `pay`, `review`, `replyReview`; `complete` is withheld while `HireRequest.RequiresPaymentBeforeComplete`. Frontend `HireRequestDetail` reads permissions only from `allowedActions` (viewer props removed).
  4. Public `GET /tutors/{id}/reviews` masks reviewer names (`HireRequestQueries.MaskReviewerName`); replying to a hidden review returns `not_found`.
  5. Rating-only `TutorProfile` updates no longer rotate `Version`/`UpdatedAt` (`ApplicationDbContext`).
  6. Valid UUID v4 fallback for the payment idempotency key (`HireRequestPage.createIdempotencyKey`).
- **Verification**: Domain unit 137/137; frontend Vitest 49 files / 299 tests; API integration 313/315.
- **Blockers / next step**: Fix the two remaining integration failures:
  - `TutorReviewTests.MigrationPreservesLegacyDecisionAndDoesNotInventVersion`: `column "average_rating" does not exist` on the legacy-migration path.
  - `DiscoveryContractTests.EveryDiscoveryOperationMatchesItsPublishedContract`: `averageRating`/`reviewCount` on `GET /api/v1/tutors` items are not in the published contract.
- Pre-existing lint errors (`react-hooks/set-state-in-effect`) remain in `HireRequestDetail.tsx` and `LeaveReviewDialog.tsx`.
