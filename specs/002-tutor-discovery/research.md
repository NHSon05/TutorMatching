# Research: Sprint 2

Date: 2026-10-20. Repository-based design decisions; no external service or new package selected.

## R1 — Reuse and boundaries

Decision: reuse onboarding routes/services and existing TutorProfile, TutorSubject, AvailabilitySlot, Course, TutorProfileReview and Notification models. Move public querying behind Application ports implemented in Infrastructure; remove controller-level persistence logic.
Rationale: preserve existing clients/data and respect layered architecture. Alternative: duplicate profile API rejected because two sources would drift.

## R2 — Public eligibility

Decision: one shared APPROVED + ACTIVE predicate for count/list/detail. Public status override is rejected. Return 404 for unavailable detail. Public DTO is explicitly allowlisted; certificate file URLs, private contacts and invented ratings are excluded.
Rationale: current controller permits status selection and unrestricted detail. Alternative: frontend hiding rejected because it leaves direct API access open.

## R3 — Lifecycle and concurrency

Decision: keep persisted DRAFT/PENDING_REVIEW/APPROVED/REJECTED. Request changes transitions PENDING_REVIEW → DRAFT with review action REQUEST_CHANGES; reject → REJECTED; approve → APPROVED. All review writes carry an expectedVersion UUID; transaction compares it, changes version, writes history/audit and a Notification atomically. Stale requests return 409. Tutor may resubmit DRAFT/REJECTED; pending edits return 409. APPROVED core edit becomes PENDING_REVIEW when submission-valid, otherwise DRAFT; no old public snapshot.
Rationale: no additional status required; explicit action distinguishes request changes from ordinary drafting. Alternative: dual published/draft snapshots rejected for MVP complexity.

## R4 — Catalog and legacy data

Decision: use stable subject/location codes and controlled teaching-level codes; qualification stays separate from teaching levels. TutorSubject gets normalized level associations instead of free-text filtering. Seed only documented project province/district values with a versioned fixture, without claiming current national coverage.
Migration: map existing JSON subject/level strings with a reviewed explicit mapping; do not guess by substring. Unmapped values remain preserved in legacy data and require tutor correction before resubmission. Existing approved rows lacking required normalized data become DRAFT with audit evidence; deploy behind maintenance window, review counts and back up before upgrade. Never hard-delete referenced catalog values. Disable inactive subjects in new selections; public subject lists/search exclude them, preserve owner/history view. Disabling the last active subject removes profile from discoverable inventory until corrected.
Rationale: deterministic filters and preserved history. Alternative: infer city from school/bio rejected as inaccurate.

## R5 — Weekly availability and capacity

Decision: MVP supports WEEKLY only, ISO weekday 1–7, Asia/Ho_Chi_Minh wall-clock time, half-open intervals, no overnight interval. Existing dated slots are retained but not counted by MVP weekly matching. Serialize slot writes per tutor in a transaction to prevent concurrent overlap. Adjacent slots are legal.
Matching: intersect active availability with learner weekly windows, union overlapping/adjacent intersections per day, then sum floor(minutes/durationMinutes). Require capacity ≥ sessionsPerWeek; no booked-slot subtraction in Sprint 2. Frequency requires duration and windows together; incomplete criteria return 400. Example: Monday 18:00–20:00, request 60 minutes → capacity 2; duplicate learner windows still capacity 2.
Alternative: count rows rejected because it ignores duration and duplicates.

## R6 — Prices and courses

Decision: sessionRateVnd is canonical public filter price, positive Int32 VND. Hourly/monthly values remain owner legacy fields; no implicit conversion or default invented price. Submission requires session rate. Course sessionCount and pricePerSessionVnd required positive Int32 for active courses; existing incomplete courses become HIDDEN, preserving data. Course states ACTIVE/HIDDEN; removal soft-deletes. Subject must belong to tutor and be active when saving an active course.
Alternative: nullable public price rejected because matching would be ambiguous.

## R7 — Search

Decision: AND across groups, OR within repeated subject/level/mode values; subject + level must match the same TutorSubject association. Name trimmed, case/accent-insensitive through explicit normalized search column maintained on write and backfilled; no database extension required. All filters/count/pagination execute in PostgreSQL. Defaults page=1/pageSize=20, maximum 100. Sort newest, priceAsc, priceDesc plus profile UUID tie-breaker. Stable ordering is guaranteed for unchanged data; concurrent inventory changes can shift offset pages. Public responses no-store to prevent stale account/profile visibility.
Alternative: in-memory filtering rejected for 10,000-row scale.

## R8 — Notifications and scope

Decision: persist review Notification in the decision transaction; owner can read review history/status in onboarding. Full notification inbox/delivery UI remains Sprint 4. No SMTP dependency or claim of immediate email delivery.
AI embedding/recommendations/explanations remain after MVP per user decision. No provider, vectors, scores or AI tasks added.

## R9 — Phase 3 compatibility and lifecycle

Decision: discovery data is additive to existing owner steps; valid submit and approved core edits use the current version, while legacy incomplete drafts remain saveable. Every selected subject needs active levels at submit, but an incomplete draft can retain a subject with no level. Teaching modes live in a whitelisted jsonb array on TutorProfile; migration preserves legacy rows with an empty array rather than assuming ONLINE. Display name remains shared with the account, so account name edits also enter re-review. Avatar upload refreshes the owner version before wizard navigation resumes.
Rationale: enforce normalized discovery without breaking old draft payloads or allowing name edits to bypass public eligibility. Alternative: separate display-name storage deferred to avoid two competing names in current UI.

## R10 — Phase 4 owner offers

Decision: one owner HTTP controller serves availability and courses through an Application port. Serialize all offer mutations on the existing tutor-profile row, preserving profile approval/version. Always soft-delete courses and availability; hide existing courses even if their historical subject becomes inactive. Use a dedicated /tutor/offers management route, available before approval; keep teaching/dashboard approval gates.
Rationale: prevent check-then-insert overlap races and preserve downstream history without new schema or duplicated controllers. WeeklyAvailability.Capacity is ready for reuse when US4 search matching is implemented.


## R11 — US3 implementation compatibility and history

All decision routes, including Sprint 1 approve/reject aliases, require the displayed expectedVersion; keeping an unversioned alias would bypass stale-resubmission protection. Aliases delegate to one transaction service. Detail reads use repeatable-read snapshots, while decisions lock profile then account and recheck eligibility. Migration derives legacy action from the recorded target status, preserves original notes/actors/times and leaves unknown reviewedVersion null. The existing notification body limit remains 2000; full 4000-character reasons are authoritative in immutable review history. Local migration/backup verification must use the API connection (localhost:5433), not assume the Compose instance is the same database.


## R12 — SQL capacity and public discovery projection

US4 must filter/count/page in PostgreSQL, so weekly matching uses parameterized JSON windows plus same-day numeric range intersections, range_agg union and floor per merged segment. Domain WeeklyAvailability.Capacity remains the reference calculation; integration tests compare SQL results against it across multi-day fragments, duplicate windows, durations30/60/90/240 and frequencies1/2/3/21. Legacy JSON value-converted teaching modes require native JSONB ?| instead of untranslatable collection LINQ. Each response uses a repeatable-read snapshot and bounded page association projections. Public inventory also requires the already-specified active subject and positive session price; sparse historical approval fixtures were enriched to represent discoverable profiles, preserving their privacy/eligibility assertions. Details use profileId only; no current UI depended on userId links, and the old privacy fixture was explicitly migrated.
