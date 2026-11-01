# Sprint4 research and design decisions

Date: 2026-11-01. Source review, not runtime verification. Graphify query was used for navigation;
results were truncated, so focused source reads verified the relevant paths.

## Reuse current persistence and modules

Decision: reuse Domain/Messaging/{Conversation,Message}.cs, Notifications/Notification.cs,
Content/Article.cs, their EF configurations and existing Hiring/HireRequestStore.cs integration.
Conversation request FK is unique; Message.Content already has max4000. AdminController provides
only list/review aliases; current catalog/review service is functional. `/messages`, admin users
and dashboard contain mocks. Extend existing catalog/user modules and replace mocks per story.
Rationale: preserve existing histories/contracts. Alternative: new parallel schema/API rejected.

## Delivery transport

Decision (user-confirmed 2026-11-01): ASP.NET Core SignalR on server and
`@microsoft/signalr` on client. This supersedes the initial polling design. No Socket.IO dependency.
REST remains authoritative for send/read mutations and paginated history; SignalR pushes lightweight
committed-change hints to authenticated users. Custom hooks own connection lifecycle, handlers and
TanStack Query invalidation/refetch. One connection per signed-in app instance, not per component.

Rationale: user explicitly chose this compatible server/client pair for realtime messaging and
notifications. Keep existing CSRF-protected REST mutations, validation and idempotency intact.
Alternatives: periodic HTTP polling rejected as primary transport; a Socket.IO gateway adds an
unnecessary protocol/service boundary. No timer polling is required by the baseline design.

Reconnect and startup retries use bounded backoff; resubscribe and reconcile latest/history/read
state/count through REST after reconnect, foreground return or manual refresh. Handle multiple-page
gaps without advancing a watermark prematurely. Duplicate/out-of-order hints may refetch but cannot
create duplicate rows. Events can be lost: persistence and the notification outbox remain durable.
A visible disconnected state offers retry/manual refresh; do not silently pretend to be live.

Hub authentication must integrate the current cookie/session validator. Origin allowlist, session
expiry and server-side revocation apply to long-lived connections, not just initial handshake.
Stop delivery and terminate revoked/locked sessions; verify active recipient/session before dispatch.
Route user subscriptions from server identity only; no caller-chosen user/group membership. Never
send message bodies, private notes or credentials through event payloads/logs. Multi-instance scale
requires explicit supported routing/backplane design; baseline deploys a single API instance.

## Message validation and authorization

Decision: trim content, require1–4000 characters (UTF-16 units, matching current .NET bound), plain
text escaped by React; reject whitespace-only. Current active participant is checked for every
list/detail/send/read, including replay. Request lifecycle alone does not revoke conversation
membership; completed/cancelled/rejected requests retain history and may communicate under current
spec. Existing explicit Conversation.ClosedAt disables sends; no new close action is introduced.
Locked caller is denied. Counterpart account locking alone does not revoke the active caller’s
conversation membership; no delivery/read promise is made while the recipient is locked. No admin override endpoint.
Rationale: preserve the spec’s participant rule without inventing a new lifecycle restriction.

## Durable send replay and notification reliability

Decision: caller-generated UUID clientMessageId; unique(conversation,sender,clientMessageId), immutable
stored payload. Same identity/content returns original; same identity/different content409.
Message and notification intent commit together. Worker consumes intent with bounded retry/backoff;
unique(messageId,recipient) prevents duplicate notifications after restart/concurrent workers.
Intent stores IDs/type only, never message content. Notification body does not echo message text.
Rationale: FR-005/006 and SC-002; direct notification transaction failure would lose the message,
in-memory retry would lose notifications after restart. Existing hiring/review transactions stay
atomic as ADR-011; the new worker handles only message events.

## Pagination and read races

Decision: stable keyset(time,UUID) with validated opaque cursors bound to owner/filter/conversation
and initial upper boundary. Message history fetches newest page descending, UI reverses for
chronological display; older-page load prepends without scrolling away. Event-triggered or reconnect reconciliation fetches a
bounded latest page and merges by ID; if more than a page arrived, show load-newer and drain pages
before advancing watermark. Never silently skip a gap. Existing IDs are refreshed for readAt changes.
Read receipts accept at most100 displayed IDs and update only caller-received unread rows; no
watermark that could mark unloaded messages. Notification read-all uses first-page asOf boundary;
newer arrivals remain unread. Count/list computed from a consistent database snapshot.

## Concurrency and administrative privacy

Decision: use explicit UUID version for editable articles/catalog/account-admin projection; refresh
on409. Lock target account, update active/locked state + security stamp/revoke sessions + audit
atomically. Reject self-lock; do not add role promotion/deletion pathways. Serialize concurrent
administrators, validate active actor inside transaction, follow existing account lock ordering.
Audit allowlist stores actor/action/entity/time only; exclude credential/contact/message values,
free-form diffs and IP from API responses. Extend existing audit store, no duplicate audit table.
Alternatives: blind last-write-wins and logging entire request DTOs rejected.

## Articles, monitoring and dashboard

Decision: text-only articles (title1–256, slug1–256 unique, optional summary<=1000,
content1–50000); DRAFT/PUBLISHED/HIDDEN. Publish sets first publication time, retained on hide;
public reads filter PUBLISHED, never expose draft content via slug guessing. Render plain text,
no HTML execution. Admin monitor reads immutable request facts/status only, no chat content and
no accept/propose/cancel action. Dashboard uses repeatable-read, all canonical groups including
zeros, current snapshot asOf; no date-range analytics inferred from loose entity wording.

## Release dependency

Sprint3 tasks T046–T050 are still unchecked. Record them as release prerequisites, not completed
work. Sprint4 can develop against implemented lifecycle; final AC evidence must include those
remaining security/contracts/performance gates. Backup/restore uses a disposable database and
synthetic data; no production backup upload or deployment implied by this plan.

## Verified admin reuse details

Admin catalog create/update already audit atomically. Add version checks and database normalized
uniqueness after scanning existing duplicates; never silently merge referenced IDs. Bind private
catalog hooks to actor and move current inline queries out of components. Account status does not
need to alter tutor-profile state; avoid taking user then profile locks because review currently
takes profile then user. Document and test actual cross-module ordering before adding locks.
Existing review notification Body may contain private review notes: user-owned DTO only; never
copy it to logs/dashboard/audit/public payloads. Remove fabricated dashboard fallback counts and
notification badge3; zero is valid, failed loading must stay an error.
