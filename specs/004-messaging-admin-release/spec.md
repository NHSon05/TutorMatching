# Feature Specification: Messaging, Administration and MVP Release

**Feature Directory**: `004-messaging-admin-release`

**Created**: 2026-10-02

**Status**: Ready for clarification or planning

**Input**: Sprint 4 completes the MVP with request-scoped conversations, notifications,
administrative controls, dashboard and audit visibility, then validates the full product for
demonstration and handover.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Exchange request messages (Priority: P1)

As a learner or tutor participating in a hire request, I want to exchange messages in its
conversation so that our communication remains connected to the correct request.

**Why this priority**: Request-scoped communication is required for the complete learner-tutor
journey and SRS acceptance AC-06.

**Independent Test**: Exchange messages as both request participants, page through history, mark
messages read and verify that unrelated accounts cannot view or send in the conversation.

**Acceptance Scenarios**:

1. **Given** a request participant, **When** its conversation is opened, **Then** messages appear in
   stable chronological order with sender, sent time and read state.
2. **Given** a participant submits valid non-empty content, **When** the message is sent, **Then** it
   is stored once and the other participant receives a new-message notification.
3. **Given** the recipient opens unread messages, **When** they are displayed, **Then** those
   messages are marked read without changing the sender's messages.
4. **Given** an unrelated account, **When** it requests or posts to the conversation directly,
   **Then** access is denied and no conversation content is disclosed.

---

### User Story 2 - Follow relevant notifications (Priority: P1)

As an authenticated user, I want a notification center for request, review and message events so
that I can notice changes and navigate to relevant work.

**Why this priority**: Users otherwise have no reliable way to discover incoming actions.

**Independent Test**: Generate each supported notification type, open one, mark individual and all
items read, and verify behavior when the referenced object is no longer available.

**Acceptance Scenarios**:

1. **Given** notifications for a user, **When** the center opens, **Then** newest items and unread
   count are displayed without showing another user's items.
2. **Given** a notification with an available reference, **When** it is opened, **Then** it is marked
   read and the user reaches the authorized related object.
3. **Given** a hidden or unavailable reference, **When** its notification is opened, **Then** the
   notification remains understandable but does not navigate to inaccessible content.
4. **Given** multiple unread notifications, **When** the user marks all read, **Then** their unread
   count becomes zero without changing another user's notifications.

---

### User Story 3 - Administer users safely (Priority: P1)

As an administrator, I want to find, lock and unlock accounts so that policy violations or access
problems can be handled without deleting business history.

**Why this priority**: Account control is the main administrative security safeguard.

**Independent Test**: Search accounts, lock and unlock a target account, attempt self-lock and
verify access effects, preserved history, confirmation and audit records.

**Acceptance Scenarios**:

1. **Given** an administrator and a target user, **When** account status is changed after
   confirmation, **Then** the new status is enforced and the action is auditable.
2. **Given** a locked account, **When** it attempts a new authenticated session, **Then** access is
   denied while its requests and messages remain retained.
3. **Given** an administrator targets their own active account for locking, **When** the action is
   submitted, **Then** it is rejected.
4. **Given** a non-administrator, **When** an administration action is called directly, **Then** it
   is denied and no data changes.

---

### User Story 4 - Manage public content and monitor requests (Priority: P2)

As an administrator, I want to manage articles and reference categories and monitor hire requests
so that public information stays useful and operational problems can be investigated.

**Why this priority**: It completes the SRS administration scope without allowing administrators
to rewrite participant agreements.

**Independent Test**: Create, edit, publish and hide an article; deactivate an in-use category;
filter request monitoring data; and verify history and permission boundaries.

**Acceptance Scenarios**:

1. **Given** valid article content, **When** an administrator saves, publishes or hides it, **Then**
   the selected state and publication time are reflected publicly as appropriate.
2. **Given** an in-use subject or category, **When** an administrator removes it, **Then** it becomes
   inactive rather than breaking referenced history.
3. **Given** existing hire requests, **When** an administrator filters the monitoring view, **Then**
   matching status and participant summaries are shown without private conversation content.
4. **Given** a monitored request, **When** an administrator views it, **Then** they cannot alter
   price, schedule or participant decisions through the monitoring function.

---

### User Story 5 - Review dashboard and audit activity (Priority: P2)

As an administrator, I want a concise dashboard and audit history so that I can understand product
activity and investigate significant administrative changes.

**Why this priority**: The dashboard and audit trail provide operational visibility required for
MVP administration and demonstration.

**Independent Test**: Compare dashboard totals with seeded source records, filter an audit list and
verify that required actions are present without secrets or private content.

**Acceptance Scenarios**:

1. **Given** data in multiple roles and states, **When** the dashboard opens, **Then** it shows user
   counts by role, tutor-profile counts by state and hire-request counts by state.
2. **Given** no data for a metric, **When** the dashboard opens, **Then** the metric displays zero
   rather than an error.
3. **Given** profile review, account status and category/content changes, **When** audit history is
   queried, **Then** actor, action, entity identifier and time are available.
4. **Given** any audit or error record, **When** it is inspected, **Then** credentials, private
   messages and private profile content are absent.

---

### User Story 6 - Demonstrate and hand over the MVP (Priority: P1)

As the project team and evaluator, we want the complete core journey to run reliably with clear
documentation so that the MVP can be accepted, demonstrated, deployed and recovered.

**Why this priority**: Sprint 4 is complete only when the integrated product is demonstrably usable,
not merely when isolated features exist.

**Independent Test**: Starting from documented setup and sample data, execute the complete
registration-to-completion journey, administration checks, backup/restore exercise and supported
browser checks without undocumented intervention.

**Acceptance Scenarios**:

1. **Given** a clean supported environment, **When** the documented setup is followed, **Then** the
   system starts with safe sample data and exposes the expected health and usage paths.
2. **Given** representative learner, tutor and administrator accounts, **When** the end-to-end demo
   is run, **Then** every MVP acceptance criterion can be observed without a critical defect.
3. **Given** desktop and mobile-sized supported browsers, **When** primary flows are exercised,
   **Then** content remains usable, keyboard-operable and includes loading, empty, error and
   confirmation states.
4. **Given** a recent backup in the demonstration environment, **When** the recovery procedure is
   followed, **Then** the documented recoverable data is restored and validated.

### Edge Cases

- Two messages share the same sent time or a send operation is retried after an uncertain response.
- A user is removed from eligibility or locked while a conversation is open.
- A conversation contains enough messages to require multiple pages while new messages arrive.
- A notification points to a deleted, hidden or unauthorized object.
- Two administrators update the same account, article or category concurrently.
- An administrator attempts to lock themselves or deactivate the last usable administrative path.
- Dashboard source data changes while totals are being calculated.
- Sample, audit or error data accidentally includes real personal information or a secret.
- Notification delivery fails while the related business operation succeeds.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every successful hire request MUST have exactly one conversation associated with it.
  *(Source: SRS FR-12, BR-08)*
- **FR-002**: Only the learner and tutor belonging to a request MAY read or send messages in its
  conversation; administrator access is limited to explicitly authorized violation handling.
  *(Source: SRS section 4.1, matrix 4.3, UC-12)*
- **FR-003**: A valid message MUST contain non-empty content within a defined length limit and MUST
  record sender and sent time. *(Source: SRS UC-12)*
- **FR-004**: Conversation history MUST use stable pagination and chronological ordering by time
  and unique identity. *(Source: SRS UC-12, section 7.2)*
- **FR-005**: Opening received messages MUST update their read state, and message submission retries
  MUST NOT create duplicate visible messages. *(Source: SRS UC-12)*
- **FR-006**: A newly stored message MUST create a notification for the other participant; delivery
  failure MUST NOT discard the stored message. *(Source: SRS FR-13, UC-12, section 7.5)*
- **FR-007**: Authenticated users MUST see only their own notifications ordered newest first with an
  unread count and stable pagination. *(Source: SRS FR-13, UC-13)*
- **FR-008**: Users MUST be able to mark one notification or all their notifications as read.
  *(Source: SRS UC-13)*
- **FR-009**: Opening a notification MUST navigate only when the referenced object still exists and
  the user remains authorized; otherwise it MUST show a safe unavailable state. *(Source: SRS
  UC-13 alternative A1)*
- **FR-010**: Administrators MUST be able to search and inspect user accounts and lock or unlock a
  target account after confirmation. *(Source: SRS FR-14, UC-14)*
- **FR-011**: The system MUST prevent an administrator from locking their own current account and
  MUST preserve the locked user's referenced requests and messages. *(Source: SRS BR-13, UC-14)*
- **FR-012**: Locking an account MUST prevent new authenticated use and remove its tutor profile
  from public discovery without erasing history. *(Source: SRS BR-01, BR-13)*
- **FR-013**: Administrators MUST be able to create, edit, publish and hide articles, retaining
  author, state and publication time. *(Source: SRS FR-14, UC-14)*
- **FR-014**: Administrators MUST be able to activate or deactivate in-use subjects and reference
  categories but MUST NOT hard-delete referenced values. *(Source: SRS UC-14 alternative A1)*
- **FR-015**: Administrators MUST be able to filter and inspect hire-request status summaries for
  monitoring without altering participant-agreed price, schedule or lifecycle actions. *(Source:
  SRS FR-14, matrix 4.3)*
- **FR-016**: The dashboard MUST show user counts by role, tutor-profile counts by state and
  hire-request counts by state, with zero values when no matching data exists. *(Source: SRS FR-15,
  UC-15)*
- **FR-017**: Account lock/unlock, profile review and reference/content administration MUST create
  audit records containing actor, action, entity identity and time. *(Source: SRS section 4.1,
  NFR-10)*
- **FR-018**: Logs and audit records MUST exclude passwords, tokens, private messages, private
  profile content and exact personal contact details. *(Source: SRS section 4.2, NFR-10, AC-09)*
- **FR-019**: Primary pages MUST be responsive, keyboard-operable, consistently labeled and provide
  loading, empty, error and confirmation states without relying on color alone. *(Source: SRS
  NFR-05, NFR-06, sections 7.1 and 7.3)*
- **FR-020**: The complete MVP MUST include documented setup, configuration, sample-data,
  deployment, backup, recovery and demonstration procedures that contain no real personal data or
  secrets. *(Source: SRS NFR-09, sections 4.2, 7.4, 8.2, AC-10)*
- **FR-021**: System acceptance MUST cover AC-01 through AC-10, including negative authorization,
  privacy, concurrency, browser compatibility and recovery evidence. *(Source: SRS NFR-06,
  NFR-08, AC-01 through AC-10)*
- **FR-022**: The complete core demo from registration through approved discovery, hire request,
  negotiation, messaging and final state MUST run with sample data and no critical failure.
  *(Source: SRS AC-10)*

### Key Entities

- **Conversation**: The single communication container associated with one hire request and its two
  participants.
- **Message**: Participant-authored content with stable identity, sent time and recipient read time.
- **Notification**: A user-owned event with type, title, safe reference, read state and creation
  time.
- **Article**: Administrator-authored public content with draft, published or hidden lifecycle.
- **Audit Event**: A secret-free record of a significant administrative action.
- **Dashboard Snapshot**: Read-only counts grouped by user role, profile state and request state for
  a selected point or period.
- **Release Evidence**: Reproducible records showing setup, tests, acceptance, compatibility,
  performance and recovery outcomes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Authorized participants exchange and read messages successfully in 100% of the core
  journey tests, while unrelated accounts retrieve zero conversation content.
- **SC-002**: Every supported request, review and message event creates at most one visible
  notification per intended recipient, and read counts remain correct in retry tests.
- **SC-003**: Account, article, category and monitoring operations pass all role, confirmation,
  history-preservation and audit acceptance cases.
- **SC-004**: Dashboard counts match the acceptance dataset exactly for every supported role and
  state, including zero-data cases.
- **SC-005**: No credential, token, private message, private profile field or exact contact detail
  appears in public responses, audit evidence or collected test logs.
- **SC-006**: At least 95% of ordinary MVP pages complete within three seconds under 100 concurrent
  demonstration users, and primary flows remain usable on all SRS-supported browsers.
- **SC-007**: All ten MVP acceptance criteria pass from a clean documented setup with no unresolved
  critical defect.
- **SC-008**: A team member unfamiliar with the environment can start the application, load sample
  data, run the demo and perform the documented backup/recovery check using only handover guidance.

## Assumptions

- Sprint 1 account controls, Sprint 2 discovery and Sprint 3 request lifecycle are complete and
  retain compatible states and ownership rules.
- Messaging is near-real-time from a user's perspective, but a specific transport is a planning
  decision rather than a specification requirement.
- Administrator conversation access is disabled by default and allowed only for a separately
  authorized violation-handling workflow; broad message browsing is not part of MVP.
- Articles require basic text content and lifecycle management; rich collaborative editing,
  comments and media publishing are outside scope.
- Dashboard metrics are operational counts, not a general analytics platform.
- Payment, video calls, maps, mobile applications, AI recommendations, automated credential
  verification, disputes and refunds remain outside the MVP.
