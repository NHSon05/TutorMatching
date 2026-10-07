# Quickstart Validation: Foundation and Accounts

Use this guide after implementation. It validates behavior; it does not replace automated tests or
the API contract.

## Prerequisites

- .NET 10 SDK and Node.js version supported by the repository.
- PostgreSQL available with a disposable development database.
- Environment configuration copied from committed examples; no real secrets committed.
- SMTP sandbox configured for manual password-reset validation, or the test email adapter enabled.

## Start the system

```bash
dotnet build backend/TutorMatching.slnx
dotnet run --project backend/src/TutorMatching.Api
npm --prefix frontend run dev
```

## Automated validation

Docker Desktop must be running for the PostgreSQL-backed API fixtures (T015). They create
their own container and a database per factory, apply migrations, capture email in memory,
and remove the container at teardown. They do not use the database from `backend/.env`.
The OpenAPI contract test (T017) checks currently implemented `/api/v1` operations; the
remaining account journeys below require their later story tasks before they can pass.

```bash
dotnet test backend/TutorMatching.slnx
npm --prefix frontend run lint
npm --prefix frontend run build
npm --prefix frontend run test
npm --prefix frontend run test:e2e
```

If the frontend test scripts have not yet been added, their absence is a failed foundational task,
not permission to skip the checks.

In Development, inspect `/openapi/v1.json` on the API host for the generated v1 document.

## Independent journey checks

### 1. Registration

1. Register one learner and one tutor using unique test emails.
2. Confirm both accounts are active and have the correct role.
3. Retry a normalized duplicate email and confirm no duplicate account is created.
4. Submit the Admin role directly and confirm rejection.

Expected: registration satisfies US1 and does not expose password or credential data.

### 2. Sign-in and sign-out

1. Sign in using an active test account.
2. Open the private profile successfully.
3. Sign out and retry the private request using the previous browser session.

Expected: the post-logout request is unauthorized; wrong credentials use a generic error.

### 3. Authorization

1. Request a private endpoint without signing in.
2. Attempt a role-restricted action with the wrong role.
3. Attempt to alter another account by changing IDs or request payloads.

Expected: requests are denied as unauthenticated or forbidden and no target data changes.

### 4. Personal profile

1. Update full name, optional phone, birth date, and avatar for the signed-in account.
2. Reload and confirm persistence.
3. Attempt a duplicate phone value and verify that prior valid data remains unchanged.

Expected: only the owner can view/update the private profile and conflicts are atomic.

### 5. Password reset

1. Request reset for an existing and a non-existing email and compare visible responses.
2. Complete reset once using the sandbox message.
3. Retry the same reset credential and the old password.

Expected: external request responses are indistinguishable; token reuse and old-password sign-in
fail; the new password succeeds.

## Security evidence

- Inspect public API responses and application/test logs for password, cookie, raw reset token,
  email, phone, birth date, or exact address leakage.
- Confirm the session cookie is HTTP-only and secure outside local development.
- Confirm state-changing cookie-authenticated requests reject missing/invalid anti-forgery proof.
- Run the configured repeated-login test and confirm temporary lockout at five failures.

## Completion evidence

Record the commit/PR, exact commands, pass/fail results, known limitations, and screenshots for the
five journeys. Mark a Spec Kit task complete only when its referenced evidence exists.
