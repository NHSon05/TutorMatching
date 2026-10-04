# Feature Specification: Hire Requests and Negotiation

**Feature Directory**: `003-hire-negotiation`

**Created**: 2026-10-02

**Status**: Ready for clarification or planning

**Input**: Sprint 3 enables learners to send hire requests to available tutors, both parties to
negotiate price and schedule, and authorized participants to move each request through a consistent
and auditable lifecycle.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Send a hire request (Priority: P1)

As a learner, I want to send a complete request to an available tutor so that the tutor can decide
whether to teach me under the proposed schedule and price.

**Why this priority**: Creating a valid request is the entry point for every Sprint 3 workflow.

**Independent Test**: Submit one valid request from an approved tutor detail, retry the same
submission, and verify one request, one related conversation and one tutor notification exist.

**Acceptance Scenarios**:

1. **Given** an authenticated learner and an approved active tutor, **When** valid course or subject,
   start date, schedule, weekly frequency, duration, mode, location and price are submitted,
   **Then** one uniquely identified request is created in the correct initial state.
2. **Given** a request at the listed price, **When** it is created, **Then** its initial state is
   `PENDING`; **Given** a different valid proposed price, **Then** it starts as `NEGOTIATING`.
3. **Given** a repeated submission caused by retry or double-click, **When** it carries the same
   submission identity, **Then** no duplicate request, conversation or notification is created.
4. **Given** invalid or stale schedule data, **When** submission is attempted, **Then** no partial
   request is created and the affected fields are identified.

---

### User Story 2 - Review and respond to received requests (Priority: P1)

As a tutor, I want to list, inspect, accept or reject requests addressed to me so that I can manage
my teaching commitments.

**Why this priority**: A request has no value until the designated tutor can act on it.

**Independent Test**: As the addressed tutor, inspect and accept one pending request and reject
another; verify permissions, reason rules, status history and learner notifications.

**Acceptance Scenarios**:

1. **Given** requests addressed to a tutor, **When** the tutor opens their request list, **Then** only
   relevant requests and their current states are visible.
2. **Given** a request in an allowed state, **When** its designated tutor accepts it, **Then** the
   final agreed price and schedule are recorded and status becomes `ACCEPTED`.
3. **Given** a request in an allowed state, **When** its designated tutor rejects it with a reason,
   **Then** status becomes `REJECTED` and the learner is notified.
4. **Given** another tutor or unrelated learner, **When** they attempt the same actions directly,
   **Then** access is denied and state remains unchanged.

---

### User Story 3 - Negotiate price and schedule (Priority: P1)

As either party to a request, I want to send and respond to revised proposals so that we can reach
an explicit agreement without losing earlier offers.

**Why this priority**: Negotiation is a required differentiator between a listed price and a final
teaching agreement.

**Independent Test**: Exchange alternating proposals, accept the latest proposal, then verify the
full ordered history and immutable final agreement.

**Acceptance Scenarios**:

1. **Given** a `PENDING` or `NEGOTIATING` request, **When** one party proposes a valid price,
   schedule or both, **Then** a new immutable version records sender, values, note and time.
2. **Given** a new proposal, **When** it is saved, **Then** the other party is notified and the
   request is `NEGOTIATING`.
3. **Given** the latest proposal, **When** the receiving party accepts it, **Then** its price and
   schedule become the final agreement and status becomes `ACCEPTED`.
4. **Given** a closed request, **When** either party attempts another proposal, **Then** it is
   rejected without changing history.

---

### User Story 4 - Track request status and history (Priority: P2)

As a learner or tutor, I want to view my request lists, details and ordered status history so that I
understand the current agreement and what happened previously.

**Why this priority**: Transparent state and history reduce mistakes and enable support or audit.

**Independent Test**: Open learner and tutor views for requests in each state and verify filters,
detail, proposal history, status history, pagination and ownership isolation.

**Acceptance Scenarios**:

1. **Given** an authenticated participant, **When** their requests are listed, **Then** they can
   filter by role-relevant status and navigate stable pages.
2. **Given** a request participant, **When** detail is opened, **Then** the current terms, proposal
   versions and status history appear in chronological order.
3. **Given** a non-participant, **When** list or detail is requested directly, **Then** no private
   request information is disclosed.

---

### User Story 5 - Cancel or complete a request (Priority: P2)

As an authorized participant, I want to close a request according to its current state so that its
lifecycle accurately reflects the real outcome.

**Why this priority**: Correct terminal states prevent obsolete requests from continuing to change.

**Independent Test**: Cancel requests from each permitted state, complete an accepted request and
attempt invalid transitions; verify confirmations, reasons, history and notifications.

**Acceptance Scenarios**:

1. **Given** a learner-owned `PENDING` or `NEGOTIATING` request, **When** the learner confirms
   cancellation, **Then** status becomes `CANCELLED` and further negotiation is blocked.
2. **Given** an `ACCEPTED` request, **When** an authorized cancellation is confirmed with a reason,
   **Then** the cancellation is recorded and the other party is notified.
3. **Given** an accepted teaching arrangement that has concluded, **When** an authorized participant
   marks it complete, **Then** status becomes `COMPLETED` with actor and time recorded.
4. **Given** a terminal request, **When** another terminal or negotiation transition is attempted,
   **Then** it is rejected without overwriting the existing state.

### Edge Cases

- The tutor profile is hidden, rejected or its account locked between detail view and submission.
- Availability changes between selecting a time and creating or counter-proposing a request.
- A learner attempts to hire their own account or a tutor attempts to create a learner request.
- Sessions per week are below 1 or above 21; duration is below 30 or above 240 minutes.
- Offline or hybrid mode is submitted without a province/city and district.
- Both parties act on the same request version at nearly the same time.
- A notification fails after the primary state change is ready to commit.
- A retry arrives after the original request succeeded but before its response reached the client.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Only an authenticated learner MUST be able to create a hire request, and the learner
  MUST NOT hire their own account. *(Source: SRS FR-09, BR-02, BR-03, UC-09)*
- **FR-002**: A request MUST identify one public, approved tutor on an active account and one active
  subject or course offered by that tutor. *(Source: SRS UC-09, BR-01)*
- **FR-003**: A request MUST contain a future start date, at least one schedule slot, 1-21 sessions
  per week, 30-240 minutes per session, teaching mode, required location, positive VND price and an
  optional note. *(Source: SRS BR-04 through BR-06, BR-14, UC-09)*
- **FR-004**: Request schedules MUST be checked against the tutor's current availability before the
  request is committed. *(Source: SRS UC-09 alternative A1)*
- **FR-005**: A listed-price request MUST start as `PENDING`; a valid alternative-price request MUST
  start as `NEGOTIATING`. *(Source: SRS UC-09)*
- **FR-006**: Successful request creation MUST atomically create the request, its initial status
  history, one linked conversation and a tutor notification. *(Source: SRS BR-08, UC-09, section
  7.5)*
- **FR-007**: Repeated delivery of the same create operation MUST return the original outcome
  without creating duplicate business records. *(Source: Sprint 3 reliability requirement;
  supports SRS section 7.5)*
- **FR-008**: Learners MUST see only requests they sent; tutors MUST see only requests addressed to
  them; authorized administrators MAY monitor requests without changing participant terms.
  *(Source: SRS section 4.1, matrix 4.3, FR-14)*
- **FR-009**: Request lists MUST support stable pagination, status filtering and clear current-state
  labels that do not rely on color alone. *(Source: SRS sections 7.1-7.2)*
- **FR-010**: Request detail MUST show current terms, participants' public identities, ordered
  proposal history and ordered status history only to authorized viewers. *(Source: SRS FR-09
  through FR-11, NFR-07)*
- **FR-011**: Only the designated tutor MUST be able to accept, reject or counter a pending or
  negotiating request. *(Source: SRS BR-07, UC-11)*
- **FR-012**: Rejecting a request MUST require a reason and move it to `REJECTED`. *(Source: SRS
  UC-11)*
- **FR-013**: Either participant MUST be able to create a counter-proposal on a `PENDING` or
  `NEGOTIATING` request using a valid price, schedule or both. *(Source: SRS FR-10, UC-10)*
- **FR-014**: Every proposal MUST be immutable and record sender, proposed price, proposed schedule,
  optional note and creation time. *(Source: SRS BR-11, UC-10)*
- **FR-015**: Accepting the latest valid proposal MUST save its price and schedule as the final
  agreement and move the request to `ACCEPTED`. *(Source: SRS UC-10)*
- **FR-016**: `REJECTED`, `CANCELLED` and `COMPLETED` requests MUST reject further negotiation.
  *(Source: SRS BR-09)*
- **FR-017**: The learner MUST be able to cancel their own `PENDING` or `NEGOTIATING` request;
  cancellation of an `ACCEPTED` request MUST require confirmation and a reason. *(Source: SRS
  BR-10, UC-11)*
- **FR-018**: Either participant MUST be able to mark an `ACCEPTED` request `COMPLETED` after an
  explicit confirmation, and all terminal-state actions MUST record actor, reason when applicable
  and time. *(Source: SRS NFR-07, UC-11)*
- **FR-019**: State changes MUST verify the expected current version and reject concurrent stale
  updates rather than overwriting them. *(Source: SRS UC-11 alternative A1, section 7.5)*
- **FR-020**: Each successful creation, proposal and state change MUST notify the other participant;
  notification failure MUST NOT leave the core request in a partial state. *(Source: SRS FR-13,
  UC-09 through UC-11, section 7.5)*
- **FR-021**: Forms and state actions MUST show field errors, loading, conflict, success and
  confirmation states while preserving valid input. *(Source: SRS sections 7.1 and 7.3)*
- **FR-022**: Automated checks MUST cover role and ownership denial, schedule and numeric limits,
  duplicate submission, every valid and invalid transition, concurrent updates, history ordering
  and notification failure. *(Source: SRS NFR-07, NFR-08, AC-04, AC-05, AC-07, AC-09)*

### Key Entities

- **Hire Request**: The learner's request to one tutor, current proposed terms, current state,
  participants and lifecycle timestamps.
- **Request Schedule**: One or more requested teaching intervals associated with a request or
  proposal.
- **Negotiation Proposal**: An immutable version of price, schedule and note submitted by one
  participant.
- **Final Agreement**: The exact accepted price, schedule, mode and location retained independently
  of later profile changes.
- **Request Status Event**: An append-only record of prior state, new state, actor, reason and time.
- **Conversation**: The unique communication context created with a successful request and used in
  Sprint 4.
- **Notification**: A participant-facing event pointing to the affected request.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A learner can create a valid hire request from tutor detail in no more than three
  minutes.
- **SC-002**: Retrying or double-submitting the same creation produces exactly one request,
  conversation and initial notification in 100% of acceptance cases.
- **SC-003**: Unauthorized users complete zero successful request reads or state changes across the
  role, ownership and direct-access acceptance suite.
- **SC-004**: All transitions in the approved lifecycle succeed, and every disallowed transition is
  rejected, in 100% of state-machine tests.
- **SC-005**: Proposal and status histories retain every accepted event in stable chronological
  order during concurrent-action tests.
- **SC-006**: At least 95% of ordinary request list, detail and action interactions complete within
  three seconds under the demonstration load of 100 concurrent users.
- **SC-007**: Create, respond, negotiate, track and close journeys each pass independently without
  requiring Sprint 4 messaging or administration screens.

## Assumptions

- Sprint 1 authentication and Sprint 2 approved tutor profiles, subjects, courses and availability
  are available.
- A learner represents a parent or student for the shared MVP workflow.
- Price is a positive integer in VND per session; duration is stored separately.
- The accepted agreement snapshots its terms so later tutor-profile or course changes do not alter
  historical requests.
- Either request participant may mark an accepted request complete; the action is explicit,
  confirmed, recorded and communicated to the other participant.
- Payment, recurring lesson management, contracts, disputes and refunds are outside this feature.
