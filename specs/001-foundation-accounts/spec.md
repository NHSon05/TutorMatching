# Feature Specification: Foundation and Accounts

**Feature Directory**: `001-foundation-accounts`

**Created**: 2026-10-02

**Status**: Ready for planning

**Input**: Sprint 1 establishes the project foundation and delivers secure account registration,
login, logout, role-based access, personal profile management, and password reset according to
FR-01, FR-02, UC-01 through UC-03, NFR-04, NFR-08, NFR-10, AC-01, and AC-09.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Register an account (Priority: P1)

As a visitor, I want to register as a learner or tutor so that I can access the capabilities for
my chosen role.

**Why this priority**: Registration creates the identity required by every authenticated MVP flow.

**Independent Test**: Register one learner and one tutor using previously unused emails, then verify
that each account can be identified by its selected role without exposing credential data.

**Acceptance Scenarios**:

1. **Given** a visitor supplies a unique email, full name, matching valid passwords, and an allowed
   role, **When** registration is submitted, **Then** an active account is created and the visitor is
   directed to sign in or continue profile setup.
2. **Given** an email already belongs to an account, **When** the same normalized email is submitted,
   **Then** no second account is created and the email field reports a conflict.
3. **Given** invalid or missing data, **When** registration is submitted, **Then** field-level errors
   are shown and no account is created.
4. **Given** a visitor selects or submits the administrator role, **When** registration is submitted,
   **Then** the request is rejected and no administrator account is created.

---

### User Story 2 - Sign in and end a session (Priority: P1)

As a registered user, I want to sign in and sign out securely so that I control access to my
account.

**Why this priority**: Authenticated access and reliable session termination are prerequisites for
all protected features.

**Independent Test**: Sign in with an active account, access one protected capability, sign out,
then verify that the same session can no longer access that capability.

**Acceptance Scenarios**:

1. **Given** an active account and correct credentials, **When** the user signs in, **Then** an
   expiring authenticated session is created and the user enters the application with the correct
   role.
2. **Given** an incorrect email or password, **When** sign-in is attempted, **Then** access is denied
   with a generic response that does not reveal whether the email exists.
3. **Given** a locked or inactive account, **When** sign-in is attempted, **Then** access is denied
   and no authenticated session is created.
4. **Given** an authenticated session, **When** the user signs out, **Then** that session is revoked
   and cannot be reused.
5. **Given** repeated failed sign-in attempts, **When** the configured threshold is reached, **Then**
   further attempts are temporarily limited without permanently deleting or changing the account.

---

### User Story 3 - Access only authorized data (Priority: P1)

As an account holder, I want the system to enforce my role and ownership so that other users cannot
view or modify my private data.

**Why this priority**: Authorization is a security boundary for every protected user journey.

**Independent Test**: Attempt a protected action as a visitor, as a signed-in user with the wrong
role, and as a different account owner; verify denial in all three cases and no data change.

**Acceptance Scenarios**:

1. **Given** an unauthenticated visitor, **When** a private capability is requested, **Then** the
   request is denied and the visitor is prompted to sign in.
2. **Given** an authenticated user with the wrong role, **When** a role-restricted capability is
   requested, **Then** the request is denied.
3. **Given** an authenticated user attempts to modify another account's profile, **When** the
   operation is submitted, **Then** it is denied and the target profile remains unchanged.
4. **Given** a user interface hides an unauthorized action, **When** its underlying operation is
   called directly, **Then** the same authorization rule still denies the operation.

---

### User Story 4 - Manage a personal profile (Priority: P2)

As a learner or tutor, I want to view and update my personal profile so that my account information
remains accurate without becoming public.

**Why this priority**: Personal details support later tutor and hiring flows but are not required to
prove registration and authentication first.

**Independent Test**: Sign in as one account, update allowed personal fields, reload the profile,
and confirm the changes while verifying that another account cannot read or alter them.

**Acceptance Scenarios**:

1. **Given** an authenticated learner or tutor, **When** the personal profile is opened, **Then** the
   user's permitted private fields are displayed.
2. **Given** valid changes to allowed fields, **When** the profile is saved, **Then** the changes are
   persisted and displayed after reload.
3. **Given** a duplicate email or phone number, **When** the profile is saved, **Then** the conflict
   is reported and the previous valid data remains unchanged.
4. **Given** an expired session, **When** a profile change is submitted, **Then** the change is not
   saved and the user is asked to sign in again.

---

### User Story 5 - Reset a forgotten password (Priority: P3)

As a user who forgot a password, I want a time-limited reset process so that I can regain access
without exposing whether an account exists.

**Why this priority**: Account recovery improves completeness but the core registration and sign-in
journeys can be demonstrated independently first.

**Independent Test**: Request a reset, complete it once with a valid unexpired reset credential,
then verify that it cannot be reused and the new password permits sign-in.

**Acceptance Scenarios**:

1. **Given** any syntactically valid email, **When** a reset is requested, **Then** the visible
   response is the same whether or not an account exists.
2. **Given** a valid unexpired unused reset credential and a valid new password, **When** reset is
   submitted, **Then** the password changes and the reset credential becomes unusable.
3. **Given** an expired, invalid, or previously used reset credential, **When** reset is submitted,
   **Then** the password remains unchanged.
4. **Given** a successful password reset, **When** the new password is used, **Then** sign-in succeeds
   and the old password no longer succeeds.

### Edge Cases

- Two registration requests submit the same normalized email concurrently.
- A session expires while a profile form is open and is submitted afterward.
- A user signs out in one browser tab while another tab still displays private data.
- Multiple reset requests are made before earlier reset credentials expire.
- A reset request is made for a locked or inactive account.
- A client submits a role value that is not one of the supported account roles.
- A profile update includes empty optional values, malformed dates, oversized text, or a duplicate
  phone number.
- Authentication or email delivery is temporarily unavailable after the primary account operation.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST allow visitors to register exactly one account per normalized email as
  either a learner or tutor. _(Source: SRS FR-01, UC-01, AC-01)_
- **FR-002**: Public registration MUST reject administrator and unknown roles. _(Source: SRS FR-02,
  UC-01)_
- **FR-003**: Registration MUST require full name, email, a password of at least eight characters,
  and matching password confirmation. _(Source: SRS UC-01, section 4.1)_
- **FR-004**: The system MUST protect stored passwords so that the original password cannot be
  recovered or displayed. _(Source: SRS NFR-04, UC-01)_
- **FR-005**: A successfully registered account MUST start in the active state. _(Source: SRS UC-01)_
- **FR-006**: The system MUST authenticate an active account using email and password and create an
  expiring session on success. _(Source: SRS FR-01, UC-02, section 4.1)_
- **FR-007**: Failed authentication MUST use a generic response that does not disclose whether an
  email exists. _(Source: SRS UC-02, section 4.2)_
- **FR-008**: Locked and inactive accounts MUST NOT receive authenticated sessions. _(Source: SRS
  UC-02, account states)_
- **FR-009**: Signing out MUST revoke the current session so that it cannot authorize a later
  request. _(Source: SRS UC-02, section 4.1)_
- **FR-010**: Repeated failed sign-in attempts MUST be temporarily limited according to a configured
  policy. _(Source: SRS section 4.1)_
- **FR-011**: Every protected operation MUST enforce authentication, role, and ownership rules on
  the server side. _(Source: SRS FR-02, sections 4.1 and 4.3, AC-01, AC-09)_
- **FR-012**: Learners and tutors MUST be able to view and update only their own allowed personal
  profile fields. _(Source: SRS FR-01, UC-03)_
- **FR-013**: Profile updates MUST reject invalid or duplicate email/phone values without partially
  applying the change. _(Source: SRS UC-03)_
- **FR-014**: Personal email, phone, birth date, and exact address MUST NOT be exposed through public
  account or profile views. _(Source: SRS section 4.2, AC-09)_
- **FR-015**: Password-reset requests MUST provide the same visible response for existing and
  non-existing accounts. _(Source: SRS FR-01, section 4.1)_
- **FR-016**: A password-reset credential MUST expire, be single-use, and become invalid after a
  successful reset. _(Source: SRS FR-01, section 4.1)_
- **FR-017**: Authentication, authorization, and password-reset logs MUST exclude passwords, reset
  credentials, session credentials, and private profile content. _(Source: SRS NFR-10, section 4.2)_
- **FR-018**: Forms MUST show field-level validation, preserve valid input after validation errors,
  and provide loading, error, success, and access-denied states. _(Source: SRS sections 7.1, 7.3)_
- **FR-019**: The feature MUST provide automated checks for registration, authentication, session
  revocation, role denial, ownership denial, profile conflicts, and password-reset failure paths.
  _(Source: SRS NFR-08, AC-01, AC-09)_

### Key Entities

- **User Account**: A person's identity, normalized email, protected password, personal fields,
  single business role, account state, and lifecycle timestamps.
- **Authenticated Session**: A revocable, expiring authorization context belonging to one account.
- **Password Reset Credential**: A short-lived, single-use recovery credential belonging to one
  account without exposing the credential itself in stored or logged data.
- **Audit Event**: A timestamped record of security-relevant or administrative activity that omits
  secrets and private content.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A new learner or tutor can complete valid registration in no more than two minutes.
- **SC-002**: All supported account roles reach only their permitted navigation and protected
  capabilities in acceptance testing, with zero successful cross-account profile updates.
- **SC-003**: Signing out or allowing a session to expire prevents reuse in 100% of acceptance tests.
- **SC-004**: Existing and non-existing account reset requests are indistinguishable from the
  requester's perspective in 100% of enumeration tests.
- **SC-005**: No password, session credential, reset credential, email, phone, birth date, or exact
  address appears in public responses or test logs.
- **SC-006**: At least 95% of ordinary account pages complete their response within three seconds
  under the SRS demonstration load of up to 100 concurrent users.
- **SC-007**: The registration, sign-in/sign-out, authorization, profile, and password-reset journeys
  each pass their independent acceptance test without relying on a later sprint feature.

## Assumptions

- The learner role is the single canonical role for both parents and students in shared MVP flows;
  its persisted spelling is finalized during planning before migrations are created.
- Each account has exactly one primary business role in the MVP.
- Email is the account identifier and is compared after normalization.
- Password reset may use an SMTP sandbox in development and demonstration environments.
- An administrator demo account is created through controlled seed data, never public registration.
- Users have internet access and a current supported web browser.
- Online payment, tutor recommendation AI, tutor professional profiles, search, hiring,
  negotiation, messaging, notifications, and full administration are outside this feature.
