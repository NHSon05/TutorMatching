# Application ports (T010)

These contracts support Sprint 1 FR-001 through FR-017 without referencing ASP.NET,
EF Core, Identity, SMTP libraries, or Infrastructure entities.

| Port              | Responsibility                                                          | Implementation task          |
| ----------------- | ----------------------------------------------------------------------- | ---------------------------- |
| `ICurrentUser`    | Trusted current identity; anonymous requests have null user/role        | T034                         |
| `IClock`          | UTC time, replaceable for expiry and lockout tests                      | Session/reset infrastructure |
| `IEmailSender`    | Plain-text SMTP delivery or deterministic test capture; no body logging | T014                         |
| `IAuditWriter`    | Allowlisted account events containing identifiers only                  | T013                         |
| `IAccountService` | Identity, private profile and recovery operations                       | T021, T028, T041, T048       |

Application use cases validate input (including password confirmation), enforce ownership
using `ICurrentUser`, and orchestrate these ports. Infrastructure adapters also enforce
critical invariants such as allowed registration roles, uniqueness and atomic updates.
Api maps expected failure codes to the versioned HTTP/Problem Details contract (T012).
`AccountProfile` contains private data and must not be returned by public tutor endpoints.

The recovery adapter uses `IEmailSender`; raw tokens never appear in result objects.
Do not log service arguments, email contents or private profile objects. Audit adapters
must reject undefined enum values; enumerations alone do not perform runtime validation.

T010 defines contracts only. It does not implement authentication, persistence operations,
SMTP, audit writes, dependency-injection registrations, or HTTP endpoints.
