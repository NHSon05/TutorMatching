# Feature Specification: Hire Request Payment & Post-Lesson Tutor Reviews

**Feature Branch / ID**: `009-hire-payment-and-reviews`  
**Created**: 2026-11-08  
**Status**: Planned  
**Depends On**: `003-hire-negotiation`, `002-tutor-discovery`

---

## 1. Overview & Problem Statement

Once a learner and tutor reach a final agreement on a hire request (`StatusCode == "ACCEPTED"`), the platform needs a transparent, verifiable way for the learner to pay the agreed tuition package before completing the course/lesson, and to rate/review the tutor after the lesson has ended (`StatusCode == "COMPLETED"`).

### Locked Product Decisions (2026-11-08)

1. **Payment Flow (`VIETQR_SANDBOX`)**: Generate a dynamic VietQR payment intent with bank transfer reference code and support one-click Sandbox Confirmation for local development and automated E2E verification.
2. **Completion Gate**: `HireRequest.PaymentStatusCode == "PAID"` is **required** before a [`HireRequest`](../../backend/src/TutorMatching.Domain/Hiring/HireRequest.cs) can transition from `ACCEPTED` to `COMPLETED`.
3. **Billing Calculation (1 Month / Course Package)**:
   - If the request is tied to a course with `Course.SessionCount > 0`, `BillingSessions = Course.SessionCount`.
   - Otherwise, `BillingSessions = SessionsPerWeek * 4` (1-month package).
   - `AmountVnd = AgreedPriceVnd * BillingSessions`.
4. **Naming Isolation**: Admin onboarding review history retains `tutor_profile_reviews` (`TutorReviewsController`). Post-lesson learner reviews use `hire_reviews` (`HireReview`) and tuition payments use `hire_payments` (`HirePayment`).

---

## 2. User Stories & Acceptance Criteria

### User Story 1 — Pay Tuition Package via VietQR + Sandbox Confirmation (Priority: P1)

As a **Learner**, after my hire request is `ACCEPTED`, I want to view the calculated 1-month or course-package tuition total, scan a VietQR code (or confirm in Sandbox), and receive instant payment confirmation so that my lessons are officially funded and can be completed.

**Acceptance Scenarios**:

1. **Given** an `ACCEPTED` hire request with `AgreedPriceVnd = 300,000` and `SessionsPerWeek = 2` (no course), **When** the learner initiates payment with a valid `Idempotency-Key`, **Then** the system creates a `PENDING` `HirePayment` with `BillingSessions = 8`, `AmountVnd = 2,400,000`, `TransferReference`, and `QrPayload`.
2. **Given** an `ACCEPTED` hire request linked to a `Course` with `SessionCount = 12` and `AgreedPriceVnd = 350,000`, **When** the learner initiates payment, **Then** `BillingSessions = 12` and `AmountVnd = 4,200,000`.
3. **Given** a `PENDING` payment, **When** the learner confirms the payment via the Sandbox Confirmation action, **Then** `HirePayment.StatusCode` and `HireRequest.PaymentStatusCode` transition to `PAID`, `PaidAt` is recorded in UTC, and a `HIRE_PAYMENT_COMPLETED` notification is sent to the tutor.
4. **Given** an `ACCEPTED` hire request where `PaymentStatusCode != "PAID"`, **When** either participant attempts to call `POST /api/v1/hire-requests/{id}/complete`, **Then** the backend rejects the request with `409 Conflict` (`payment_required`).

### User Story 2 — Review & Rate Tutor After Lesson Ended (Priority: P1)

As a **Learner**, once my paid hire request is marked `COMPLETED`, I want to rate the tutor from 1 to 5 stars and leave written feedback so future learners can make informed decisions and the tutor receives recognition.

**Acceptance Scenarios**:

1. **Given** a `COMPLETED` hire request, **When** the learner submits a review (`rating: 1..5`, optional `comment` up to 1000 chars), **Then** the system persists the `HireReview`, atomically updates `TutorProfile.AverageRating` and `TutorProfile.ReviewCount`, and notifies the tutor (`TUTOR_REVIEW_RECEIVED`).
2. **Given** a hire request that is not `COMPLETED` (e.g., `ACCEPTED` or `CANCELLED`), **When** the learner attempts to submit a review, **Then** the system rejects with `409 Conflict` (`state_conflict`).
3. **Given** a `COMPLETED` hire request that already has a review, **When** the learner attempts to submit a second review, **Then** the system rejects with `409 Conflict` (`review_already_submitted`).
4. **Given** a published learner review, **When** the reviewed tutor submits a reply (`1..1000` chars), **Then** `tutor_reply` and `tutor_replied_at` are saved once and displayed alongside the review.
5. **Given** an approved tutor with published reviews, **When** any visitor views `/tutors` or `/tutors/{id}`, **Then** the tutor's `averageRating`, `reviewCount`, and paginated public reviews are displayed without leaking the learner's email, phone number, birth date, or exact address.

---

## 3. Functional Requirements

- **FR-001**: Only the `RequesterUserId` (`LEARNER`) of an `ACCEPTED` hire request may initiate payment.
- **FR-002**: Payment creation MUST be idempotent per `(PayerUserId, IdempotencyKey)`.
- **FR-003**: Package billing MUST compute `BillingSessions = Course?.SessionCount > 0 ? Course.SessionCount : SessionsPerWeek * 4` and `AmountVnd = AgreedPriceVnd * BillingSessions`.
- **FR-004**: `CompleteHireRequest` MUST enforce `PaymentStatusCode == "PAID"` before transitioning `ACCEPTED` → `COMPLETED`.
- **FR-005**: Only the `RequesterUserId` (`LEARNER`) of a `COMPLETED` hire request may submit a review, and at most one review is allowed per `HireRequestId`.
- **FR-006**: `Rating` MUST be an integer between `1` and `5` inclusive; `Comment` and `TutorReply` MUST be trimmed and `<= 1000` characters.
- **FR-007**: `TutorProfile.AverageRating` (rounded to 2 decimal places) and `TutorProfile.ReviewCount` MUST be recalculated transactionally whenever a review is created or its visibility changes.
- **FR-008**: Public review endpoints MUST never expose learner private PII (`email`, `phone`, `dateOfBirth`, `locationDetail`).
