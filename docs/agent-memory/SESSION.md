# Current Session Handoff

Updated: 2026-11-01
Status: Sprint 4 Phase 2 (Foundational) and Phase 3 (US1 Messaging 🎯 MVP) complete; US2 Notifications next.

## Current scope and evidence

- Bypassed automated test generation per user instruction to save token quota.
- Implemented Phase 2 Foundation:
  - Added ClientMessageId, MessageNotificationOutbox, Article Version, ApplicationUser ConcurrencyVersion, and EF Core configurations.
  - Setup SignalR EventsHub (/api/v1/hubs/events), SignalREventPublisher, MessageNotificationOutboxWorker background service.
  - Installed @microsoft/signalr and created useSignalREvents hook.
- Implemented Phase 3 User Story 1 (Messaging MVP):
  - Application contracts & MessagingService with cursor pagination, active participant checks, ClientMessageId idempotency, and transactional outbox.
  - ConversationsController (GET list, GET detail, GET messages, POST send, POST read).
  - Frontend conversations API client, useConversations hook, and replaced mock messages page with real-time chat UI.
  - Connected HireRequestDetail.tsx to /messages.
  - Both backend (0 errors) and frontend (tsc 0 errors) compiled cleanly.

## Next executable step

- Phase 4: US2 Notifications (T019–T022): notification service, controller, and UI bell/popover.
- Contract notes preserve actual accessToken auth cookie, CSRF400 compatibility and non-UUID
  catalog audit entity IDs; resolve api.md CSRF403 discrepancy before runtime parity closure.
- Keep SignalR user-channel hints + REST recovery (ADR-013), transactional message notification outbox,
  post-commit publication, live session revocation and reconnect multi-page catch-up requirements.

## Retained release dependency

- Sprint3 Phases1–7 / T001–T045 complete per prior handoff; T046–T050 remain unchecked.
- Those gates cover full contract/security matrix,100-user load, layered validation,
  schema/contract/quickstart reconciliation and convergence. Complete before MVP release.
- Preserve immutable hiring snapshots, expectedVersion and cross-module lock order;
  account writes must avoid user->profile inversion with profile->user review paths.
- Preserve pre-existing uncommitted planning, sprint, decision and ignore changes; no commit made.
