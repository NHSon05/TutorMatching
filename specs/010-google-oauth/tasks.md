# Tasks: Sign In and Register with Google

**Input**: Design documents from `specs/010-google-oauth/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/openapi.json](contracts/openapi.json),
[quickstart.md](quickstart.md)

**Tests**: Required by constitution principle IV (authentication failure, role denial, account
enumeration). Write each story's tests first and confirm they fail before implementing.

**Organization**: Grouped by user story so each story can be implemented and verified independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on incomplete tasks)
- **[Story]**: US1–US4 from spec.md

---

## Phase 1: Setup

- [x] T001 Add the `Google.Apis.Auth` package reference to `backend/src/TutorMatching.Infrastructure/TutorMatching.Infrastructure.csproj`
- [x] T002 [P] Add `Google__ClientId=` (with a comment: Web client ID, no secret) to `backend/.env.example` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID=` to `frontend/.env.example`
- [x] T003 [P] Add `lh3.googleusercontent.com` (https) to `images.remotePatterns` in `frontend/next.config.ts`

---

## Phase 2: Foundational (blocks all stories)

- [x] T004 Add `ExternalSignInSucceeded`, `ExternalSignInFailed`, `ExternalLoginLinked`, `ExternalAccountRegistered` to the end of `AccountAuditAction` in `backend/src/TutorMatching.Application/Abstractions/IAuditWriter.cs` (append only; values are stored as strings, max 100, no migration)
- [x] T005 [P] Create the port `IGoogleIdTokenVerifier.VerifyAsync(string credential, CancellationToken)` returning `ExternalIdentity?` and the record `ExternalIdentity(string Subject, string Email, bool EmailVerified, string? FullName, string? PictureUrl)` (Subject ≤ 255, Email ≤ 256, PictureUrl absolute https ≤ 2048) in `backend/src/TutorMatching.Application/Abstractions/IGoogleIdTokenVerifier.cs`
- [x] T006 [P] Create the port `IPendingGoogleRegistrationProtector` with `string Protect(ExternalIdentity)` and `ExternalIdentity? Unprotect(string token)` in `backend/src/TutorMatching.Application/Abstractions/IPendingGoogleRegistrationProtector.cs`
- [x] T007 Create the separate port `IExternalAccountService` (kept apart from `IAccountService` so the three existing unit-test doubles stay unchanged) with `Task<AccountOperationResult> SignInWithExternalLoginAsync(ExternalIdentity identity, CancellationToken)` (linked → sign in; same verified email → link and sign in; `NotFound` when no account has the email; `InvalidCredentials` for every refusal) and `Task<AccountOperationResult> RegisterExternalAsync(ExternalIdentity identity, AccountRole role, CancellationToken)` in `backend/src/TutorMatching.Application/Abstractions/IExternalAccountService.cs`
- [x] T008 Create `GoogleOptions` (`ClientId`, section `Google`) in `backend/src/TutorMatching.Infrastructure/Authentication/GoogleOptions.cs`, then implement `GoogleIdTokenVerifier` in `backend/src/TutorMatching.Infrastructure/Authentication/GoogleIdTokenVerifier.cs` using `GoogleJsonWebSignature.ValidateAsync` with `Audience = [ClientId]` and clock tolerance ≤ 5 minutes. Return `null` on `InvalidJwtException` or an empty ClientId, and never log the credential
- [x] T009 [P] Implement `DataProtectionPendingGoogleRegistrationProtector` (`IDataProtector`, purpose `TutorMatching.GoogleSignup.v1`, JSON payload with an expiry instant checked against the injected `TimeProvider` so tests can advance time; 10-minute lifetime; `null` on tamper/expiry) in `backend/src/TutorMatching.Infrastructure/Authentication/DataProtectionPendingGoogleRegistrationProtector.cs`
- [x] T010 Register `GoogleOptions`, `IGoogleIdTokenVerifier` and `IPendingGoogleRegistrationProtector` in `backend/src/TutorMatching.Infrastructure/DependencyInjection.cs`
- [x] T011 Add a unique index `ux_asp_net_user_logins_user_id_login_provider` on `(user_id, login_provider)` to the Identity login configuration in `backend/src/TutorMatching.Infrastructure/Persistence/ApplicationDbContext.cs`, generate migration `AddExternalLoginUniqueness` in `backend/src/TutorMatching.Infrastructure/Persistence/Migrations/`, and apply it with `dotnet run --project backend/tools/TutorMatching.DatabaseMigrator`
- [x] T012 [P] Create `FakeGoogleIdTokenVerifier` (maps test credentials to configurable `ExternalIdentity` values; null for unknown) in `backend/tests/TutorMatching.Api.IntegrationTests/Fixtures/FakeGoogleIdTokenVerifier.cs`, and substitute it in `ConfigureTestServices` of `backend/tests/TutorMatching.Api.IntegrationTests/Fixtures/ApiWebApplicationFactory.cs` (exposed as `factory.Google`, same pattern as `CapturedEmailSender`)
- [x] T013 [P] Create API records `GoogleSignInRequest(string Credential)`, `GoogleRegistrationRequired(string Status, string PendingToken, string Email, string FullName, string? AvatarUrl)` and `CompleteGoogleRegistrationRequest(string PendingToken, string Role)` in `backend/src/TutorMatching.Api/Contracts/Auth/GoogleContracts.cs`
- [x] T014 [P] Link `../../../specs/010-google-oauth/contracts/openapi.json` as `Contracts/google-auth.json` in `backend/tests/TutorMatching.Api.IntegrationTests/TutorMatching.Api.IntegrationTests.csproj`, and merge its paths and schemas (skipping the placeholder `LoginResponse`/`ProblemDetails`) in `backend/tests/TutorMatching.Api.IntegrationTests/Contracts/OpenApiContractTests.cs`, as done for `discovery.json`; contracted-but-unimplemented operations are listed in `NotYetImplementedGoogleOperations` (remove entries in T022/T033)
- [x] T015 [P] Add `googleSignIn(credential)` and `completeGoogleRegistration(pendingToken, role)` to `frontend/src/lib/auth/session.ts` (POST `/auth/google` and `/auth/google/complete` through `http`). Both return a discriminated union: `{ kind: "signed-in", account }` or `{ kind: "role-required", pendingToken, email, fullName, avatarUrl }`
- [x] T016 [P] Extract the role/tutor-status redirect logic of `LoginCard` (admin → `/admin/dashboard`, tutor not approved → `/onboarding`, otherwise `/`) into `redirectAfterSignIn(router, role, tutorProfileStatus)` in `frontend/src/lib/auth/post-login-redirect.ts`, and make `frontend/src/components/auth/LoginCard.tsx` use it without changing behavior

**Checkpoint**: Solution builds; the existing auth tests still pass (`dotnet test backend/TutorMatching.slnx --filter "FullyQualifiedName~Auth"`, `npm --prefix frontend run test -- LoginForm`).

**Evidence (2026-11-14)**: `dotnet build` succeeded; Domain unit 139/139, Application unit 97/97, API integration 337/337 (full suite, including the new migration); frontend `tsc --noEmit` and eslint clean on changed files; Vitest LoginForm/auth-api/session-refresh/routing 44/44. Migration `20261114064134_AddExternalLoginUniqueness` applied to local PostgreSQL via DatabaseMigrator.

---

## Phase 3: User Story 1 - Sign in with a linked Google account (P1) 🎯 MVP

**Goal**: A user whose account is already linked signs in with Google and gets a normal session.

**Independent Test**: Seed an active learner linked to `(Google, sub-1)`, POST `/api/v1/auth/google` with that credential, and verify a 200 `LoginResponse`, session cookies, and that `/api/v1/users/me` succeeds.

### Tests (write first)

- [x] T017 [P] [US1] Unit tests for `GoogleSignInHandler` covering: linked active account → `SignedIn`; verifier returns null → `Refused`; `EmailVerified=false` → `Refused`; credential empty or longer than 4096 → `InvalidInput`. File: `backend/tests/TutorMatching.Application.UnitTests/Authentication/GoogleSignInHandlerTests.cs`
- [x] T018 [P] [US1] Integration tests in `backend/tests/TutorMatching.Api.IntegrationTests/Authentication/GoogleAuthTests.cs`:
  - linked sign-in returns 200 with both cookies, and `/users/me` returns the account;
  - logout ends the session;
  - an invalid credential returns 401 with title `Google sign-in failed.`;
  - a request without the antiforgery token returns 400;
  - `last_login_at` is updated;
  - an `ExternalSignInSucceeded` audit event is written and contains no credential.

### Implementation

- [x] T019 [US1] Create `GoogleSignInResult` (`SignedIn(AccountProfile)`, `RoleRequired(string PendingToken, ExternalIdentity Identity)`, `Refused`, `InvalidInput`) in `backend/src/TutorMatching.Application/Authentication/Google/GoogleSignInResult.cs`
- [x] T020 [US1] Implement `GoogleSignInHandler.HandleAsync(string credential, CancellationToken)` in `backend/src/TutorMatching.Application/Authentication/Google/GoogleSignInHandler.cs`:
  - validate the length (1–4096);
  - verify the credential and require `EmailVerified`;
  - call `SignInWithExternalLoginAsync` and map the result: success → `SignedIn`, `NotFound` → `RoleRequired` (uses the protector; added in US2), anything else → `Refused`.
  - Register the handler in Application DI.
- [x] T021 [US1] Create `IdentityExternalAccountService : IExternalAccountService` (register it scoped in `backend/src/TutorMatching.Infrastructure/DependencyInjection.cs`) and implement the linked-login branch of `SignInWithExternalLoginAsync` in `backend/src/TutorMatching.Infrastructure/Authentication/IdentityExternalAccountService.cs`:
  - `FindByLoginAsync("Google", sub)`;
  - require `Status == ACTIVE`, `DeletedAt == null` and `Role != ADMIN`;
  - update `LastLoginAt`;
  - write `ExternalSignInSucceeded`, or `ExternalSignInFailed` on refusal;
  - return the `AccountProfile` including the tutor status.
- [x] T022 [US1] Add `POST auth/google` to `backend/src/TutorMatching.Api/Controllers/AuthController.cs` with `[AllowAnonymous]`, `application/json`, `Cache-Control: no-store` and the `ProducesResponseType`s from the contract (200/202/400/401/429):
  - `SignedIn` → `tokens.CreateAsync` + `cookies.Issue`, then 200 `LoginResponse`;
  - `Refused` → 401 `Google sign-in failed.`;
  - `InvalidInput` → 400.
- [x] T023 [P] [US1] Add `useGoogleSignIn()` (TanStack mutation, `retry: false`, `gcTime: 0`, calls `replaceSession` on `signed-in`) to `frontend/src/hooks/use-auth.ts`
- [x] T024 [US1] Create `GoogleSignInButton` (client component) in `frontend/src/components/auth/GoogleSignInButton.tsx`:
  - load `https://accounts.google.com/gsi/client` with `next/script` (`afterInteractive`);
  - call `google.accounts.id.initialize({ client_id: NEXT_PUBLIC_GOOGLE_CLIENT_ID, callback, ux_mode: "popup" })` and `renderButton`;
  - render nothing when the client ID is empty;
  - expose `onSignedIn(account)`, `onRoleRequired(payload)` and `onError(message)`;
  - show a Vietnamese generic error; a cancelled popup leaves no state (FR-016).
- [x] T025 [US1] Add `GoogleSignInButton` to `frontend/src/components/auth/LoginCard.tsx` below the password form, with a "hoặc" divider; on `signed-in` call `onSuccess` and `redirectAfterSignIn`
- [x] T026 [P] [US1] Component tests in `frontend/tests/components/GoogleSignIn.test.tsx` with `window.google` stubbed:
  - no button without a client ID;
  - a successful callback redirects by role;
  - a 401 shows the generic error;
  - a cancel shows nothing.

**Checkpoint**: The US1 independent test passes, and T017/T018/T026 are green.

**Evidence (2026-11-14, US1–US3)**: Application unit 117/117 (`GoogleSignInHandlerTests`), API integration 345/345 including 8 `GoogleAuthTests` and `OpenApiContractTests` (both Google operations verified against `contracts/openapi.json`); Vitest `GoogleSignIn.test.tsx` 8/8 + `LoginForm` 6/6; tsc and eslint clean on changed files. Unrelated pre-existing frontend failures from parallel work: hire-close, tutor-detail, PaymentCheckoutDialog, TutorDashboardClient (4 tests).

---

## Phase 4: User Story 2 - Register a new account with Google (P1)

**Goal**: A visitor without an account chooses a role and gets an active account with the Google name, email and picture.

**Independent Test**: With an unknown verified identity, POST `/auth/google` → 202 with `pendingToken`; POST `/auth/google/complete` with `role=TUTOR` → 201, cookies, a DRAFT tutor profile, `avatar_url` set to the Google picture, and a `password_hash` of null.

### Tests (write first)

- [x] T027 [P] [US2] Unit tests in `backend/tests/TutorMatching.Application.UnitTests/Authentication/CompleteGoogleRegistrationHandlerTests.cs`:
  - unknown identity → `RoleRequired`;
  - complete with `LEARNER`/`TUTOR` → `SignedIn`;
  - an `ADMIN`, empty or unknown role → `InvalidInput`;
  - an expired or tampered token → `Refused`;
  - a name shorter than 2 characters falls back to the email local part;
  - a name longer than 100 characters is truncated to 100.
- [x] T028 [P] [US2] Integration tests in `backend/tests/TutorMatching.Api.IntegrationTests/Authentication/GoogleAuthTests.cs`:
  - 202 → complete as LEARNER and as TUTOR (TutorProfile `DRAFT`, `email_confirmed = true`, `password_hash` null, avatar = picture);
  - a token expired by advancing the test `TimeProvider` 11 minutes → 401;
  - two concurrent completes for the same subject → exactly one account (SC-005);
  - a replayed complete after the account exists signs into the same account;
  - an `ExternalAccountRegistered` audit event is written.
- [x] T029 [P] [US2] Integration test: password sign-in for a Google-created account returns the standard invalid-credentials response (FR-013), in `backend/tests/TutorMatching.Api.IntegrationTests/Authentication/GoogleAuthTests.cs`

### Implementation

- [x] T030 [US2] Wire `RoleRequired` in `GoogleSignInHandler` with `IPendingGoogleRegistrationProtector.Protect(identity)` in `backend/src/TutorMatching.Application/Authentication/Google/GoogleSignInHandler.cs`
- [x] T031 [US2] Implement `CompleteGoogleRegistrationHandler.HandleAsync(string pendingToken, string role, CancellationToken)` in `backend/src/TutorMatching.Application/Authentication/Google/CompleteGoogleRegistrationHandler.cs`:
  - unprotect the token;
  - accept only `LEARNER` or `TUTOR` (case-insensitive, never `ADMIN`);
  - normalize the full name (trimmed, 2–100 characters, falling back to the email local part);
  - call `RegisterExternalAsync`.
- [x] T032 [US2] Implement `RegisterExternalAsync` in `backend/src/TutorMatching.Infrastructure/Authentication/IdentityExternalAccountService.cs`:
  - in one transaction: `CreateAsync(user)` without a password (`EmailConfirmed = true`, `Status = ACTIVE`, `AvatarUrl = PictureUrl`), then `AddLoginAsync(new UserLoginInfo("Google", sub, "Google"))`, plus a `TutorProfile` with `Status = DRAFT` when the role is `TUTOR`;
  - on a duplicate email or login, roll back and re-resolve with `FindByLoginAsync` (sign in when it is the same subject, otherwise `InvalidCredentials`);
  - write the `ExternalAccountRegistered` audit event.
- [x] T033 [US2] Map `RoleRequired` in `AuthController` to a 202 `GoogleRegistrationRequired` with `status = "role_required"`. Add `POST auth/google/complete`: 201 `LoginResponse` with cookies, 400 for an invalid role or input, 401 generic. File: `backend/src/TutorMatching.Api/Controllers/AuthController.cs`
- [x] T034 [P] [US2] Add `useCompleteGoogleRegistration()` to `frontend/src/hooks/use-auth.ts`; it calls `replaceSession` on success
- [x] T035 [US2] (Implemented as `GoogleRoleDialog` in `frontend/src/components/auth/GoogleRoleDialog.tsx`: a `Dialog` with two radio cards, LEARNER "Học viên" and TUTOR "Gia sư", per product decision 2026-11-14.) Original plan — create `GoogleRoleStep` in `frontend/src/components/auth/GoogleRoleStep.tsx`:
  - show the Google name, email and avatar, plus `SelectRoleCard` (`onRoleSelected`);
  - map PARENT/STUDENT to `LEARNER` and TUTOR to `TUTOR`;
  - on success use `redirectAfterSignIn`;
  - on 401 show "Phiên đăng ký Google đã hết hạn, vui lòng thử lại" with a restart button.
- [ ] T036 [US2] (LoginCard done; RegisterCard pending) Add `GoogleSignInButton` to `frontend/src/components/auth/RegisterCard.tsx` and to `LoginCard`; when `onRoleRequired` fires, render `GoogleRoleStep` in place of the form
- [x] T037 [P] [US2] Extend `frontend/tests/components/GoogleSignIn.test.tsx`:
  - a 202 shows the role step;
  - choosing PARENT sends `LEARNER`;
  - choosing TUTOR redirects to `/onboarding`;
  - an expired token shows the restart message.

**Checkpoint**: The US2 independent test passes; US1 tests are still green.

---

## Phase 5: User Story 3 - Link Google to an existing password account (P2)

**Goal**: Google sign-in with the email of an existing password account opens that account.

**Independent Test**: Register `link@test.local` with a password. POST `/auth/google` with a verified identity for `LINK@test.local` → 200 for the same account id, a row in `asp_net_user_logins`, the avatar unchanged, and password login still succeeds.

- [x] T038 [P] [US3] Unit/integration tests in `backend/tests/TutorMatching.Api.IntegrationTests/Authentication/GoogleAuthTests.cs`:
  - case-insensitive email link → 200 for the same id, with role, name and password unchanged;
  - an existing avatar is kept, a null avatar stays null;
  - both `ExternalLoginLinked` and `ExternalSignInSucceeded` audit events are written;
  - a second Google sign-in uses the link without creating a new row;
  - password login still works.
- [x] T039 [US3] Implement the email-link branch of `SignInWithExternalLoginAsync` in `backend/src/TutorMatching.Infrastructure/Authentication/IdentityExternalAccountService.cs`:
  - `FindByEmailAsync`;
  - require ACTIVE, not deleted, not ADMIN, and no existing `Google` login (`GetLoginsAsync`);
  - `AddLoginAsync` and sign in within one transaction, without overwriting the avatar, name, role or password;
  - return `NotFound` only when no account has the email.

**Checkpoint**: The US3 independent test passes; US1 and US2 are still green.

---

## Phase 6: User Story 4 - Block disallowed Google sign-ins (P2)

**Goal**: Admins, locked or deleted accounts, unverified emails and conflicting links are refused, all with the same response.

**Independent Test**: For an admin email, a locked learner, an unverified identity, and an email already linked to a different `sub`, POST `/auth/google` → 401 with an identical title and body shape, no cookies, no new account or link, and an `ExternalSignInFailed` audit event.

- [ ] T040 [P] [US4] (Refusal matrix + ADMIN role done in `GoogleAuthTests`; 429 and log-capture checks pending) Integration tests in `backend/tests/TutorMatching.Api.IntegrationTests/Authentication/GoogleAuthTests.cs`:
  - the four refusal cases return byte-identical problem titles and no `Set-Cookie` for the session (SC-003);
  - a complete with `role=ADMIN` → 400;
  - the 11th auth POST inside the window → 429;
  - log capture contains no credential or pending token (SC-006).
- [x] T041 [US4] Review the refusal paths in `GoogleSignInHandler` and `IdentityExternalAccountService` so each refusal (admin, locked, deleted, unverified, email linked to another `sub`) returns `InvalidCredentials` and writes `ExternalSignInFailed`, with the entity set to the user id only when known and the actor null. Files: `backend/src/TutorMatching.Application/Authentication/Google/GoogleSignInHandler.cs`, `backend/src/TutorMatching.Infrastructure/Authentication/IdentityExternalAccountService.cs`

**Checkpoint**: The US4 independent test passes; the full Google suite is green.

---

## Phase 7: Polish & Cross-Cutting

- [ ] T042 [P] Playwright journeys with `window.google` stubbed and the Google endpoints mocked, in `frontend/tests/e2e/google-auth.spec.ts`:
  - login via Google (US1);
  - register via Google as a student and as a tutor (US2);
  - generic refusal (US4).
- [ ] T043 [P] Add both operations to the API map in `docs/PROJECT-MAP.md` §4, and add a Google flow note under §3.1
- [ ] T044 Run every check and manual scenario in `specs/010-google-oauth/quickstart.md` and record exact pass/fail evidence in `specs/010-google-oauth/evidence.md`
- [ ] T045 Run `npm --prefix frontend run lint`, `npm --prefix frontend run build` and `dotnet test backend/TutorMatching.slnx`; confirm no new failures compared with the baseline in `docs/agent-memory/SESSION.md`
- [ ] T046 Run `$speckit-converge` for `specs/010-google-oauth/tasks.md`, then update `docs/agent-memory/PROJECT.md` (Google sign-in facts and config keys) and add an ADR on the ID-token flow and auto-link policy to `docs/agent-memory/DECISIONS.md`

---

## Dependencies & Execution Order

- Setup (T001–T003) → Foundational (T004–T016) → stories.
- US1 (Phase 3) is the base. US2 depends on T019/T020/T022/T024 from US1. US3 and US4 depend only on Foundational plus T020–T022, so they can run in parallel with US2.
- Polish runs after the desired stories are complete.

```text
Setup → Foundational → US1 ─┬─► US2
                            ├─► US3
                            └─► US4 ──► Polish
```

## Parallel Examples

- Foundational: T005, T006, T009, T012, T013, T014, T015 and T016 touch different files.
- US1: T017, T018, T023 and T026 in parallel; then T019 → T020 → T021 → T022; T024 → T025.
- US2: T027, T028, T029 and T034 in parallel; then T030 → T031 → T032 → T033; T035 → T036.
- US3 (T038/T039) and US4 (T040/T041) can be done by a second developer once US1 is in.

## Implementation Strategy

1. **MVP slice**: Setup + Foundational + US1, which proves verification and session issuance end to end with a pre-linked account.
2. Add US2 so new visitors can actually use Google (the first release candidate).
3. Add US3 and US4, the security guardrails required before deploying.
4. Run the Polish phase with evidence, then deploy with the Google Console origins configured.
