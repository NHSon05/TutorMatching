# Data Model: Sign In and Register with Google

## Existing entities reused

### ApplicationUser (`user_accounts`)

No column changes.

| Field | Rule for Google flows |
|---|---|
| `email` / `normalized_email` | From the verified Google email; unique (existing index) |
| `email_confirmed` | `true` for accounts created through Google |
| `password_hash` | `null` for Google-created accounts; password sign-in then fails as `InvalidCredentials` |
| `full_name` | Google `name`, trimmed; if shorter than 2 characters, use the email local part; truncate to 100 |
| `avatar_url` | Google `picture` for new accounts only (≤ 2048); never overwritten when linking |
| `role` | `LEARNER` or `TUTOR` from the role step; `ADMIN` never assigned or linked |
| `status` | `ACTIVE` on creation; sign-in refused unless `ACTIVE` and `deleted_at` is null |
| `last_login_at` | Updated on every successful Google sign-in, as for password sign-in |

### TutorProfile (`tutor_profiles`)

Created with `status = DRAFT` in the same transaction when the role is `TUTOR` (same as password
registration).

### External login link (`asp_net_user_logins`, Identity)

| Column | Value |
|---|---|
| `login_provider` | `Google` |
| `provider_key` | Google `sub` (stable account id) |
| `provider_display_name` | `Google` |
| `user_id` | FK to `user_accounts.id` |

Constraints:

- Existing PK `(login_provider, provider_key)`: one account per Google identity.
- **New** unique index `ux_asp_net_user_logins_user_id_login_provider` on `(user_id, login_provider)`:
  at most one Google link per account. Migration name: `AddExternalLoginUniqueness`.

### Audit event (`AuditEvents`)

`Action` is stored as a string (max 100, no check constraint), so new enum values need no migration.
New `AccountAuditAction` values:

| Action | Actor | Entity |
|---|---|---|
| `ExternalSignInSucceeded` | user | user |
| `ExternalSignInFailed` | null | user id when known, else null |
| `ExternalLoginLinked` | user | user |
| `ExternalAccountRegistered` | user | user |

Audit records never contain the ID token, pending token, email, or name.

## Transient objects

### ExternalIdentity (Application DTO)

`Subject` (required, ≤ 255), `Email` (required, ≤ 256), `EmailVerified` (bool), `FullName`
(nullable), `PictureUrl` (nullable, absolute https URL ≤ 2048).

### Pending Google registration (protected token)

Serialized `ExternalIdentity`, protected with purpose `TutorMatching.GoogleSignup.v1` and a 10-minute
lifetime. Not persisted. Accepted once per account creation; a replay after the account exists
resolves to normal Google sign-in for the same subject.

## Decision flow

```text
verify credential ──invalid / !email_verified──► 401 (ExternalSignInFailed)
        │
        ▼
FindByLogin(Google, sub) ──found──► eligible? (ACTIVE, not deleted, not ADMIN)
        │                              ├─ yes ► session 200 (ExternalSignInSucceeded)
        │                              └─ no  ► 401
        ▼ not found
FindByEmail(email) ──found──► eligible and no Google link?
        │                       ├─ yes ► AddLogin + session 200 (Linked + SignInSucceeded)
        │                       └─ no  ► 401
        ▼ not found
202 { pendingToken } ──complete(role LEARNER|TUTOR)──► create user (+DRAFT tutor profile)
                                                      + AddLogin in one transaction
                                                      ► session 201 (ExternalAccountRegistered)
```
