# Feature Specification: Sign In and Register with Google

**Feature Directory**: `010-google-oauth`

**Created**: 2026-11-14

**Status**: Ready for planning

**Input**: Let learners and tutors sign in and register with their Google account (OAuth2 / OpenID
Connect) in addition to email and password. Decisions confirmed by the product owner on 2026-11-14:
an existing account with the same verified email is linked automatically; administrators cannot use
Google sign-in; the Google profile picture becomes the avatar of a newly registered account; this
feature is prioritized ahead of the remaining Sprint 1/4 MVP gaps.

**Traceability**: Extends SRS FR-01 (registration) and FR-02 (authentication) and the account
journeys of `specs/001-foundation-accounts`. Not part of the original SRS MVP; accepted as an
approved change request on 2026-11-14 (constitution principles I and V).

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Sign in with a linked Google account (Priority: P1)

As a learner or tutor whose account is already connected to Google, I want to sign in with one click
on "Continue with Google" so that I do not need to remember a separate password.

**Why this priority**: Returning-user sign-in is the most frequent use of the feature and proves the
end-to-end identity verification and session issuance.

**Independent Test**: With an active learner account already linked to a Google identity, choose
"Continue with Google" on the sign-in page, then verify the user lands on the same destination as a
password sign-in and that protected pages accept the session.

**Acceptance Scenarios**:

1. **Given** an active learner or tutor account linked to a Google identity, **When** the user
   completes Google sign-in, **Then** a session is started exactly as with a password sign-in and the
   user is directed to their role's home page (tutors with an unapproved profile go to onboarding).
2. **Given** a user signed in with Google, **When** they sign out, **Then** the session is ended and
   protected pages require signing in again.
3. **Given** the user closes or cancels the Google window, **When** they return to the page,
   **Then** no session is created and they can retry or use email and password.

---

### User Story 2 - Register a new account with Google (Priority: P1)

As a visitor without an account, I want to register using Google and choose whether I am a learner
or a tutor so that I can start using the platform without filling in a registration form.

**Why this priority**: Converting new visitors is the main business value of social sign-in.

**Independent Test**: Using a Google identity whose email is not registered, choose "Continue with
Google", select a role, and verify an active account with that role, the Google name, email, and
picture is created and signed in.

**Acceptance Scenarios**:

1. **Given** a verified Google identity whose email has no account, **When** the visitor completes
   Google sign-in, **Then** a dialog asks them to choose Learner or Tutor before creating anything.
2. **Given** the role step is shown, **When** the visitor chooses Learner, **Then** an active
   learner account is created with the Google full name, email, and profile picture, and the visitor
   is signed in.
3. **Given** the role step is shown, **When** the visitor chooses Tutor, **Then** an active tutor
   account with a draft tutor profile is created and the visitor is signed in and directed to tutor
   onboarding.
4. **Given** the role step is shown, **When** the visitor abandons it or waits longer than 10 minutes,
   **Then** no account exists and restarting Google sign-in begins the flow again.

---

### User Story 3 - Link Google to an existing email and password account (Priority: P2)

As a user who registered with email and password, I want "Continue with Google" with the same email
to open my existing account so that I do not end up with two accounts.

**Why this priority**: Prevents duplicate accounts and data split, but only affects users who
already registered by password.

**Independent Test**: Register an account by email and password, then complete Google sign-in with a
verified Google identity using the same email; verify the user is signed into the original account
(same role, history, and profile) and that both sign-in methods continue to work.

**Acceptance Scenarios**:

1. **Given** an active learner or tutor account registered with a password and a verified Google
   identity with the same email (ignoring letter case), **When** the user completes Google sign-in,
   **Then** the Google identity is linked to that account, the user is signed in, and no role step is
   shown.
2. **Given** an account was linked, **When** the user later signs in with their password, **Then** the
   password still works.
3. **Given** the existing account already has an avatar, **When** it is linked to Google, **Then** the
   existing avatar is kept.

---

### User Story 4 - Block disallowed Google sign-ins (Priority: P2)

As the platform operator, I want Google sign-in refused for administrators, locked or deleted
accounts, and unverified Google emails so that social sign-in does not weaken account security.

**Why this priority**: Security guardrails required before release, but they protect rather than
add a user journey.

**Independent Test**: Attempt Google sign-in with (a) the email of an administrator, (b) the email of
a locked account, and (c) a Google identity with an unverified email; verify each is refused with the
same generic message, no session is created, and the attempt is audited.

**Acceptance Scenarios**:

1. **Given** an administrator account, **When** Google sign-in is attempted with its email, **Then**
   sign-in is refused, no link is created, and the administrator must use email and password.
2. **Given** a locked or deleted account, **When** Google sign-in is attempted for it, **Then** sign-in
   is refused with the same generic message used for other refusals.
3. **Given** a Google identity whose email is not verified by Google, **When** sign-in is attempted,
   **Then** it is refused and no account is created or linked.
4. **Given** a visitor on the role step, **When** they attempt to choose the administrator role by any
   means, **Then** the request is rejected.

---

### Edge Cases

- The Google service is unavailable or returns an invalid or expired credential: sign-in is refused
  with a retryable message; email and password sign-in remains available.
- The same new Google identity completes the role step twice at the same time (two tabs): exactly one
  account is created and both tabs end signed into it, or the second receives a conflict and can sign
  in normally.
- The user changes their email at Google after linking: the account stays linked because linking uses
  Google's stable identity, not the email.
- A Google identity is presented for an email that belongs to an account already linked to a
  different Google identity: sign-in is refused; no second link is added automatically.
- An account created through Google (no password) tries password sign-in: it receives the standard
  invalid-credentials response without revealing that the account is Google-only.
- The Google display name is empty or longer than the allowed full-name length: the name is derived
  from the email local part or truncated to the limit; the user can edit it later in their profile.
- The Google picture is missing: the account is created without an avatar.
- Repeated failed Google attempts from one client: rate limiting applies as for password sign-in.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The sign-in page and the registration page MUST offer "Continue with Google" alongside
  the existing email and password forms.
- **FR-002**: The system MUST accept a Google identity only after verifying that it was issued by
  Google for this application, is unexpired, and carries a Google-verified email.
- **FR-003**: The system MUST identify a returning Google user by Google's stable account identifier,
  not by email.
- **FR-004**: When the Google identity is already linked to an active learner or tutor account, the
  system MUST start a session identical in lifetime, renewal, revocation, and protection to a
  password session.
- **FR-005**: When no link exists but an active learner or tutor account has the same email
  (case-insensitive), the system MUST link the Google identity to that account and sign the user in.
- **FR-006**: When no account has the email, the system MUST NOT create an account until the visitor
  selects Learner or Tutor in a role dialog (Learner covers students and parents).
- **FR-007**: The pending role selection MUST expire after 10 minutes, MUST be tamper-proof, and
  MUST be usable only for the Google identity that started it.
- **FR-008**: A new Google account MUST be created active, with the Google full name, email, and
  profile picture, and without a password; a tutor account MUST also receive a draft tutor profile,
  created atomically with the account.
- **FR-009**: Linking MUST NOT overwrite an existing account's avatar, name, role, or password.
- **FR-010**: Google sign-in MUST be refused for administrator accounts, locked or deleted accounts,
  unverified Google emails, and emails whose account is linked to a different Google identity.
- **FR-011**: All refusals MUST use one generic message that does not reveal whether an account
  exists, its role, or its status.
- **FR-012**: The administrator role MUST NOT be selectable or accepted in the Google registration
  step.
- **FR-013**: Password sign-in for an account without a password MUST return the standard
  invalid-credentials response.
- **FR-014**: Google sign-in, linking, and registration requests MUST be protected against
  cross-site request forgery and rate-limited at the same level as password sign-in.
- **FR-015**: The system MUST record audit events for successful Google sign-in, Google linking,
  Google registration, and refused Google sign-in, without storing Google credentials, tokens, or
  personal content in audit data or logs.
- **FR-016**: Cancelling or failing the Google step MUST leave the user on the page with no session
  and the ability to retry or use email and password.
- **FR-017**: After Google sign-in or registration, the user MUST be redirected exactly as after a
  password sign-in for the same role and tutor-profile status.
- **FR-018**: Concurrent completion of the role step for the same Google identity MUST NOT create
  more than one account or link.
- **FR-019**: Public tutor responses MUST continue to exclude email; the Google email is private
  account data.

### Key Entities _(include if feature involves data)_

- **External login link**: Connects one account to one Google identity; holds the provider name
  ("Google") and Google's stable account identifier; unique per provider identifier; at most one
  Google link per account.
- **Pending Google registration**: Short-lived, tamper-proof proof that a verified Google identity
  (identifier, email, name, picture) is waiting for a role choice; expires after 10 minutes; not
  stored as an account.
- **Account audit event**: Existing audit record, extended with Google sign-in succeeded, Google
  linked, Google registration, and Google sign-in refused actions.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A returning linked user completes Google sign-in in under 10 seconds from clicking
  "Continue with Google", excluding time spent on Google's own screens.
- **SC-002**: A new visitor completes Google registration, including the role choice, in under
  1 minute.
- **SC-003**: 100% of refusal scenarios in User Story 4 produce no session, no link, no new account,
  and an identical user-facing message.
- **SC-004**: Repeating Google sign-in with an email that already has a password account never
  creates a second account (0 duplicates across all acceptance tests).
- **SC-005**: Concurrent role-step completion for one Google identity results in exactly one account
  in 100% of test runs.
- **SC-006**: Audit and application logs contain zero Google credentials or tokens after running the
  full acceptance suite.
- **SC-007**: Existing email and password sign-in, registration, refresh, and sign-out acceptance
  tests continue to pass unchanged.

## Assumptions

- Google is the only external identity provider in this feature; others are out of scope.
- The feature targets the existing web application only; native mobile sign-in is out of scope.
- A Google-verified email is trusted as proof of email ownership for automatic linking.
- Google-only accounts set a password only through a future password-reset flow; adding or removing
  a password, and unlinking Google from the profile page, are out of scope.
- The Google picture is stored as a reference to Google's image, not copied into platform storage.
- The Google name is used as the full name; the user can edit it in the existing profile page.
- Administrators continue to sign in only with email and password.
- The existing session, cookie, CSRF, rate-limit, and audit mechanisms are reused.
- The Google application configuration (client registration, allowed origins for local and deployed
  frontends) is provided by the team through environment configuration.
