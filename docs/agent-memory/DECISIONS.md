# TutorMatching Decision Memory

Search by ADR ID, subsystem, or keyword. Add only durable decisions; keep each ADR at 12 lines or fewer.

## ADR-001 - Repository-backed progressive memory

- Date: 2026-10-02
- Status: Accepted
- Context: Codex sessions need continuity without replaying full transcripts or loading all project documentation.
- Decision: Keep a short root `AGENTS.md` router, stable facts in `PROJECT.md`, one replaceable handoff in `SESSION.md`, and compact durable decisions in this file.
- Decision: Track all memory files in Git; update them only after material changes and never store secrets, personal data, raw logs, or transcripts.
- Consequence: New sessions search and load only relevant memory, while completed session history is intentionally discarded.
- Consequence: Contributors must repair stale memory when a code or product change invalidates it.

## ADR-002 - Spec Kit for feature delivery

- Date: 2026-10-02
- Status: Accepted
- Context: A single sprint document mixed requirements, design, tests, status, and AI guidance.
- Decision: Use the official Spec Kit constitution and one `specs/<feature-id>/` artifact set per feature.
- Decision: Keep reusable AI guidance in `docs/guides/AI-WORKFLOW.md`; sprint pages are short indexes.
- Consequence: Review gates follow specify, plan, tasks, analyze, implement, and converge artifacts.
- Consequence: Application behavior is not implemented until its feature tasks and gates are ready.
