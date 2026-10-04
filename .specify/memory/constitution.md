<!--
Sync Impact Report
- Version change: template -> 1.0.0
- Added principles: SRS traceability, security/privacy, layered boundaries,
  evidence-first delivery, MVP simplicity
- Added sections: Product and Technology Constraints, Development Workflow
- Removed sections: none
- Follow-up TODOs: none
-->
# TutorMatching Constitution

## Core Principles

### I. SRS Traceability Is Mandatory

Every feature MUST identify the SRS functional requirements, use cases, business rules,
non-functional requirements, and acceptance criteria that justify it. A behavior that conflicts
with the SRS MUST NOT be implemented until an approved change request updates the source
requirements. Specifications describe user value and observable behavior; implementation details
belong in plans and contracts. Rationale: traceability prevents backlog items and generated code
from silently changing the agreed PBL3 scope.

### II. Security and Privacy by Default

Authorization MUST be enforced by the backend for every protected operation; hiding a UI control
is never sufficient. Passwords and tokens MUST be hashed or protected using maintained security
libraries, MUST have appropriate expiry/revocation rules, and MUST NOT appear in logs. Public
responses MUST exclude email, phone, birth date, exact address, credentials, and private messages.
Tests MUST cover authentication failure, role denial, ownership denial, and account enumeration.
Rationale: account and messaging data are private even in a classroom MVP.

### III. Layered Boundaries and Explicit Contracts

Domain rules MUST remain independent of web frameworks and infrastructure. Application use cases
MUST depend on abstractions; Infrastructure implements persistence and integrations; Api is the
HTTP composition boundary. Frontend/backend exchanges MUST use versioned JSON contracts documented
in OpenAPI. Database migrations, API contracts, and status values MUST be versioned and reviewed.
Rationale: explicit boundaries keep the .NET solution maintainable and independently testable.

### IV. Evidence-First, Independently Testable Delivery

Each prioritized user story MUST define an independent test and measurable acceptance scenarios.
Implementation tasks MUST include the smallest relevant unit, integration, contract, authorization,
or UI tests. A task is complete only when its required checks run successfully and the diff,
contract, migration, and documentation agree. Spreadsheet status or generated code alone is not
evidence of completion. Rationale: PBL3 acceptance requires demonstrable behavior, not activity.

### V. MVP Simplicity and Progressive Context

The team MUST choose the simplest design that satisfies the SRS and current measurable scale.
Online payments, e-contracts, video calls, maps/distance, AI tutor recommendations, mobile apps,
automatic credential verification, disputes, and refunds remain outside MVP unless an approved
change request adds them. Specifications and agent instructions MUST link to sources instead of
duplicating large documents; agents read only task-relevant context. Rationale: limited PBL3 time
must be spent on complete core journeys rather than speculative complexity.

## Product and Technology Constraints

- The product is a responsive web application with a Next.js frontend and ASP.NET Core backend.
- The backend is organized as Api, Application, Domain, and Infrastructure projects.
- Data is stored in a relational database; VND prices are positive integers and time handling is
  consistent across persistence and API contracts.
- Public tutor search includes only approved profiles belonging to active accounts.
- Account roles use one canonical persisted value per role. Naming conflicts in the SRS MUST be
  resolved in feature research before authorization or migrations are implemented.
- The system MUST use environment-based configuration, parameterized queries or an ORM, HTTPS in
  deployed environments, structured error responses, and logs without secrets or private content.

## Development Workflow

1. Run Spec Kit in order: specify, clarify when needed, plan, checklist, tasks, analyze, implement,
   then converge.
2. `spec.md` owns what and why; `plan.md` owns technology and architecture; contracts own external
   interfaces; `tasks.md` owns dependency-ordered implementation work.
3. Every user story MUST remain independently demonstrable after foundational tasks are complete.
4. Tests for required behavior are written before or with implementation and MUST demonstrate the
   failing path as well as the happy path.
5. Review gates MUST reject unresolved requirement clarifications, constitution violations without
   justification, missing authorization tests, undocumented contract changes, or failed checks.
6. AI-generated changes receive the same human review, security review, and evidence requirements
   as human-authored changes. Secrets and real personal data MUST NOT be provided to AI tools.

## Governance

This constitution supersedes local conventions when they conflict. Amendments require a documented
reason, impact on existing specifications/tasks, migration needs, and reviewer approval. Versioning
follows semantic versioning: MAJOR for incompatible governance changes, MINOR for new or materially
expanded principles, and PATCH for non-semantic clarification. Every feature plan MUST perform a
constitution check before research and again after design. Reviewers MUST verify compliance before
implementation begins and before a feature is marked complete. Runtime agent guidance remains in
`AGENTS.md`; durable project facts remain in `docs/agent-memory/`.

**Version**: 1.0.0 | **Ratified**: 2026-10-02 | **Last Amended**: 2026-10-02
