# Sprint4 versioned HTTP interface design

Base `/api/v1`; JSON camelCase; existing HttpOnly session cookies and CSRF middleware.
This is the planning contract. Setup must encode these operations in OpenAPI3.1 with complete
schemas and run parity tests before their implementation tasks are marked complete. Existing
Sprint1–3 contracts remain authoritative for unchanged routes; do not replace their operations.

## Common behavior

- Active authenticated account required for private endpoints. ADMIN required for `/admin/*`;
  conversation endpoints allow only actual learner/tutor participants, never ADMIN override.
- 401 unauthenticated/invalid current session;403 wrong role or CSRF;404 nonexistent/inaccessible
  owned resource (no enumeration);409 stale version/state/replay mismatch;422 semantic field errors;
  400 malformed parameters;429 rate limit. Existing ProblemDetails field-error format is retained.
- All private responses `Cache-Control: no-store`. Server derives actor/recipient IDs; no caller
  userId override. Never return password/stamps/tokens/contact through message/audit/public DTOs.
- UUID IDs, ISO8601 UTC timestamps. pageSize integer1–100 default20. Cursor binds query scope,
  filters, initial upper boundary and last(time,ID); malformed/mismatched cursor400. Current
  permissions rechecked regardless of cursor. Items + nullable nextCursor, no fabricated totals.
- Admin mutations require expectedVersion UUID, confirmed=true on lock/unlock/publish/hide and
  destructive deactivation. Duplicate same-target terminal state may no-op only when version
  matches; stale version409. Every actual change records one audit within the write transaction.

## Messaging — FR-001–006, SC-001/002

| Method and route                  | Request                                    | Response                                                             |
| --------------------------------- | ------------------------------------------ | -------------------------------------------------------------------- |
| GET /conversations                | cursor?,pageSize?                          | ConversationPage; participant only, ordered createdAt/id DESC        |
| GET /conversations/{id}           | —                                          | Conversation summary and canSend;404 outside membership              |
| GET /conversations/{id}/messages  | cursor?,pageSize?                          | MessagePage newest first; client displays chronological              |
| POST /conversations/{id}/messages | `{clientMessageId: uuid, content: string}` | 201 Message; identical replay200 same ID; changed content409         |
| POST /conversations/{id}/read     | `{messageIds: uuid[1..100]}`               | 200 `{readAt, changedCount}`; only received IDs in this conversation |

Conversation = `{id,hireRequestId,requestStatus,otherParticipant:{id,displayName},createdAt,closedAt,unreadCount,canSend}`.
Message = `{id,conversationId,sender:{id,displayName},content,sentAt,readAt,clientMessageId}`;
legacy clientMessageId nullable. Content canonical trimmed text1–4000 UTF-16 units. No contact,
HTML rendering, attachments, edits or deletion. Missing/sender-owned receipt IDs are ignored
without leaking membership in another conversation. Receipt retries preserve first ReadAt.

Send success means message+notification intent committed, not that worker already delivered.
Idempotency key retained through uncertain failure; changed draft uses new ID. Enforce uniqueness
and validation server-side. A committed message survives notification worker errors/restarts.
Reconciliation of recent pages merges IDs and receipt updates; client must drain any larger page gap.
No arbitrary conversation-create endpoint; use conversationId already returned by hire detail.

## Notifications — FR-006–009, SC-002

| Method and route                | Request                                         | Response                                                                       |
| ------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------ |
| GET /notifications              | unreadOnly?,cursor?,pageSize?                   | `{items,nextCursor,unreadCount,readAllBoundary}`                               |
| GET /notifications/unread-count | —                                               | `{unreadCount,asOf}`                                                           |
| POST /notifications/{id}/read   | empty body                                      | Notification with first readAt retained                                        |
| POST /notifications/read-all    | `{boundary: string}` from initial list snapshot | `{changedCount,unreadCount}`; arrivals after boundary untouched                |
| POST /notifications/{id}/open   | empty body                                      | `{notification,target: {kind,id,hireRequestId?} or null, unavailable:boolean}` |

Notification = `{id,type,title,body?,createdAt,isRead,readAt}`. Body may be sensitive owner-only
review text; exclude it from logging/audit. Open marks owned item read and resolves current
reference/authorization server-side; unavailable returns200 with no navigable target, never
leaks absent target details. UI maps allowlisted kind to internal routes, no server arbitrary URL.
Support existing hiring/review types and new message type; enumerate actual type codes in OpenAPI
tests. Unread-all boundary cannot name another owner; never overwrite existing ReadAt.

## Account administration — FR-010–012/017/018

Extend existing GET `/admin/users` (keep `/users` alias compatibility): page/pageSize remain,
add q(max100), role and status filters with deterministic order; safe admin summary retains current
email field for account administration only. Add GET `/admin/users/{id}` with version, safe identity,
role/status and profile summary; exclude tokens/security stamps/password hash.
POST `/admin/users/{id}/status`: `{expectedVersion,confirmed:true,status:"ACTIVE"|"LOCKED"}`;
returns updated summary/version. Reject self-lock, invalid source state and unusable admin access.
Account+session invalidation+audit atomic; history retained; new login needed after unlock.
No role escalation, account deletion or impersonation routes.

## Articles/catalog/monitoring — FR-013–015/017

| Method and route                  | Request/result                                                                                       |
| --------------------------------- | ---------------------------------------------------------------------------------------------------- |
| GET /admin/articles               | status?,cursor?,pageSize?; ArticlePage                                                               |
| POST /admin/articles              | `{title,slug,summary?,content}` ->201 draft Article                                                  |
| GET /admin/articles/{id}          | Article including version                                                                            |
| PUT /admin/articles/{id}          | `{expectedVersion,title,slug,summary?,content}` -> updated Article                                   |
| POST /admin/articles/{id}/publish | `{expectedVersion,confirmed:true}` -> Article                                                        |
| POST /admin/articles/{id}/hide    | `{expectedVersion,confirmed:true}` -> Article                                                        |
| GET /articles                     | public published-only cursor/pageSize list, summary without content                                  |
| GET /articles/{slug}              | public published-only detail; draft/hidden404                                                        |
| GET /admin/hire-requests          | status?,learnerId?,tutorId?,cursor?,pageSize?; safe summaries                                        |
| GET /admin/hire-requests/{id}     | operational detail, frozen terms with private location omitted; no message bodies or action controls |

Article fields: id,authorId,title,slug,summary?,content,status,publishedAt?,createdAt,updatedAt,version.
Public DTO excludes admin version and private author data. title1–256, slug lowercase URL-safe
1–256 unique, summary<=1000, content1–50000 plain text. Blank required values422; slug duplicate409.

Existing `/admin/catalog/{kind}` write routes remain; add expectedVersion to updates and return
version in admin DTO. Deactivation requires explicit confirmation; frontend sends it only after
confirmation. Supported kinds retain current subject/province/district/teaching-level vocabulary;
reference existing catalog contract for shape. Duplicate normalized identity409, stale version409.
No delete of referenced category. Public catalog DTO unchanged.

## Dashboard/audit — FR-016–018, SC-004/005

GET `/admin/dashboard` -> `{asOf,usersByRole,tutorProfilesByStatus,hireRequestsByStatus}` with canonical
keys mapped to nonnegative counts, zero groups retained. No fake trends/classes/revenue/health.
GET `/admin/audit` -> cursor/pageSize, actorId?,action?,entityType?,entityId?,from?,to?; validated
UTC range from<=to, newest(time,id) first. Each row `{id,actorId?,action,entityType,entityId?,createdAt}`.
No IP, contact, free-form request payload, profile notes or message content.

## Mandatory contract evidence

For every private operation: unauthenticated, locked-session, wrong-role, outsider where applicable,
CSRF mutation, version/replay boundary, required/null/length constraints and private-field exclusion.
Runtime OpenAPI and this design must agree before story closure; record any compatibility amendment.


## SignalR event contract — user-confirmed 2026-11-01

Endpoint `/api/v1/hubs/events` on ASP.NET Core SignalR; client package `@microsoft/signalr`.
This is a SignalR hub protocol endpoint, not Socket.IO. HTTP operations above stay unchanged.
No hub method sends messages or changes business state in this design.

Authenticated connection joins only its server-derived user channel. New-message/read hints go to
currently authorized request participants; notification hints only to their owner. Current session,
account and membership checks apply before dispatch. ADMIN has no conversation subscription override.
Use the existing cookie/session mechanism; validate credentials/origin and restrict CORS explicitly.
Ensure connections expire/revoke on logout, account lock and session invalidation; handshake-only
checks are insufficient. Do not put raw credentials in event payloads or diagnostic URLs/logs.

Server-to-client events (versioned payload `schemaVersion: 1`):

| Event | Additional fields | Client action |
| --- | --- | --- |
| MessageCreated | eventId, conversationId, messageId | Refetch/merge authorized latest messages and conversation unread state |
| MessagesRead | eventId, conversationId | Refresh receipt state for loaded messages |
| NotificationsChanged | eventId | Invalidate owned notification list and unread count |

All events are emitted only after associated persistence commits. Existing hiring/review notification
producers also emit NotificationsChanged after commit; no event is emitted on rolled-back writes.
Push failure never rolls back a committed business operation. Notification outbox delivery completion
means the notification row committed, not that a browser received an event. No exactly-once push
promise. Missed events are recovered through REST on connect/reconnect/focus/manual refresh.

Hooks handle initial start failures and reconnect with bounded backoff, attach handlers before start,
remove them on cleanup, and prevent duplicate connections under React lifecycle rerenders. Logout or
account change stops the old connection and ignores late callbacks before clearing private caches.
Server reconnect establishes fresh authorized channels; client then reconciles data before claiming
it is current. Catch-up must handle more than one page and refresh read receipts of older loaded rows.

Required tests: invalid/locked session and origin denial, outsider/admin isolation, active-session
revocation while connected, no pre-commit push, disconnect around commit, lost/duplicate/reordered
hints, reconnect multi-page catch-up, initial connection failure, account switch with late callbacks,
notification worker failure/restart and100 simultaneously connected synthetic users.
