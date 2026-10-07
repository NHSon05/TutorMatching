# Tasks: Foundation and Accounts

**Input**: Design documents from `specs/001-foundation-accounts/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/openapi.yaml`

**Tests**: Required by FR-019 and the project constitution. Story tests are written before their
implementation and must initially fail for the intended reason.

**Organization**: Tasks are dependency-ordered and grouped by independently testable user story.

## Format: `[ID] [P?] [Story] Description`

- `[P]`: safe to run in parallel after the phase prerequisites are complete
- `[USn]`: maps the task to a user story in `spec.md`
- Every task names the file or directory it changes

## Phase 1: Setup

**Purpose**: Make the existing scaffold buildable as a layered, testable web application.

- [x] T001 Add project references enforcing Api -> Application/Infrastructure, Infrastructure -> Application/Domain, and Application -> Domain in `backend/src/*/*.csproj`
- [x] T002 Add `TutorMatching.Domain.UnitTests`, `TutorMatching.Application.UnitTests`, and `TutorMatching.Api.IntegrationTests` projects under `backend/tests/` and register them in `backend/TutorMatching.slnx`
- [x] T003 [P] Add frontend component/E2E test dependencies and `test`/`test:e2e` scripts in `frontend/package.json`
- [x] T004 [P] Add non-secret configuration examples for PostgreSQL, cookie, frontend origin, and SMTP sandbox in `backend/src/TutorMatching.Api/appsettings.Development.json` and repository environment example files
- [x] T005 [P] Document local PostgreSQL and SMTP sandbox prerequisites without real credentials in `README.md`

**Checkpoint**: Backend solution and frontend scripts restore and build before feature code begins.

---

## Phase 2: Foundational

**Purpose**: Shared security, persistence, error, test, and UI infrastructure that blocks all stories.

- [x] T006 Create canonical `ADMIN`, `LEARNER`, `TUTOR` role values and `ACTIVE`, `LOCKED`, `INACTIVE` account states in `backend/src/TutorMatching.Domain/Users/AccountRole.cs` and `AccountStatus.cs`
- [x] T007 Configure ASP.NET Core Identity, EF Core 10, Npgsql, UUID keys, and UTC timestamps in `backend/src/TutorMatching.Infrastructure/Persistence/ApplicationDbContext.cs` and `backend/src/TutorMatching.Infrastructure/Persistence/ApplicationUser.cs`
- [x] T008 Map UserAccount constraints exactly as `Email unique after normalization`, `FullName trimmed 2-100 characters`, `PhoneNumber unique when present`, `DateOfBirth in the past`, `AvatarUrl maximum 2,048 characters`, and one canonical role/status in `backend/src/TutorMatching.Infrastructure/Persistence/Configurations/ApplicationUserConfiguration.cs`
- [x] T009 Create the initial Identity/profile/audit migration and controlled Admin demo seed in `backend/src/TutorMatching.Infrastructure/Persistence/Migrations/` and `DevelopmentDataSeeder.cs`
- [x] T010 [P] Define current-user, clock, email, audit, and account-service ports in `backend/src/TutorMatching.Application/Abstractions/`
- [x] T011 Configure secure cookie authentication, five-attempt/15-minute lockout, 30-minute idle/eight-hour absolute expiry, anti-forgery, credentialed allowlisted CORS, authorization, and rate limiting in `backend/src/TutorMatching.Api/Program.cs`
- [x] T012 [P] Configure RFC Problem Details and consistent validation/conflict/authentication error mapping in `backend/src/TutorMatching.Api/Errors/`
- [ ] T013 [P] Implement allowlisted secret-free audit events in `backend/src/TutorMatching.Infrastructure/Auditing/AuditEvent.cs` and `AuditWriter.cs`
- [X] T014 [P] Implement SMTP sandbox and integration-test email adapters without logging raw links/tokens in `backend/src/TutorMatching.Infrastructure/Email/`
- [X] T015 Build PostgreSQL-backed API test fixtures and deterministic email capture in `backend/tests/TutorMatching.Api.IntegrationTests/Fixtures/`
- [ ] T016 [P] Build shared responsive navigation, form field, loading, error, success, and access-denied components in `frontend/src/components/`
- [X] T017 Wire OpenAPI versioning and verify the implemented surface against `specs/001-foundation-accounts/contracts/openapi.yaml` in `backend/src/TutorMatching.Api/Program.cs`

**Checkpoint**: Database migration applies, test host starts, security middleware is active, and shared UI states render.

---

## Phase 3: User Story 1 - Register an account (Priority: P1) MVP

**Goal**: Visitors can register an active learner or tutor account but cannot self-register Admin.

**Independent Test**: Register one learner and tutor, reject normalized duplicate email, invalid
input, and Admin role, and confirm no credential data is returned.

### Tests

- [ ] T018 [P] [US1] Add application tests for allowed roles, password confirmation, minimum eight-character password, and normalized duplicate email in `backend/tests/TutorMatching.Application.UnitTests/Authentication/RegisterAccountTests.cs`
- [ ] T019 [P] [US1] Add API contract/integration tests for `POST /api/v1/auth/register` success, `409`, `422`, and Admin-role denial in `backend/tests/TutorMatching.Api.IntegrationTests/Authentication/RegisterEndpointTests.cs`
- [ ] T020 [P] [US1] Add registration form component tests for field errors, submitting, conflict, and success states in `frontend/tests/components/RegisterForm.test.tsx`

### Implementation

- [ ] T021 [US1] Implement registration command, validation, normalized uniqueness, active status, allowed role assignment, and atomic account/profile creation in `backend/src/TutorMatching.Application/Authentication/Register/`
- [ ] T022 [US1] Implement registration endpoint and response mapping without hashes/tokens in `backend/src/TutorMatching.Api/Controllers/AuthController.cs` and `backend/src/TutorMatching.Api/Contracts/Auth/RegisterContracts.cs`
- [ ] T023 [P] [US1] Implement responsive registration page and API client in `frontend/src/app/(auth)/register/page.tsx` and `frontend/src/lib/api/auth.ts`
- [ ] T024 [US1] Add Playwright registration journey covering learner, tutor, duplicate email, invalid input, and Admin tampering in `frontend/tests/e2e/registration.spec.ts`

**Checkpoint**: US1 passes independently and produces a usable registered identity.

---

## Phase 4: User Story 2 - Sign in and end a session (Priority: P1)

**Goal**: Active users can establish and revoke a secure browser session.

**Independent Test**: Sign in, access `/users/me`, sign out, and prove the old session cannot be reused.

### Tests

- [ ] T025 [P] [US2] Add application tests for active/locked/inactive accounts, generic credential failure, and lockout threshold in `backend/tests/TutorMatching.Application.UnitTests/Authentication/LoginTests.cs`
- [ ] T026 [P] [US2] Add API integration tests for login cookie flags, expiry, logout revocation, expired sessions, and no account enumeration in `backend/tests/TutorMatching.Api.IntegrationTests/Authentication/SessionEndpointTests.cs`
- [ ] T027 [P] [US2] Add login form tests for loading, generic error, locked/inactive denial, and success in `frontend/tests/components/LoginForm.test.tsx`

### Implementation

- [ ] T028 [US2] Implement login/logout use cases, last-login timestamp, lockout, and security-stamp session revocation in `backend/src/TutorMatching.Application/Authentication/Sessions/`
- [ ] T029 [US2] Add login/logout endpoints with anti-forgery and neutral credential errors in `backend/src/TutorMatching.Api/Controllers/AuthController.cs` and `backend/src/TutorMatching.Api/Contracts/Auth/SessionContracts.cs`
- [ ] T030 [P] [US2] Implement login page, authenticated navigation state, and logout action in `frontend/src/app/(auth)/login/page.tsx`, `frontend/src/components/AppNavigation.tsx`, and `frontend/src/lib/auth/session.ts`
- [ ] T031 [US2] Add Playwright sign-in/sign-out journey proving the previous session is rejected in `frontend/tests/e2e/session.spec.ts`

**Checkpoint**: US2 passes independently against a seeded active account.

---

## Phase 5: User Story 3 - Access only authorized data (Priority: P1)

**Goal**: Backend role and ownership checks deny unauthenticated, wrong-role, and cross-account access.

**Independent Test**: Directly call protected operations as visitor, wrong role, and another owner;
all are denied and data remains unchanged.

### Tests

- [ ] T032 [P] [US3] Add authorization policy unit tests for canonical roles and active-account requirement in `backend/tests/TutorMatching.Application.UnitTests/Authorization/AccountPolicyTests.cs`
- [ ] T033 [P] [US3] Add API integration tests for `401`, `403`, wrong-role, cross-account tampering, and UI-bypass calls in `backend/tests/TutorMatching.Api.IntegrationTests/Authorization/AccountAuthorizationTests.cs`

### Implementation

- [ ] T034 [US3] Implement current-user identity and active-account role policies in `backend/src/TutorMatching.Application/Authorization/` and `backend/src/TutorMatching.Infrastructure/Authentication/CurrentUser.cs`
- [ ] T035 [US3] Apply authorization policies to protected endpoints and ensure client-supplied owner IDs are ignored in `backend/src/TutorMatching.Api/Controllers/`
- [ ] T036 [P] [US3] Implement frontend route guards and access-denied state as UX only, without replacing server checks, in `frontend/src/components/AuthGuard.tsx` and `frontend/src/app/forbidden/page.tsx`
- [ ] T037 [US3] Add Playwright authorization journey for visitor, wrong role, and cross-account access in `frontend/tests/e2e/authorization.spec.ts`

**Checkpoint**: US3 security checks pass even when frontend controls are bypassed.

---

## Phase 6: User Story 4 - Manage a personal profile (Priority: P2)

**Goal**: Learners and tutors can view/update only their own private personal fields atomically.

**Independent Test**: Update and reload one user's allowed fields, then reject duplicate phone,
invalid data, expired session, and another user's access.

### Tests

- [ ] T038 [P] [US4] Add application tests for `FullName trimmed 2-100 characters`, `PhoneNumber unique when present`, `DateOfBirth in the past`, and `AvatarUrl maximum 2,048 characters` in `backend/tests/TutorMatching.Application.UnitTests/Users/UpdateProfileTests.cs`
- [ ] T039 [P] [US4] Add API integration tests for `GET/PUT /api/v1/users/me`, conflict atomicity, expired session, and cross-owner denial in `backend/tests/TutorMatching.Api.IntegrationTests/Users/CurrentProfileEndpointTests.cs`
- [ ] T040 [P] [US4] Add profile form tests for loading, populated, validation, saving, conflict, success, and unauthorized states in `frontend/tests/components/ProfileForm.test.tsx`

### Implementation

- [ ] T041 [US4] Implement get/update current-profile queries and atomic conflict handling in `backend/src/TutorMatching.Application/Users/Profile/`
- [ ] T042 [US4] Add current-profile endpoints and private response contracts in `backend/src/TutorMatching.Api/Controllers/UsersController.cs` and `backend/src/TutorMatching.Api/Contracts/Users/ProfileContracts.cs`
- [ ] T043 [P] [US4] Implement authenticated profile page and profile API client in `frontend/src/app/profile/page.tsx` and `frontend/src/lib/api/profile.ts`
- [ ] T044 [US4] Add Playwright profile journey for persistence, conflict, expired session, and privacy in `frontend/tests/e2e/profile.spec.ts`

**Checkpoint**: US4 passes independently with no private profile exposed publicly.

---

## Phase 7: User Story 5 - Reset a forgotten password (Priority: P3)

**Goal**: Users can reset a password once without account enumeration or token leakage.

**Independent Test**: Compare existing/non-existing request responses, reset once, reject reuse and
expiry, reject the old password, and accept the new password.

### Tests

- [ ] T045 [P] [US5] Add application tests for neutral requests, token expiry/single use, eight-character new password, session invalidation, and secret-free audit data in `backend/tests/TutorMatching.Application.UnitTests/Authentication/PasswordResetTests.cs`
- [ ] T046 [P] [US5] Add API integration tests for forgot/reset responses, captured sandbox email, invalid/expired/used token, and prior-session revocation in `backend/tests/TutorMatching.Api.IntegrationTests/Authentication/PasswordResetEndpointTests.cs`
- [ ] T047 [P] [US5] Add forgot/reset form tests for neutral success, invalid token, expiry, validation, and success in `frontend/tests/components/PasswordResetForms.test.tsx`

### Implementation

- [ ] T048 [US5] Implement reset request and completion use cases with Identity tokens, neutral response, password update, security-stamp rotation, and email port in `backend/src/TutorMatching.Application/Authentication/PasswordReset/`
- [ ] T049 [US5] Add forgot/reset endpoints with rate limits and no raw token logging in `backend/src/TutorMatching.Api/Controllers/AuthController.cs` and `backend/src/TutorMatching.Api/Contracts/Auth/PasswordResetContracts.cs`
- [ ] T050 [P] [US5] Implement forgot/reset pages and API calls in `frontend/src/app/(auth)/forgot-password/page.tsx`, `frontend/src/app/(auth)/reset-password/page.tsx`, and `frontend/src/lib/api/auth.ts`
- [ ] T051 [US5] Add Playwright reset journey proving neutral response, single use, old-password failure, and new-password success in `frontend/tests/e2e/password-reset.spec.ts`

**Checkpoint**: US5 passes independently with no account or credential disclosure.

---

## Phase 8: Polish and Cross-Cutting Validation

**Purpose**: Prove Sprint 1 compliance and remove integration/security gaps.

- [ ] T052 [P] Verify generated OpenAPI matches `specs/001-foundation-accounts/contracts/openapi.yaml` and update contract examples in `backend/src/TutorMatching.Api/TutorMatching.Api.http`
- [ ] T053 [P] Add responsive and keyboard-accessibility checks for auth/profile pages in `frontend/tests/e2e/accessibility.spec.ts`
- [ ] T054 Run secret/PII log inspection and public-response privacy tests, recording evidence in `specs/001-foundation-accounts/evidence/security-validation.md`
- [ ] T055 Run the 100-concurrent-user account-page performance check for the three-second SRS target and record results in `specs/001-foundation-accounts/evidence/performance-validation.md`
- [ ] T056 Run every command and journey in `specs/001-foundation-accounts/quickstart.md` and record exact pass/fail evidence in `specs/001-foundation-accounts/evidence/quickstart-validation.md`
- [ ] T057 Reconcile implementation against `spec.md`, close or append discovered gaps in `specs/001-foundation-accounts/tasks.md`, and update `docs/agent-memory/PROJECT.md` only for stable facts

## Dependencies & Execution Order

### Phase dependencies

- Setup (Phase 1) has no dependency.
- Foundational (Phase 2) depends on Setup and blocks every user story.
- US1, US2, and US3 are P1. Implement in the order US1 -> US2 -> US3 for a single team; separate
  developers may prepare tests/UI in parallel after Foundation.
- US4 depends on the authenticated current-user foundation but not on US5.
- US5 depends on account/email/session foundation but not on US4.
- Polish depends on every story selected for Sprint 1 acceptance.

### User-story dependency graph

```text
Setup -> Foundation -> US1 Registration -> US2 Session -> US3 Authorization
                         |                    |             |
                         +--------------------+-----------> US4 Profile
                         +--------------------+-----------> US5 Password Reset
US1 + US2 + US3 + US4 + US5 -> Polish/Converge
```

### Parallel opportunities

- T003-T005 can run in parallel after T001 establishes project references.
- T010, T012-T014, and T016 affect separate files and can run in parallel after persistence/auth
  choices are installed.
- Within each story, backend tests, frontend tests, and contract review can be prepared in parallel.
- US4 and US5 can be implemented in parallel after US2/US3 foundations are stable.

## Parallel Example: User Story 1

```text
Task: T018 application registration tests
Task: T019 API registration contract/integration tests
Task: T020 frontend registration form tests
```

After those tests fail for the intended missing behavior, implement T021-T024 in dependency order.

## Backlog Mapping

| Original sprint item | Spec Kit tasks                           |
| -------------------- | ---------------------------------------- |
| S1-01, S1-02         | Constitution, spec, research, T057       |
| S1-03, S1-06         | T007-T009                                |
| S1-04, S1-05         | T001-T005, T010-T017                     |
| S1-07                | T016, T023, T030, T036, T043, T050, T053 |
| S1-08                | T018-T024                                |
| S1-09                | T025-T031                                |
| S1-10                | T032-T037                                |
| S1-11                | T038-T044                                |
| S1-12                | T045-T051, T054-T056                     |

## Implementation Strategy

### MVP first

1. Complete Setup and Foundational phases.
2. Complete US1 registration and demonstrate it independently.
3. Add US2 session and US3 authorization before calling authentication complete.
4. Add US4 and US5 as independent increments.
5. Run Polish/Converge and require evidence before changing checklist boxes to complete.

### AI execution rule

Give an AI one task ID or one phase at a time. Require it to read only the linked spec/plan section,
inspect target files before editing, run the named tests, review the diff, and report evidence. Do not
ask an AI to implement all 57 tasks in one unreviewed prompt.
