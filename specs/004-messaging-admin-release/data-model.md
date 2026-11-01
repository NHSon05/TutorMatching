# Sprint4 persistence design

Proposal only; no migration applied. Source: current Domain entities/EF configurations and
`docs/DatabaseSchema.md` messaging/content sections. Physical identifiers remain snake_case.

## Existing aggregates retained

- Conversation: Id, unique HireRequestId, CreatedAt, optional ClosedAt; participants derived from
  immutable request learner/tutor ownership. No separate participant list or role reassignment.
- Message: Id, ConversationId, SenderUserId, Content<=4000, SentAt, nullable ReadAt/DeletedAt.
  Add nullable ClientMessageId for legacy compatibility; new sends require nonempty UUID.
  Partial unique index(conversation_id,sender_user_id,client_message_id) where not null.
  Index(conversation_id,sent_at,id); unread lookup(conversation_id,sender_user_id,read_at).
  No edit/delete interface. Replay compares stored canonical content, never modifies original.
- Notification: preserve TypeCode/Title/Body and optional request/message/profile references,
  UserId, CreatedAt, IsRead, ReadAt. New message notification uses generic text (no chat excerpt).
  Index(user_id,created_at,id); partial unread index(user_id,created_at,id) where is_read=false.
  Partial unique index(user_id,message_id) for new message events, guarded by type code if needed
  to preserve existing notification kinds. Preserve unknown legacy read times; normalize known
  inconsistent flag/time combinations explicitly, not by fabricating dates.
- Article: immutable AuthorUserId, title<=256, unique slug<=256, summary<=1000, plain content<=50000,
  status DRAFT/PUBLISHED/HIDDEN, PublishedAt, CreatedAt/UpdatedAt; add nonempty Guid Version.
  Publish DRAFT/HIDDEN -> PUBLISHED; hide PUBLISHED -> HIDDEN; edit retains lifecycle unless
  explicit publish/hide operation. First successful publish time remains after hide/republish.
- AuditEvent: reuse Id/ActorUserId/Action/EntityType/EntityId/CreatedAt; optional existing IP remains
  storage-internal, never returned. New administrative writes contain allowlisted metadata only.
  Index(created_at,id), optionally(actor_user_id,created_at,id) after query-plan checks.

## New MessageNotificationOutbox

Id, MessageId, RecipientUserId, CreatedAt, AttemptCount, NextAttemptAt, nullable DeliveredAt.
Unique(MessageId,RecipientUserId); required message/recipient references; no content/body/token.
Message + intent in one transaction. Claim pending rows with bounded batch and row locks;
notification insertion + delivered marker in one transaction. Crash before commit retries safely.
Failures persist attempts/backoff without discarding intent, produce sanitized event-ID diagnostics.
Backlog count/oldest age visible in health/evidence, not message content. Do not add a broker.
If worker cannot persist retry metadata, rollback and retry later; message remains committed.

## Account/catalog concurrency

Add administrative UUID version to account (do not expose/reuse security stamp as HTTP token).
Lock/unlock accepts expectedVersion and confirmed=true; atomically update status/version,
rotate security stamp, revoke sessions and append audit. Unlock never resurrects old sessions.
Keep referenced requests/messages and tutor approval history intact; public discovery already
filters active accounts. Reject self-lock and prevent loss of usable administrator path under
concurrency; serialize relevant actor/target checks consistently with existing review/hiring locks.

Add version fields to subject/province/district/teaching-level write contracts; normalize uniqueness
using database-enforced equivalent of existing application comparison after duplicate preflight.
Keep IDs/codes and references; inactive values remain readable in historical snapshots.
No hard-delete or automatic duplicate merge. Controlled migration failure with repair instructions
is preferable to changing historical identity silently.

## Transactional read models

Message/history and conversation list: participant scope + active actor, deterministic keyset,
pageSize1–100 default20; newest page with explicit chronological ordering in UI.
Read receipt mutation updates only received IDs from that conversation, preserves first ReadAt.
Notifications: owner scope on every query/mutation; read-all applies only through initial server
boundary, not future messages. List and unread count consistent per snapshot.
Admin monitor: read-only safe identities/status/times/terms summaries without private location,
messages or participant action DTOs. Dashboard grouped canonical counts at one repeatable-read
snapshot with asOf, including zero groups. Audit projection excludes IpAddress and private joins.

## Migration/rollback verification

Additive migration and preflight: check duplicate client identities, normalized catalog names,
notification event identities, existing lengths and statuses before constraints. Backfill versions
with unique values; legacy message IDs stay null, preserving read/content/times. No guessed audit
actors. Test upgrade on fresh and populated synthetic databases and failed-preflight recovery.
Block destructive downgrade after new replay/outbox data would be lost. Record backup and restore
commands against disposable databases before any real environment upgrade.


## SignalR delivery boundary

SignalR adds no message-history store. Message/receipt/notification writes remain authoritative in
PostgreSQL. Emit event hints only after commit; a failed push does not undo the committed change.
DeliveredAt on notification intent tracks notification persistence, not client acknowledgement.
REST reconciliation recovers missed events; realtime clients cannot bypass read authorization.
