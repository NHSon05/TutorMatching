# TutorMatching Agent Guide

Keep this file as a small router. Load only the context required by the current task.

## Explore efficiently

- Start with `rg --files` and targeted `rg` queries; open only likely sources of truth.
- Exclude generated or bulky paths unless the task targets them: `bin/`, `obj/`, `.next/`, `node_modules/`, coverage, build output, and lockfiles.
- Do not read the full SRS, schema, or repository map for a small localized change.
- Reuse facts already established in the current turn; do not reopen unchanged files without a reason.
- Keep command output narrow with path filters, line ranges, and result limits.

## Load project memory progressively

- `docs/agent-memory/PROJECT.md` contains stable project facts. Search its headings or keywords and read only relevant sections.
- `docs/agent-memory/SESSION.md` is the single current handoff. Read it only when resuming prior work, reporting status, or when the task depends on unfinished work.
- `docs/agent-memory/DECISIONS.md` contains durable decisions. Search by ADR ID, subsystem, or keyword; do not read the whole file unless auditing architecture.
- `docs/Final_SRS_TutorMatch_PBL3.pdf` is the product requirements source. Inspect only relevant pages/sections.
- `docs/DatabaseSchema.md` is the current data-model proposal. Use it for persistence or schema work.
- Under `frontend/`, also follow the generated `frontend/AGENTS.md` and consult only the relevant local Next.js documentation.

## Use Spec Kit for feature work

- Project governance lives in `.specify/memory/constitution.md`.
- Feature truth lives under `specs/<feature-id>/`: `spec.md` owns what/why, `plan.md` owns how,
  contracts own interfaces, and `tasks.md` owns executable work.
- Run `$speckit-specify` -> `$speckit-plan` -> `$speckit-tasks`; use clarify/checklist/analyze as
  quality gates and converge after implementation.
- Work on one task ID or one phase at a time; never load every feature artifact by default.
- Do not mark a task complete without the evidence required by its independent test/checkpoint.

## Implement and verify

- Preserve user changes and keep edits scoped to the request.
- Prefer the narrowest useful check first; expand to solution-wide checks when the change crosses boundaries or before a risky handoff.
- Backend commands and frontend commands are listed in `docs/agent-memory/PROJECT.md`.
- Do not claim completion without checking the relevant diff and verification result.
- Use a Codex Goal only for long, measurable work that needs continuation across turns; a Goal does not replace repository memory.

## Maintain memory at the end of material work

- Update memory only after code, architecture, durable decisions, blockers, or unfinished work materially change.
- Rewrite `PROJECT.md` in place when stable facts change; keep it at roughly 100 lines or fewer.
- Replace `SESSION.md` with one compact handoff for unfinished work; never append a session diary. Keep it at roughly 60 lines or fewer. If nothing remains, mark it idle and remove stale details.
- Append to `DECISIONS.md` only for durable architectural or product decisions. Keep each ADR at 12 lines or fewer.
- Never store transcripts, chain-of-thought, raw tool output, verbose logs, secrets, tokens, credentials, or personal data in memory.
- Prefer paths, test names, decisions, evidence, blockers, and the next executable step over narrative history.
- For read-only questions or changes with no durable effect, do not touch memory.
