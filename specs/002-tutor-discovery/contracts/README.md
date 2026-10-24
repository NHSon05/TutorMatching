# Sprint 2 API contract

`openapi.json` is the implemented OpenAPI 3.1 discovery contract, checked recursively by `DiscoveryContractTests`. Existing auth/CSRF/upload contracts remain authoritative outside this delta. Onboarding retains its step-based payload with additive discovery/version fields. All routes use /api/v1. Catalog operations use `{kind}` (`subjects`, `provinces`, `districts`, `teaching-levels`), including the admin list route; they are not four separate controller operations.

Cookie auth with current-account checks; TUTOR owner scope is derived from claims, never body userId. ADMIN catalog/review routes require ADMIN. Mutations use the existing CSRF mechanism. Standard ProblemDetails: 400 invalid query, 401 unauthenticated, 403 role/ownership, 404 absent/unavailable, 409 version/state/overlap conflict, 422 invalid submission, 429 rate limit. Validation errors carry field-keyed errors; no private values echoed.

Expected version is required for profile writes/submit/review. All owner/admin responses and public discovery use Cache-Control: no-store. Public status parameter is unsupported and rejected. Public detail identifier is profileId; migrate any legacy userId links explicitly, do not silently preserve ambiguous identifier lookup.

Search weeklyWindows is a JSON-encoded query array of {dayOfWeek,startTime,endTime}; sessionsPerWeek, durationMinutes and weeklyWindows are supplied together. Time syntax HH:mm, no overnight, timezone Asia/Ho_Chi_Minh. Match algorithm in research R5. Sort is stable on unchanged data; no cross-request snapshot promise.

Implemented PublicTutorSummary/PublicTutorDetail schemas are the explicit public allowlists: certification files and all account contacts are absent. Admin queue returns minimal review fields; full pending content is only on authorized admin detail.

For the uniform catalog routes, subject code is the UUID subjectId serialized as a string; other code values are seeded catalog keys. Public catalog reads return only active values. Owner history preserves inactive labels. Unsupported filters are rejected rather than ignored.

## Phase 1 compatibility baseline

Existing draft JSON remains step-based: currentStep/about/avatarUrl/hasCertifications/certifications/education/description/pricing. GET and PUT return those sections plus string status and timestamps; submit returns status/submittedAt/message and currently accepts an empty body. Do not replace owner responses with the proposed flat professional object. expectedVersion is a planned addition: migration strategy must accept legacy drafts until frontend rollout, while requiring concurrency for new review/core-edit flows. OnboardingContractTests exercises real HTTP draft save/read, partial update preservation and invalid empty submission. Additional normalized professional fields remain a later additive change.

## Phase 3 owner profile protocol

GET /tutor/onboarding/me and PUT /draft now return version (UUID) and discovery {subjects:[{subjectId,levelCodes}],teachingModes,provinceCode,districtCode}. Write expectedVersion at the root; catalog data is under discovery. Partial legacy drafts may omit version. Approved edits require the current version; pending edits and stale versions return 409. Valid submission requires expectedVersion; empty incomplete legacy submissions still return 422 with field errors. Saving a subject with no levels is permitted in DRAFT; submitting requires an active level for every selected subject. Legacy free-text subjects/teachingLevels may only be changed before normalized associations exist; use discovery selections afterward.

Approved core changes immediately hide the profile: complete material returns to PENDING_REVIEW, incomplete material to DRAFT. A full-name change through PUT /users/me also returns an approved tutor profile to review and is blocked while pending. Submission preserves existing private-owner completeness checks (contact/date/photo) without exposing those fields publicly. Teaching modes use a versioned jsonb migration with [] for existing rows; no teaching mode is guessed from legacy biographies.

## Phase 4 owner offers

Implemented GET/POST /tutor/availability, PUT/DELETE /tutor/availability/{id}, GET/POST /tutor/courses and PUT/DELETE /tutor/courses/{id}. All derive ownership from current authenticated TUTOR, require CSRF for mutations and use no-store. Foreign or deleted IDs return 404 without exposing another owner. Saves return 200 and deletes 204; invalid offer data 422; overlapping availability 409. Time inputs and outputs are HH:mm in Asia/Ho_Chi_Minh, ISO weekday 1–7. Only valid active WEEKLY rows are listed; legacy dated/invalid historical rows remain stored.

Course fields: subjectId/name/content/sessionCount/pricePerSessionVnd/status, status ACTIVE or HIDDEN. New/active offers require a linked active subject; an existing course may retain an inactive subject when hidden. All edited courses require nonblank content/name and positive Int32 count/price. Legacy hidden courses with missing fields must be completed to save, or may be stopped directly. DELETE always sets HIDDEN/deletedAt rather than deleting history. Availability DELETE sets isActive=false; adjacency is allowed but overlap is rejected under a profile-row transaction lock. Offer changes do not change profile approval state.

Owner UI: /tutor/offers, permitted before approval; dashboard/teaching routes keep their existing approval gate. No booking reservations or dated exceptions UI in this phase.


## Implemented Phase 5 — tutor review

- ADMIN: GET `/api/v1/admin/tutor-reviews?page=1&pageSize=20` (page 1–1,000,000, size 1–100), oldest pending/active tutor first, UUID tie-breaker. Queue excludes inactive accounts.
- ADMIN: GET `/api/v1/admin/tutor-reviews/{profileId}` returns `{id,accountStatus,profile,history,subjects,provinceName,districtName}`. Profile uses the existing owner onboarding response; subject names and per-subject level labels include retained inactive catalog references. One repeatable-read snapshot pairs content with its version.
- ADMIN: POST same detail URL accepts `{expectedVersion,action,note?}`. Actions: APPROVE → APPROVED, REQUEST_CHANGES → DRAFT, REJECT → REJECTED. Response `{status,version}`. Nonblank note (≤4000) required for the latter two actions. Version must be a nonempty UUID; stale token/state/inactive tutor returns 409. Unknown profile 404; invalid body/query 422.
- Existing `/api/v1/admin/tutors/{profileId}/approve|reject` routes now also require `expectedVersion`; old clients must fetch the detail version before deciding. No unversioned bypass remains.
- TUTOR: GET `/api/v1/tutor/reviews` returns only the authenticated owner's history, newest first, UUID tie-breaker. Fields include action, reviewerId, reviewedVersion, fromStatus, toStatus, full note and reviewedAt. Legacy reviewedVersion is null because it cannot be reconstructed.
- Cookie role enforcement and no-store apply; mutations also require CSRF. Anonymous 401, wrong role 403. History, version/state change, audit event and persistent Notification commit together; repeated/stale writes produce no duplicate side effects.
- Notification body retains up to its existing 2000-character limit; complete reasons remain in immutable review history (4000). This phase supplies stored notifications/history, not an email-delivery claim or Sprint 4 inbox.
- Reviewed implemented paths/schemas are frozen in OpenAPI and the aggregate implemented contract. The planned response for decisions was corrected to a minimal `{status,version}` result; detail explicitly includes reviewed content and history.


## Implemented Phases 6–7 — public search and detail

- GET `/api/v1/tutors`: name (trimmed/case/accent-insensitive normalized display name), repeated subjectId UUID / levelCode / mode, qualification (degree text, case-insensitive), positive minPrice/maxPrice **per session**, provinceCode/districtCode, schedule triple, sort and paging. AND across groups, OR within a repeated group; subject + level match the same association. Only active catalog subjects/levels participate in matching. Location comes from stored catalog references, never inferred from school/bio.
- OFFLINE/HYBRID criteria require province+district; district alone is invalid. Unknown or incompatible area values yield no matching inventory. Unsupported legacy `search`, `subject`, `city`, `status` and unknown query keys return400 rather than being silently ignored. Scalars cannot be repeated. Subject/level arrays max50, modes max3; name max100 and qualification max200 characters.
- Weekly schedule requires sessionsPerWeek1–21, durationMinutes30–240 and nonempty weeklyWindows JSON together, max50 windows. Strict HH:mm, ISO weekday1–7, start<end, no overnight. Invalid/missing numeric/JSON/schedule/query data returns400 ValidationProblemDetails with errors.filters and traceId. Duplicate and adjacent intersections are merged per day before floor(segmentMinutes/duration) is summed; separated fragments/different days cannot form a longer session.
- Defaults page1/pageSize20, max100; offset must fit Int32. Sort newest, priceAsc, priceDesc, always profile UUID tie-breaker. Count/filter/page all execute in PostgreSQL; only page associations are loaded. A repeatable-read snapshot makes each response internally consistent, not a promise of stable offsets across concurrent changes between requests.
- Shared list/detail inventory requires APPROVED, ACTIVE TUTOR account, positive stored sessionRateVnd and at least one linked active subject. No default price/rating/location/mode is fabricated. Account/profile visibility or last active subject loss removes the profile from public responses.
- GET `/api/v1/tutors/{id}` uses **profileId only**. Legacy ambiguous userId lookup was removed; userId URLs return404. Internal new links and the old privacy regression fixture now use profileId. External legacy links must resolve/migrate their stored profile IDs explicitly; no ambiguous fallback remains.
- Summary fields: id,displayName,avatarUrl,bio,qualification,schoolName,specialization,experienceYears,teachingMethodology,achievements,sessionRateVnd,teachingModes,provinceCode/provinceName,districtCode/districtName,subjects,approvedAt. Subject objects carry subjectId/name/active levelCodes+levelNames.
- Detail adds availability (id/dayOfWeek/startTime/endTime/timeZone) and courses (id/subjectId/subjectName/name/content/sessionCount/pricePerSessionVnd). Availability includes valid active WEEKLY rows only. Courses require ACTIVE/nondeleted, positive count/price, retained tutor linkage and active subject. Hidden/inactive/deleted offers are absent. Unavailable profile returns404; both endpoints no-store and anonymous-readable.
- Public DTOs omit userId, contacts, birth date, exact address, certificate/file links, owner versions and review history. Certificate file-serving policy itself is unchanged by this phase; only the public DTO/UI allowlist is in this scope.
- Public list is API-backed with loading/error/retry/empty states, URL apply/reset/sort/page and real profile links. No fallback mock tutors or prototype hiring-success flow. `/tutors/{profileId}` loads public detail with unavailable/retry/empty-offer states and rechecks on mount/focus/manual refresh, hiding stale content during refetch or404.
