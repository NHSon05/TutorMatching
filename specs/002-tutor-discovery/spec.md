# Feature Specification: Tutor Profiles and Discovery

**Feature Directory**: `002-tutor-discovery`

**Created**: 2026-10-02

**Status**: Ready for clarification or planning

**Input**: Sprint 2 enables tutors to maintain professional profiles, subjects, availability and
courses; administrators to moderate profiles; and visitors or learners to find and view approved
tutors. AI tutor recommendations remain outside the SRS MVP.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Build a tutor profile (Priority: P1)

As a tutor, I want to create and update my professional profile so that learners can evaluate my
qualifications, teaching offer and price after the profile is approved.

**Why this priority**: Search has no useful inventory until tutors can provide complete,
reviewable information.

**Independent Test**: Sign in as a tutor, save an incomplete draft, complete the required fields,
link subjects and submit the profile for review; verify the resulting states and ownership rules.

**Acceptance Scenarios**:

1. **Given** a tutor with no profile, **When** valid professional details are saved as a draft,
   **Then** the tutor can reopen and continue editing that draft.
2. **Given** a draft missing a required review field, **When** the tutor submits it, **Then** the
   profile remains a draft and each missing field is identified.
3. **Given** a complete draft, **When** the owner submits it, **Then** its status becomes
   `PENDING_REVIEW` and it remains absent from public discovery.
4. **Given** an approved profile, **When** the tutor changes configured core professional content,
   **Then** the changed profile returns to review before the new content becomes public.
5. **Given** another tutor or learner, **When** they attempt to edit the profile directly,
   **Then** the operation is denied and no profile data changes.

---

### User Story 2 - Manage availability and courses (Priority: P1)

As a tutor, I want to publish valid teaching times and courses so that learners can determine
whether my offer fits their needs.

**Why this priority**: Time and course compatibility are core search and hiring inputs.

**Independent Test**: Add, edit and remove availability slots and courses on one tutor profile,
then verify overlap validation, ownership, historical preservation and public visibility.

**Acceptance Scenarios**:

1. **Given** a tutor profile, **When** the owner adds a non-overlapping slot whose start precedes
   its end, **Then** the slot is saved and shown in the profile schedule.
2. **Given** an existing slot, **When** an overlapping or reversed slot is submitted, **Then** it is
   rejected without changing the valid schedule.
3. **Given** valid course details, **When** the owner saves the course, **Then** its subject, name,
   description or syllabus, price and status are retained.
4. **Given** a course referenced by historical activity, **When** the owner removes it, **Then** it
   is hidden rather than deleted and the historical reference remains valid.

---

### User Story 3 - Review tutor profiles (Priority: P1)

As an administrator, I want to approve, request changes to or reject submitted profiles so that
only suitable tutor information is made public.

**Why this priority**: SRS business rule BR-01 makes approval a prerequisite for all public search.

**Independent Test**: Process three pending profiles with approve, request-changes and reject
outcomes, then verify visibility, required notes, notifications and audit evidence.

**Acceptance Scenarios**:

1. **Given** a pending profile, **When** an administrator approves it, **Then** it becomes public
   only if its account is also active.
2. **Given** a pending profile, **When** an administrator requests changes or rejects it, **Then** a
   review note is required and the profile remains non-public.
3. **Given** two administrators view the same pending profile, **When** one processes it first,
   **Then** the second is warned about the changed state and cannot overwrite the decision.
4. **Given** a review decision, **When** it is completed, **Then** the tutor receives a notification
   and the administrator action is auditable.

---

### User Story 4 - Search for suitable tutors (Priority: P1)

As a visitor or learner, I want to search, filter, sort and page through public tutors so that I
can quickly find candidates matching my needs.

**Why this priority**: Tutor discovery is the central value proposition of the product.

**Independent Test**: Search seeded approved profiles using at least six filter groups, validate
combined filters and price boundaries, then verify sorting, pagination, empty states and privacy.

**Acceptance Scenarios**:

1. **Given** approved tutors on active accounts, **When** criteria for name, subject, qualification,
   price, teaching mode, location, availability or desired frequency are applied, **Then** every
   result satisfies all applicable criteria.
2. **Given** an invalid price range, **When** the search is submitted, **Then** the user is asked to
   correct it and no misleading result set is shown.
3. **Given** no matching tutors, **When** search completes, **Then** an empty state reports zero
   results and suggests removing filters.
4. **Given** more results than one page, **When** pages or sort order change, **Then** results remain
   stable, do not duplicate and expose no private contact information.
5. **Given** a draft, rejected or hidden profile, or an inactive tutor account, **When** public
   search runs, **Then** that profile is excluded.

---

### User Story 5 - View a public tutor detail (Priority: P2)

As a visitor or learner, I want to inspect a tutor's approved public details so that I can decide
whether to proceed toward a hire request.

**Why this priority**: Search results must lead to enough verified public information for an
informed choice.

**Independent Test**: Open an approved tutor from search and verify professional details,
availability and active courses while checking that private fields and unavailable profiles are
not exposed.

**Acceptance Scenarios**:

1. **Given** an approved profile on an active account, **When** its detail page is opened, **Then**
   the approved professional fields, subjects, teaching modes, broad service area, price,
   availability and active courses are displayed.
2. **Given** the same profile, **When** its public response is inspected, **Then** email, phone,
   birth date and exact address are absent.
3. **Given** a profile that became hidden, unapproved or inactive after appearing in results,
   **When** its detail is opened, **Then** the user is told it is no longer available.

### Edge Cases

- A tutor submits the same subject twice or a subject becomes inactive after being selected.
- Availability crosses midnight, has identical start/end times or overlaps an existing slot.
- A profile is approved at the same time the tutor edits a core field.
- A tutor account is locked while its approved profile is visible in cached search results.
- Minimum and maximum prices are equal, zero, reversed or outside supported VND limits.
- A requested offline or hybrid search omits province or district information.
- A result disappears between page navigation because its profile is hidden or account deactivated.
- Search text contains accents, mixed case, leading spaces or unsupported characters.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: A tutor MUST be able to create, view and update only their own professional profile,
  including display name, introduction, qualification, experience, achievements, price per
  session, negotiability, teaching modes and broad service area. _(Source: SRS FR-03, UC-04)_
- **FR-002**: A tutor MUST be able to save an incomplete profile as `DRAFT`. _(Source: SRS UC-04)_
- **FR-003**: Submission for review MUST require all configured public-search fields and at least
  one active subject and teaching mode. _(Source: SRS FR-03, UC-04)_
- **FR-004**: A complete submitted profile MUST enter `PENDING_REVIEW` and remain non-public until
  approved. _(Source: SRS UC-04, BR-01)_
- **FR-005**: Editing configured core content of an approved profile MUST return it to review before
  the changed content is public. _(Source: SRS BR-15, UC-04)_
- **FR-006**: Administrators MUST be able to maintain active subject and province/district reference
  data without deleting values already referenced by profiles, courses or history. _(Source: SRS
  FR-14, UC-14, BR-14)_
- **FR-007**: Tutors MUST be able to associate their profile with multiple active subjects and
  remove associations no longer offered. _(Source: SRS FR-03, UC-04)_
- **FR-008**: Tutors MUST be able to add, edit and remove their own availability slots; every slot
  MUST have a start before its end and MUST NOT overlap another slot for that tutor. _(Source: SRS
  FR-04, UC-05)_
- **FR-009**: Tutors MUST be able to create and update courses containing a subject, name,
  description or syllabus, optional course-specific price and lifecycle status. _(Source: SRS
  FR-05, UC-05)_
- **FR-010**: A course already referenced by historical data MUST be hidden rather than hard
  deleted. _(Source: SRS UC-05, section 4.2)_
- **FR-011**: Administrators MUST be able to review a `PENDING_REVIEW` profile and approve, request
  changes or reject it. _(Source: SRS FR-06, UC-06)_
- **FR-012**: Requesting changes or rejecting a profile MUST require a review note; each review
  decision MUST record actor and time and notify the tutor. _(Source: SRS UC-06, NFR-10)_
- **FR-013**: Concurrent review MUST prevent an administrator from overwriting a decision made
  against a newer profile state. _(Source: SRS UC-06 alternative A1, NFR-07)_
- **FR-014**: Public search and detail MUST include only `APPROVED` profiles owned by `ACTIVE`
  accounts. _(Source: SRS BR-01, AC-03)_
- **FR-015**: Visitors and learners MUST be able to search using any supported combination of name,
  subject, qualification, availability, desired sessions, price range, teaching mode and broad
  location. _(Source: SRS FR-07, UC-07)_
- **FR-016**: Search MUST reject non-positive prices and a minimum price greater than the maximum.
  _(Source: SRS BR-04, UC-07)_
- **FR-017**: Offline or hybrid criteria MUST require province/city and district; online criteria
  MUST allow location to be absent. _(Source: SRS BR-14)_
- **FR-018**: Search MUST provide a result count, consistent sorting, clear-all-filter action,
  pagination and a useful zero-result state. _(Source: SRS UC-07, sections 7.1-7.2)_
- **FR-019**: Public results MUST expose only approved professional information and MUST exclude
  email, phone, birth date and exact address. _(Source: SRS BR-12, section 4.2, AC-09)_
- **FR-020**: Public tutor detail MUST show approved professional fields, subjects, availability
  and active courses, and MUST report an unavailable state when public eligibility is lost.
  _(Source: SRS FR-08, UC-08)_
- **FR-021**: Search and public detail MUST provide loading, empty, error and responsive states and
  support keyboard operation for primary actions. _(Source: SRS NFR-05, sections 7.1 and 7.3)_
- **FR-022**: Automated acceptance checks MUST cover profile ownership, review transitions, public
  eligibility, at least six filter groups, pagination and private-field exclusion. _(Source: SRS
  NFR-08, AC-02, AC-03, AC-09)_

### Key Entities

- **Tutor Profile**: A tutor-owned professional record with presentation, qualification, price,
  teaching mode, service area and approval lifecycle.
- **Subject**: An administrator-maintained active or inactive teaching category.
- **Service Area**: An active province/city and district value used consistently by tutor profiles
  and offline or hybrid search.
- **Tutor Subject**: The association between a tutor profile and a subject the tutor offers.
- **Availability Slot**: A tutor-owned recurring or dated interval in which teaching is possible.
- **Course**: A tutor-owned learning offer with subject, content, optional price and visibility
  status.
- **Profile Review**: An administrator decision, note, actor and timestamp tied to a profile state.
- **Search Criteria**: The combined user-supplied constraints, sort and page selection used to
  identify public tutor profiles.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A tutor can create a complete profile, add availability and one course, and submit it
  for review in no more than ten minutes using valid data.
- **SC-002**: In acceptance tests, 100% of non-approved profiles and profiles belonging to inactive
  accounts are absent from public search and detail.
- **SC-003**: All six required search-filter groups used for MVP acceptance return only matching
  approved tutors, with no private contact fields present.
- **SC-004**: At least 95% of first-page searches complete within three seconds with up to 10,000
  tutor profiles and 100 concurrent demonstration users.
- **SC-005**: A new user can run a search and open a tutor detail in no more than three primary
  actions.
- **SC-006**: Profile review conflicts, invalid schedules and invalid price ranges are rejected in
  100% of acceptance cases without losing previously valid data.
- **SC-007**: Profile creation, review, search and public-detail journeys each pass independently
  without depending on hiring, messaging or administration features from later sprints.

## Assumptions

- Sprint 1 authentication, roles and private personal profiles are available before this feature.
- `LEARNER` is the canonical persisted learner role despite the `LEANER` typo in some SRS tables.
- A profile may support recurring weekday slots and optionally dated exceptions; exact storage is
  decided during planning.
- Location reference data is limited to the province/city and district values needed by MVP search;
  maps, coordinates and distance calculations are excluded.
- Subject maintenance included here is the minimum needed for profile and search workflows; the
  consolidated administration experience is completed in Sprint 4.
- Search relevance in MVP is deterministic filtering and documented sorting. AI tutor
  recommendations and generated explanations are explicitly outside the approved SRS scope.
- Hiring, negotiation, messaging, payment, credential verification and public contact details are
  outside this feature.
