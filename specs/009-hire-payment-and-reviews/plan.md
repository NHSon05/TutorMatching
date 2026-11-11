# Implementation Plan: Hire Request Payment & Post-Lesson Tutor Reviews

**Feature**: `009-hire-payment-and-reviews` | **Date**: 2026-11-08 | **Spec**: [spec.md](spec.md)  
**Status**: Planned — Ready for Phase 2 implementation.

---

## 1. Summary

Extend the `HireRequest` lifecycle with a VietQR + Sandbox Confirmation package payment flow (`hire_payments`) and a post-lesson learner review & rating system (`hire_reviews`). Require `PaymentStatusCode == "PAID"` before a hire request can transition from `ACCEPTED` to `COMPLETED`. Atomically maintain `average_rating` and `review_count` on `tutor_profiles` and surface ratings and reviews across the learner/tutor request detail views and public tutor discovery pages.

## 2. Technical Context

- **Backend**: C# / .NET 10, ASP.NET Core Web API, EF Core 10 (Npgsql), snake_case PostgreSQL 17 schema, SignalR (`EventsHub`).
- **Frontend**: Next.js 16.3.6, React 19.2.8, TypeScript, Tailwind CSS 4, TanStack Query v5, Axios with automatic CSRF & cookie session renewal.
- **Testing**: xUnit Domain & Application unit tests, Testcontainers PostgreSQL 17.6 API integration tests, Vitest + React Testing Library component tests, Playwright E2E tests.

## 3. Constitution Check

| Principle                   | Verification                                                                                                                                                      |
| :-------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **I: Traceability**         | Maps directly to `003-hire-negotiation` lifecycle (`ACCEPTED` → `PAID` → `COMPLETED` → `REVIEWED`).                                                               |
| **II: Security & Privacy**  | Participant-only payment/review mutations, CSRF required on all unsafe calls, `Idempotency-Key` on payment creation, zero PII leakage on public review feeds.     |
| **III: Clean Architecture** | `Domain` owns payment/completion/review rules; `Application` orchestrates use cases; `Infrastructure` owns row-locked EF transactions; `Api` maps HTTP contracts. |
| **IV: Evidence**            | Every phase gates on automated unit, integration, component, and E2E tests recorded in `evidence.md`.                                                             |
| **V: Simplicity**           | Uses deterministic VietQR payload generation + built-in sandbox confirmation without external secret dependencies in local dev.                                   |

## 4. Project Structure

```text
specs/009-hire-payment-and-reviews/
  spec.md, plan.md, data-model.md, tasks.md
backend/src/TutorMatching.Domain/Hiring/
  HireRequest.cs
  HirePayment.cs
  HireReview.cs
backend/src/TutorMatching.Domain/Tutors/
  TutorProfile.cs
backend/src/TutorMatching.Application/Hiring/
  PayHireRequest.cs
  ReviewHireRequest.cs
  HireContracts.cs
  IHireRequestStore.cs
  IHireRequestQueries.cs
backend/src/TutorMatching.Infrastructure/Hiring/
  HireRequestStore.cs
  HireRequestQueries.cs
backend/src/TutorMatching.Infrastructure/Persistence/Configurations/
  HireRequestConfiguration.cs
  HirePaymentConfiguration.cs
  HireReviewConfiguration.cs
  TutorProfileConfiguration.cs
backend/src/TutorMatching.Api/Controllers/
  HireRequestsController.cs
  TutorsController.cs
frontend/src/lib/api/
  hire-requests.ts
  tutors.ts
frontend/src/hooks/
  use-hire-requests.ts
frontend/src/components/hiring/
  HireRequestDetail.tsx
  PaymentCheckoutDialog.tsx
  LeaveReviewDialog.tsx
  HireReviewCard.tsx
frontend/src/components/tutors/
  TutorCard.tsx
  TutorReviewsSection.tsx
```
