# Data Model

All names below are logical C# fields; physical names follow existing snake_case conventions.

## HireRequest

Retain existing participant, subject/course, start date, frequency, duration, mode, location, price,
status and timestamps. Add Version (Guid concurrency token), ListedPriceVnd snapshot,
LatestProposalSequence, NextEventSequence and immutable FinalAgreement snapshot (nullable until accepted).
FinalAgreement contains accepted proposal sequence (null for initial offer), price, schedule, start
date, frequency, duration, mode, province/district codes and labels, location detail, actor and UTC time.
Initial request terms remain available independently from later proposals. Current terms are latest
proposal or initial terms; final terms come only from FinalAgreement after acceptance.

## RequestSchedule / NegotiationSchedule

Existing parent FK, ISO DayOfWeek 1–7, StartTime and EndTime. Require StartTime < EndTime, no overlapping
or duplicate windows and positive available capacity sufficient for frequency at requested duration.
Schedule validation uses current availability under the profile lock. These are weekly preferences,
not an appointment reservation system.

## Negotiation

Existing ID, request FK, sender, note and CreatedAt. Add unique per-request Sequence and effective
full price/schedule snapshot (omitted proposal fields inherit latest terms). Require at least one
changed price or schedule. Proposal payload is immutable. Acceptance is recorded on request agreement
and status event, not by editing proposal terms. Existing ResponseStatusCode/RespondedAt fields are
legacy; migrate known facts explicitly and do not expose them as a competing source of truth.

## RequestStatusHistory

Existing actor, from/to states, reason and CreatedAt; add unique per-request Sequence. Creation has
null previous state. Each mutation appends an event; NEGOTIATING to NEGOTIATING is a valid event for
a new proposal. Order by Sequence, never timestamp alone. Failed/replayed operations add no event.

## HireCreateOperation (new)

LearnerId + IdempotencyKey unique; canonical payload fingerprint, RequestId unique, original creation
response and CreatedAt. Exclude secrets. Canonicalization includes sorted schedules and normalized
optional strings. Store inside the same transaction; no TTL during request lifetime.

## Conversation / Notification

Reuse existing unique Conversation.HireRequestId. Create exactly one conversation and one notification
at creation; append one recipient notification per subsequent successful action. All writes share
the business transaction. No notification body needs private location or user contact information.

## Lifecycle

| Current | Action/actor | Next |
| --- | --- | --- |
| none | learner create at listed price | PENDING |
| none | learner create at alternate price | NEGOTIATING |
| PENDING/NEGOTIATING | tutor accepts initial offer if no proposal exists | ACCEPTED |
| PENDING/NEGOTIATING | either participant proposes | NEGOTIATING |
| NEGOTIATING | recipient accepts latest proposal | ACCEPTED |
| PENDING/NEGOTIATING | tutor rejects with reason | REJECTED |
| PENDING/NEGOTIATING | learner confirms cancellation | CANCELLED |
| ACCEPTED | either confirms cancellation with reason | CANCELLED |
| ACCEPTED | either confirms completion | COMPLETED |

All actions check expectedVersion. No proposal/action mutates terminal states. ACCEPTED cannot be
renegotiated or rejected. Completion is participant attestation that teaching concluded; no recurring
lesson/end-date subsystem is introduced.

## Constraints and migration

Validate active learner/tutor accounts, approved public tutor, active offered subject/course,
no self-hire, future start date at creation, frequency 1–21, duration 30–240, positive int32 VND,
valid offered mode, valid province/district for OFFLINE/HYBRID. Notes max 2000; reasons max 1000;
location detail max 500. Listed price is selected course rate when a course is chosen, otherwise
profile session rate, checked at creation. A stale displayed listed price produces 409 for refresh.
Historical start dates do not invalidate terminal actions; acceptance/proposals require a future
start date, and expired open requests can still be cancelled/rejected.

Add participant/status/CreatedAt/Id indexes and unique proposal/event sequences. Populate concurrency
tokens and deterministic legacy sequence before constraints. Preflight unrecoverable legacy agreement
snapshots; do not fabricate history or drop data. Verify upgrades from existing fixtures and rollback
behavior before applying to a user database. Additions to schema proposal follow reviewed migration.
