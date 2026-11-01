# Tasks: Messaging, Administration and MVP Release

**Input**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/api.md](contracts/api.md), [quickstart.md](quickstart.md).
**Feature Directory**: `specs/004-messaging-admin-release`
**Tests**: Required by constitution IV and FR-021/022. Write failing contract/behavior tests first; verify passing evidence before completing checkpoints.

## Format: `- [ ] [TaskID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, independent prerequisites)
- **[Story]**: User story identifier ([US1]–[US6]) for story phases; omitted for Setup, Foundational, and Polish phases
- Every task includes exact repository-relative paths

---

## Phase 1: Setup (Shared Infrastructure & Baselines)

**Purpose**: Establish traceability, baseline metrics, OpenAPI contract specifications, and test fixtures before code changes.

- [x] T001 Build the FR-001–022 / SC-001–008 evidence matrix and record baseline test commands, existing failures, and source/contract review findings in `specs/004-messaging-admin-release/evidence.md`.
- [x] T002 Generate and validate OpenAPI 3.1 contract specification in `specs/004-messaging-admin-release/contracts/openapi.json` from `specs/004-messaging-admin-release/contracts/api.md` covering all new routes (`/conversations`, `/notifications`, `/admin/users`, `/articles`, `/admin/articles`, `/admin/hire-requests`, `/admin/catalog`, `/admin/dashboard`, `/admin/audit`) and error schemas (400, 401, 403, 404, 409, 422).
- [x] T003 [P] Setup synthetic test fixtures in `backend/tests/TutorMatching.Api.IntegrationTests/Messaging/MessagingFixture.cs` and `backend/tests/TutorMatching.Api.IntegrationTests/Administration/AdminFixture.cs` using PostgreSQL Testcontainers (two request participants, second request, outsider learner/tutor, locked account, multiple administrators, seed categories/articles/history).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data schema, entity extensions, migrations, SignalR hub setup, outbox worker, and shared transport hooks that MUST be complete before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Add domain invariant and migration preflight tests in `backend/tests/TutorMatching.Domain.UnitTests/Messaging/MessagingInvariantsTests.cs` and `backend/tests/TutorMatching.Api.IntegrationTests/Persistence/Sprint4MigrationTests.cs` verifying constraints: "Content <= 4000 UTF-16 units", "Article title 1–256, slug 1–256 lowercase URL-safe, summary <= 1000, content 1–50000", "Version UUID required", partial unique index `(conversation_id, sender_user_id, client_message_id) where client_message_id is not null`, index `(conversation_id, sent_at, id)`, partial unread index `(conversation_id, sender_user_id, read_at)`, notification partial unique index `(user_id, message_id)`, and fail-fast migration preflight.
- [x] T005 Extend domain entities:
  - Add nullable `Guid? ClientMessageId` (required non-empty for new sends) and validation rules in `backend/src/TutorMatching.Domain/Messaging/Message.cs`.
  - Create outbox entity `backend/src/TutorMatching.Domain/Messaging/MessageNotificationOutbox.cs` with `Id, MessageId, RecipientUserId, CreatedAt, AttemptCount, NextAttemptAt, DeliveredAt`.
  - Extend `backend/src/TutorMatching.Domain/Content/Article.cs` with `AuthorUserId, title 1–256, unique slug 1–256, summary <= 1000, content 1–50000 plain text, status DRAFT/PUBLISHED/HIDDEN, PublishedAt, Guid Version`.
  - Extend `backend/src/TutorMatching.Domain/Notifications/Notification.cs` to support message notification events with generic text.
- [x] T006 Configure EF Core entity mappings:
  - Configure `MessageConfiguration.cs` in `backend/src/TutorMatching.Infrastructure/Persistence/Configurations/MessageConfiguration.cs` with partial unique index on `(conversation_id, sender_user_id, client_message_id)` where client_message_id is not null, and index on `(conversation_id, sent_at, id)`.
  - Configure `MessageNotificationOutboxConfiguration.cs` in `backend/src/TutorMatching.Infrastructure/Persistence/Configurations/MessageNotificationOutboxConfiguration.cs` with unique index on `(message_id, recipient_user_id)`.
  - Configure `NotificationConfiguration.cs` in `backend/src/TutorMatching.Infrastructure/Persistence/Configurations/NotificationConfiguration.cs` with partial unique index `(user_id, message_id)` and unread index `(user_id, created_at, id) where is_read = false`.
  - Configure `ArticleConfiguration.cs` in `backend/src/TutorMatching.Infrastructure/Persistence/Configurations/ArticleConfiguration.cs` with unique slug and Version column.
  - Add `Guid ConcurrencyVersion` to `ApplicationUserConfiguration.cs` and catalog configurations in `backend/src/TutorMatching.Infrastructure/Persistence/Configurations/`.
- [x] T007 Generate EF Core migration in `backend/src/TutorMatching.Infrastructure/Persistence/Migrations/*_MessagingAdminReleaseFoundation.cs` and update `ApplicationDbContextModelSnapshot.cs`; run preflight checks, backfill versions with unique values, leave legacy message client IDs null, and record upgrade/rollback test results.
- [x] T008 [P] Implement SignalR hub, event publisher, and outbox worker:
  - Create SignalR hub `backend/src/TutorMatching.Api/Hubs/EventsHub.cs` mapped to `/api/v1/hubs/events`; restrict group subscriptions strictly to server-derived user ID `user:{userId}`; reject caller-specified groups; deny unauthenticated/locked connections.
  - Implement event publisher `backend/src/TutorMatching.Application/Abstractions/IEventPublisher.cs` and `backend/src/TutorMatching.Infrastructure/Messaging/SignalREventPublisher.cs` to publish `MessageCreated`, `MessagesRead`, `NotificationsChanged` (schemaVersion: 1) strictly AFTER database commit.
  - Implement background outbox worker in `backend/src/TutorMatching.Infrastructure/Messaging/MessageNotificationOutboxWorker.cs`: fetch pending batches with row lock `FOR UPDATE SKIP LOCKED`, insert `Notification` and set `DeliveredAt = UtcNow` atomically, apply exponential backoff on retry, log sanitized diagnostics without message content.
- [x] T009 [P] Setup frontend SignalR hook and date utilities:
  - Install `@microsoft/signalr` in `frontend/package.json`.
  - Implement `frontend/src/hooks/useSignalREvents.ts`: handle connection lifecycle, bounded retry backoff, register event listeners before starting connection, clean up on unmount/logout, prevent duplicate connections during React strict mode rerenders, and invalidate TanStack Query caches.
  - Implement shared date/time helpers in `frontend/src/lib/date-time/date-utils.ts` for consistent UTC to `Asia/Ho_Chi_Minh` display.

**Checkpoint**: Foundation ready — database schema, outbox infrastructure, SignalR hub, and client hooks verified. User story implementation can now begin.

---

## Phase 3: User Story 1 - Exchange Request Messages (Priority: P1) 🎯 MVP

**Goal**: Participants in a hire request exchange text messages in chronological order, page through history with stable keyset cursors, retry sends with durable ClientMessageId idempotency, mark received messages as read, trigger outbox notifications, and reject unauthorized accounts/admins.

**Independent Test**: Seed two request participants and an outsider. Exchange messages, page history, mark messages read, retry send with identical ID (returns 200 without duplicate) and modified payload (returns 409 Conflict). Verify outsider and admin receive 404/403. Inject outbox worker failure and verify message remains committed and notification is eventually created.

### Implementation for User Story 1

- [x] T012 [US1] Implement messaging application queries and commands in `backend/src/TutorMatching.Application/Messaging/`:
  - `GetConversationsQuery` and `GetConversationByIdQuery` (participant scope, calculate `canSend` and `unreadCount`).
  - `GetConversationMessagesQuery` (keyset pagination on `(sent_at, id)`, newest first).
  - `SendMessageCommand` (validates active participant, content trimmed 1..4000, enforces `ClientMessageId` idempotency against unique index, writes Message and `MessageNotificationOutbox` in one transaction, publishes post-commit `MessageCreated` hint).
  - `MarkMessagesReadCommand` (validates active participant, filters IDs to caller-received unread in this conversation, updates `ReadAt = UtcNow`, returns `changedCount`, publishes post-commit `MessagesRead` hint).
- [x] T013 [US1] Implement API controller `backend/src/TutorMatching.Api/Controllers/ConversationsController.cs`:
  - Endpoints: `GET /api/v1/conversations`, `GET /api/v1/conversations/{id}`, `GET /api/v1/conversations/{id}/messages`, `POST /api/v1/conversations/{id}/messages`, `POST /api/v1/conversations/{id}/read`.
  - Enforce authentication, active account check, participant authorization; exclude administrator access (return 404 if caller is not participant).
- [x] T014 [US1] Implement frontend API client and custom hook in `frontend/src/lib/api/conversations.ts` and `frontend/src/hooks/useConversationMessages.ts`:
  - API client methods: `getConversations`, `getConversation`, `getMessages`, `sendMessage`, `markRead`.
  - Custom hook: manage message pagination (TanStack Query infinite query), reducer for optimistic messages and draft state, send retry with durable `clientMessageId`, read receipt debounce for visible incoming messages, SignalR cache invalidation.
- [x] T015 [US1] Replace mock messaging UI in `frontend/src/app/(public)/messages/page.tsx` and build messaging components in `frontend/src/components/messaging/`:
  - `ConversationList.tsx`: list user's conversations with unread badges, last message preview, participant avatar/name, link to active chat.
  - `ConversationChat.tsx`: message stream with stable scroll, chronological order, read status indicators, sender/recipient bubbles.
  - `MessageInput.tsx`: form with character counter (max 4000), submit button, error display, disabled state if request/conversation is closed.
  - Add "Nhắn tin" / "Chat" button linking to `/messages?conversationId={id}` in `frontend/src/components/hiring/HireRequestDetail.tsx`.
- [ ] T016 [US1] Create and run end-to-end messaging journey in `frontend/tests/e2e/messaging.spec.ts`:
  - Two browser contexts (learner and tutor) open conversation from hire request, send messages back and forth, verify real-time arrival via SignalR, verify read receipts update, verify pagination for older messages, verify outsider account receives 404.

**Checkpoint**: User Story 1 fully functional and testable independently — real-time messaging, durable idempotency, and access isolation verified.

---

## Phase 4: User Story 2 - Follow Relevant Notifications (Priority: P1)

**Goal**: Authenticated users follow request, review, and message notifications; view unread count; mark single or all items read (bound to server snapshot boundary); safely open references; and receive real-time updates via SignalR.

### Implementation for User Story 2

- [ ] T019 [US2] Implement Application layer notifications logic in `backend/src/TutorMatching.Application/Notifications/`:
  - Queries: `GetNotificationsQuery`, `GetUnreadNotificationCountQuery`.
  - Commands: `MarkNotificationReadCommand`, `MarkAllNotificationsReadCommand` (with snapshot boundary condition `CreatedAt <= boundary`), `OpenNotificationCommand` (resolves target validity/authorization).
  - Integrate existing hiring/review notification triggers to dispatch `NotificationsChanged` SignalR event post-commit.
- [ ] T020 [US2] Implement API controller `backend/src/TutorMatching.Api/Controllers/NotificationsController.cs`:
  - Endpoints: `GET /api/v1/notifications`, `GET /api/v1/notifications/unread-count`, `POST /api/v1/notifications/{id}/read`, `POST /api/v1/notifications/read-all`, `POST /api/v1/notifications/{id}/open`.
  - Apply `[Authorize]`, active account check, owner isolation.
- [ ] T021 [US2] Implement frontend notifications API client and custom hook in `frontend/src/lib/api/notifications.ts` and `frontend/src/hooks/useNotifications.ts`:
  - API methods: `getNotifications`, `getUnreadCount`, `markRead`, `markAllRead`, `openNotification`.
  - Custom hook: manage notification list, unread badge count, optimistic read updates, SignalR `NotificationsChanged` listener for cache invalidation.
- [ ] T022 [US2] Build notification UI components in `frontend/src/components/notifications/` and header integration:
  - `NotificationBell.tsx`: bell icon with accessible unread badge count, toggle popover.
  - `NotificationList.tsx`: paginated list with type icons, relative timestamp, unread indicator, "Đánh dấu tất cả đã đọc" (Mark all as read) button.
  - `NotificationItem.tsx`: individual item with safe click-to-open handler; shows unavailable notice if target is no longer accessible.
  - Integrate `NotificationBell` into header navigation in `frontend/src/components/navigation/AppHeader.tsx`.
- [ ] T023 [US2] Create and run end-to-end notification journey in `frontend/tests/e2e/notifications.spec.ts`:
  - Trigger request creation/negotiation and message, observe real-time notification popover update via SignalR, mark one as read, mark all read with boundary, navigate from notification to request detail.

**Checkpoint**: User Stories 1 and 2 functional and integrated — real-time messages and notifications working together.

---

## Phase 5: User Story 3 - Administer Users Safely (Priority: P1)

**Goal**: Administrators search and inspect user accounts, lock or unlock target accounts after explicit confirmation with expectedVersion concurrency control; self-lock is rejected; locked accounts have active sessions revoked and tutor profiles hidden from discovery; full secret-free audit trail.

**Independent Test**: Search accounts, lock and unlock a target account, attempt self-lock (rejected), verify session revocation for locked user, verify public discovery filters out locked tutor, verify audit log recorded.

### Tests for User Story 3 ⚠️

- [ ] T024 [P] [US3] Add user administration unit and integration tests in `backend/tests/TutorMatching.Application.UnitTests/Administration/AdminUsersServiceTests.cs` and `backend/tests/TutorMatching.Api.IntegrationTests/Administration/AdminUsersEndpointTests.cs`:
  - Test `GET /api/v1/admin/users`: search query `q` (max 100), role filter (`LEARNER`, `TUTOR`, `ADMIN`), status filter (`ACTIVE`, `LOCKED`), pagination.
  - Test `GET /api/v1/admin/users/{id}`: returns user details with `version` UUID, role, status, profile summary; excludes password hash, security stamps, tokens.
  - Test `POST /api/v1/admin/users/{id}/status`:
    - Valid lock: `{expectedVersion, confirmed: true, status: "LOCKED"}` -> updates status, rotates version and security stamp, revokes sessions, writes audit event.
    - Valid unlock: `{expectedVersion, confirmed: true, status: "ACTIVE"}` -> updates status, rotates version, does not revive old sessions.
    - Self-lock rejection: returns 400/422 when admin targets their own current account.
    - Concurrency conflict: returns 409 when `expectedVersion` does not match current version.
    - Non-admin access denial: returns 403 Forbidden for learner or tutor.
  - Test locked account behavior: locked account cannot authenticate or make private API calls; locked tutor profile excluded from `GET /api/v1/tutors` public search.
- [ ] T025 [P] [US3] Add frontend admin users component and dialog tests in `frontend/tests/components/admin/AdminUsers.test.tsx`:
  - Test search input, role and status filter dropdowns.
  - Test user detail modal/drawer with account history, profile info, lock/unlock button.
  - Test lock/unlock confirmation modal requiring explicit confirmation checkbox/button.
  - Test self-lock disabled or rejected with error toast.
  - Test 409 concurrency error handling with refetch prompt.

### Implementation for User Story 3

- [ ] T026 [US3] Implement Application layer user administration in `backend/src/TutorMatching.Application/Administration/Users/`:
  - Queries: `SearchAdminUsersQuery`, `GetAdminUserByIdQuery`.
  - Commands: `UpdateUserStatusCommand`: validates admin role, rejects self-lock (`actorId == targetUserId`), enforces `expectedVersion` check, updates status and rotates `SecurityStamp` + `ConcurrencyVersion`, revokes active sessions via session store/token manager, appends `AuditEvent` within the same database transaction.
- [ ] T027 [US3] Extend API controller `backend/src/TutorMatching.Api/Controllers/AdminController.cs`:
  - Endpoints: `GET /api/v1/admin/users`, `GET /api/v1/admin/users/{id}`, `POST /api/v1/admin/users/{id}/status`.
  - Authorize with `[Authorize(Roles = "ADMIN")]`.
- [ ] T028 [US3] Implement frontend API client in `frontend/src/lib/api/admin-users.ts` and update admin users UI in `frontend/src/app/(admin)/admin/users/page.tsx`:
  - Replace mock data in `frontend/src/app/(admin)/admin/users/page.tsx` with real API query.
  - Build `UserStatusDialog.tsx` in `frontend/src/components/admin/` with confirmation prompt, reason input, and version passing.
  - Display user details, role badge, status badge (ACTIVE / LOCKED), and audit summary.
- [ ] T029 [US3] Create and run end-to-end admin user management journey in `frontend/tests/e2e/admin-users.spec.ts`:
  - Admin logs in, searches target tutor, locks account with confirmation dialog.
  - In a separate browser context, verify locked tutor is immediately logged out / rejected on subsequent requests.
  - Verify tutor no longer appears in public tutor search.
  - Admin unlocks tutor account; tutor can log in again.
  - Verify self-lock is rejected.

**Checkpoint**: User Story 3 complete — administrative user search, lock/unlock safety, session revocation, and audit logging verified.

---

## Phase 6: User Story 4 - Manage Public Content and Monitor Requests (Priority: P2)

**Goal**: Administrators manage articles (draft/publish/hide) and catalog categories with versioned concurrency; public users access published articles; administrators monitor hire requests without altering terms or accessing private chat messages.

**Independent Test**: Create, edit, publish, and hide an article; verify hidden article returns 404 publicly; deactivate an in-use category and verify references remain intact; inspect request monitoring summary and assert absence of message content or mutation controls.

### Tests for User Story 4 ⚠️

- [ ] T030 [P] [US4] Add article, catalog deactivation, and request monitoring tests in `backend/tests/TutorMatching.Application.UnitTests/Content/ArticleServiceTests.cs` and `backend/tests/TutorMatching.Api.IntegrationTests/Administration/AdminContentEndpointTests.cs`:
  - Articles: Admin CRUD, publish/hide transitions, duplicate slug 409, expectedVersion 409; public `GET /api/v1/articles` and `GET /api/v1/articles/{slug}` returns only published articles; draft/hidden slugs return 404.
  - Catalog: deactivation of in-use subject/level sets `IsActive = false`, preserves existing request references; normalized duplicate name returns 409.
  - Request Monitoring: `GET /api/v1/admin/hire-requests` filters by status/learner/tutor; `GET /api/v1/admin/hire-requests/{id}` returns safe operational summary without message bodies or agreement mutation actions.
- [ ] T031 [P] [US4] Add frontend article and admin monitoring component tests in `frontend/tests/components/admin/AdminArticles.test.tsx` and `frontend/tests/components/admin/AdminRequests.test.tsx`:
  - Test article form validation (title 1–256, slug format, content 1–50000 plain text), status transitions.
  - Test catalog deactivation confirmation dialog.
  - Test admin request monitoring table and read-only detail view (assert no message view or edit actions).

### Implementation for User Story 4

- [ ] T032 [US4] Implement Article domain and application features in `backend/src/TutorMatching.Domain/Content/Article.cs` and `backend/src/TutorMatching.Application/Content/`:
  - Commands: `CreateArticleCommand`, `UpdateArticleCommand`, `PublishArticleCommand`, `HideArticleCommand`.
  - Queries: `GetPublishedArticlesQuery`, `GetPublishedArticleBySlugQuery`, `GetAdminArticlesQuery`, `GetAdminArticleByIdQuery`.
  - Controllers: `backend/src/TutorMatching.Api/Controllers/ArticlesController.cs` (public) and `backend/src/TutorMatching.Api/Controllers/AdminArticlesController.cs` (admin).
- [ ] T033 [US4] Extend catalog deactivation and concurrency in `backend/src/TutorMatching.Application/Catalog/` and `backend/src/TutorMatching.Api/Controllers/CatalogController.cs`:
  - Add `expectedVersion` checking to update/deactivate endpoints; enforce normalized uniqueness in database.
  - Ensure deactivation preserves foreign key references (soft deactivation `IsActive = false`).
- [ ] T034 [US4] Implement Admin Hire Request monitoring in `backend/src/TutorMatching.Application/Administration/Requests/` and `backend/src/TutorMatching.Api/Controllers/AdminHireRequestsController.cs`:
  - Endpoints: `GET /api/v1/admin/hire-requests`, `GET /api/v1/admin/hire-requests/{id}`.
  - Project safe summary (status, learner/tutor names, subject, schedule, price); omit private location details and chat messages; provide no mutate/negotiate endpoints.
- [ ] T035 [US4] Implement frontend articles and request monitoring pages:
  - Admin articles CRUD at `frontend/src/app/(admin)/admin/articles/page.tsx` and `[id]/page.tsx` with `frontend/src/components/admin/ArticleForm.tsx`.
  - Public article listing and detail at `frontend/src/app/(public)/articles/page.tsx` and `[slug]/page.tsx`.
  - Admin request monitoring page at `frontend/src/app/(admin)/admin/requests/page.tsx` and `[id]/page.tsx`.
  - Update admin catalog management in `frontend/src/app/(admin)/admin/catalog/page.tsx` with version support and deactivation confirmation.
- [ ] T036 [US4] Create and run end-to-end admin content journey in `frontend/tests/e2e/admin-content.spec.ts`:
  - Admin creates draft article, publishes it; verify it appears on public `/articles`.
  - Admin hides article; verify public `/articles/{slug}` returns 404.
  - Admin monitors hire request, verifies view-only access.

**Checkpoint**: User Story 4 complete — articles lifecycle, catalog safety, and request monitoring functional.

---

## Phase 7: User Story 5 - Review Dashboard and Audit Activity (Priority: P2)

**Goal**: Administrators view concise operational dashboard metrics from consistent database snapshots (including genuine zeros) and inspect secret-free filtered audit activity records.

**Independent Test**: Compare dashboard totals with seeded source records; query audit log with actor/action/entity filters; assert absence of passwords, tokens, private messages, and IPs in responses.

### Tests for User Story 5 ⚠️

- [ ] T037 [P] [US5] Add dashboard and audit integration tests in `backend/tests/TutorMatching.Application.UnitTests/Administration/AdminDashboardServiceTests.cs` and `backend/tests/TutorMatching.Api.IntegrationTests/Administration/DashboardAndAuditEndpointTests.cs`:
  - Test `GET /api/v1/admin/dashboard`: returns canonical groupings `{usersByRole, tutorProfilesByStatus, hireRequestsByStatus, asOf}`; verifies exact counts against seeded data including zero counts for unused statuses; repeatable read consistency.
  - Test `GET /api/v1/admin/audit`: test filtering by `actorId`, `action`, `entityType`, `entityId`, date range `from`/`to`; cursor pagination; asserts returned records contain no passwords, tokens, private messages, personal contact details, or IP addresses.
- [ ] T038 [P] [US5] Add frontend dashboard and audit component tests in `frontend/tests/components/admin/AdminDashboard.test.tsx` and `frontend/tests/components/admin/AdminAudit.test.tsx`:
  - Test dashboard cards rendering canonical counts and zero states (no mock trends or NaN values).
  - Test audit log table with filter bar and pagination controls.

### Implementation for User Story 5

- [ ] T039 [US5] Implement Application layer dashboard query and audit query in `backend/src/TutorMatching.Application/Administration/Dashboard/` and `backend/src/TutorMatching.Application/Administration/Audit/`:
  - `GetAdminDashboardQuery`: calculates user counts grouped by role (`LEARNER`, `TUTOR`, `ADMIN`), tutor profile counts by status (`PENDING_REVIEW`, `APPROVED`, `REJECTED`), hire request counts by status (`PENDING_TUTOR_RESPONSE`, `NEGOTIATING`, `ACCEPTED`, `REJECTED`, `CANCELLED`, `COMPLETED`); ensures all canonical enum values are present with default 0 in a single snapshot transaction.
  - `GetAuditEventsQuery`: cursor-paginated search with filters; projects to safe `AuditEventDto` `{id, actorId, action, entityType, entityId, createdAt}` (omitting internal IP and diff payloads).
- [ ] T040 [US5] Implement API endpoints in `backend/src/TutorMatching.Api/Controllers/AdminDashboardController.cs` and `backend/src/TutorMatching.Api/Controllers/AdminAuditController.cs`:
  - Endpoints: `GET /api/v1/admin/dashboard`, `GET /api/v1/admin/audit`.
  - Authorize with `[Authorize(Roles = "ADMIN")]`.
- [ ] T041 [US5] Replace mock dashboard and implement audit viewer UI in `frontend/src/app/(admin)/admin/dashboard/page.tsx` and `frontend/src/app/(admin)/admin/audit/page.tsx`:
  - Replace mock cards in `frontend/src/app/(admin)/admin/dashboard/page.tsx` with real data from `useAdminDashboard` query hook.
  - Create audit log viewer in `frontend/src/app/(admin)/admin/audit/page.tsx` with filter dropdowns and sanitized event inspection.

**Checkpoint**: User Story 5 complete — operational dashboard and secret-free audit viewer functional.

---

## Phase 8: User Story 6 - Demonstrate and Hand Over the MVP (Priority: P1, Release Gate)

**Goal**: Complete retained Sprint 3 final gates (T046–T050), execute full core demonstration journey from clean setup, cross-browser/accessibility checks, 100-user load test (including 100 SignalR connections), disposable database backup/restore rehearsal, and complete handover package.

**Independent Test**: Starting from clean documented setup and sample data, execute the full registration-to-completion journey, administration checks, backup/restore rehearsal, and multi-browser checks with zero critical defects.

### Implementation and Verification for User Story 6

- [ ] T042 [US6] Resolve retained Sprint 3 final gates in `specs/004-messaging-admin-release/evidence.md` and test suites:
  - Verify complete security and authorization matrix (Sprint 3 T046).
  - Verify 100-user load benchmark for hiring and negotiation (Sprint 3 T047).
  - Complete full layered validation and lock-order verification (Sprint 3 T048).
  - Reconcile schema, contracts, and quickstart documentation (Sprint 3 T049).
  - Complete Sprint 3 convergence and verify no regressions (Sprint 3 T050).
- [ ] T043 [P] [US6] Comprehensive End-to-End core demonstration journey in `frontend/tests/e2e/mvp-full-journey.spec.ts`:
  - Execute complete user journey: Learner registration -> Tutor registration & onboarding -> Admin approves tutor -> Learner discovers tutor -> Learner creates hire request -> Tutor counters proposal -> Learner accepts negotiation -> Both parties exchange chat messages -> Final status verified -> Admin inspects dashboard and audit log.
- [ ] T044 [P] [US6] Cross-browser and responsive compatibility testing across Chromium, Firefox, WebKit, and mobile viewport sizes:
  - Run Playwright matrix across configured browser engines and mobile viewport profiles.
  - Verify keyboard accessibility, focus indicators, semantic labels, loading, empty, and error states without relying on color alone (FR-019).
- [ ] T045 [US6] Performance & Load testing with 100 concurrent synthetic users in `backend/tests/performance/messaging-admin/`:
  - Execute isolated 100-user load test with 100 concurrent SignalR connections and reconnect bursts.
  - Measure response times: verify p95 <= 3.0s for ordinary MVP pages (SC-006).
  - Verify notification worker backlog remains bounded and catches up without data loss.
- [ ] T046 [US6] Disposable database backup and recovery rehearsal in `specs/004-messaging-admin-release/recovery-rehearsal.sh`:
  - Create disposable populated PostgreSQL database with known message, read, outbox, and audit states.
  - Execute `pg_dump` and restore into clean target database using documented commands.
  - Run validation checks: compare record counts, foreign key integrity, pending outbox replay, and session invalidation.
- [ ] T047 [US6] Final documentation, operations, and handover package in `docs/handover/`:
  - Provide sanitized environment configuration guide, seed/sample data setup commands, deployment order, health check probes, worker diagnostics, and demonstration script (`docs/handover/MVP_HANDOVER.md`).
  - Compile complete AC-01 through AC-10 traceability matrix linking each requirement to verified passing test suites in `specs/004-messaging-admin-release/evidence.md`.

**Checkpoint**: User Story 6 complete — integrated MVP verified, all acceptance criteria evidenced, performance and recovery validated.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Code quality, formatting, security sanitization, and project convergence.

- [ ] T048 [P] Code cleanup, strict type check (`tsc --noEmit`), and linter passes across backend and frontend (`dotnet format`, `npm run lint`).
- [ ] T049 [P] Security audit and log scrub check: verify zero passwords, tokens, private messages, personal contact details, or IP addresses appear in application logs, audit events, or public API responses.
- [ ] T050 Run `$speckit-converge` and final solution-wide test suite (`dotnet test backend/TutorMatching.slnx`, `npm --prefix frontend test`, `npm run build`), verify all evidence in `evidence.md`, and update project agent memory.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Can start immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1 completion. **BLOCKS all user stories**.
- **Phases 3–8 (User Stories)**: All depend on Phase 2 completion.
  - User stories can proceed sequentially in priority order (US1 → US2 → US3 → US4 → US5 → US6), or in parallel where dependencies allow.
- **Phase 9 (Polish)**: Depends on all user stories being implemented.

### User Story Dependencies

- **US1 Messaging (P1, MVP)**: Can start after Foundational (Phase 2). No dependency on subsequent stories.
- **US2 Notifications (P1)**: Can start after Foundational (Phase 2). Integrates with US1 message events and existing hiring/review notification triggers.
- **US3 User Administration (P1)**: Can start after Foundational (Phase 2). Independent of messaging/notifications.
- **US4 Content & Request Monitoring (P2)**: Can start after Foundational (Phase 2). Independent of US1–US3.
- **US5 Dashboard & Audit (P2)**: Can start after Foundational (Phase 2). Reads aggregate counts from users, profiles, requests.
- **US6 Release & Handover (P1)**: Depends on US1–US5 implementation and Sprint 3 remaining gates.

---

## Parallel Execution Opportunities

- Within Phase 1: T003 can run in parallel with T002.
- Within Phase 2: T004, T008, and T009 can run in parallel.
- Within User Story 1: T010 (backend tests) and T011 (frontend tests) can run in parallel; T012 and T014 can be developed concurrently before integration.
- Within User Story 2: T017 (backend tests) and T018 (frontend tests) can run in parallel.
- Within User Story 3: T024 (backend tests) and T025 (frontend tests) can run in parallel.
- Within User Story 4: T030 (backend tests) and T031 (frontend tests) can run in parallel.
- Within User Story 5: T037 (backend tests) and T038 (frontend tests) can run in parallel.
- Within User Story 6: T043 (E2E full journey) and T044 (cross-browser matrix) can run in parallel once features are integrated.
- Within Phase 9: T048 and T049 can run in parallel.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T003).
2. Complete Phase 2: Foundational (T004–T009) — **CRITICAL foundation**.
3. Complete Phase 3: User Story 1 Messaging (T010–T016).
4. **STOP and VALIDATE**: Verify two-party messaging, ClientMessageId idempotency, read receipts, and SignalR live delivery independently.

### Incremental Delivery

1. Foundation ready (Phases 1–2).
2. Add US1 (Messaging) → independently test & verify.
3. Add US2 (Notifications) → independently test & verify.
4. Add US3 (User Administration) → independently test & verify.
5. Add US4 (Articles & Monitoring) → independently test & verify.
6. Add US5 (Dashboard & Audit) → independently test & verify.
7. Complete US6 (Release gates, cross-browser, load test, backup/restore rehearsal, handover).
8. Polish & Converge (Phase 9).
