# Physical naming

Logical entities, types, nullability, relationships and security state are unchanged.

| Old table | New table |
|---|---|
| UserAccounts | user_accounts |
| AuditEvents | audit_events |
| TokenSessions | token_sessions |
| SessionRefreshTokens | session_refresh_tokens |
| AspNetRoles | asp_net_roles |
| AspNetRoleClaims | asp_net_role_claims |
| AspNetUserRoles | asp_net_user_roles |
| AspNetUserClaims | asp_net_user_claims |
| AspNetUserLogins | asp_net_user_logins |
| AspNetUserTokens | asp_net_user_tokens |
| __EFMigrationsHistory | ef_migrations_history |

Columns and constraint/index/sequence identifiers use deterministic acronym-aware snake_case.
Legacy RevokedAt/ConsumedAt columns are retained as revoked_at/consumed_at.

Approved security follow-up: revoked_at/consumed_at become the sole persisted state in all
installations; is_revoked/is_used are removed. NULL means no transition; PostgreSQL -infinity
means a historical transition with unknown time; finite values are actual event times.
Existing known timestamps take precedence over inconsistent false booleans. True booleans
with no timestamp must not be reactivated. Role remains a login snapshot checked against
current Identity membership on every validation and refresh.
