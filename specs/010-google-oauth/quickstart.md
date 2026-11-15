# Quickstart Validation: Sign In and Register with Google

Run from the repository root. Record exact pass/fail results in `evidence.md` of this feature.

## Prerequisites

1. Google Cloud Console → APIs & Services → Credentials → OAuth client ID, type **Web application**.
   - Authorized JavaScript origins: `http://localhost:3000` and the deployed frontend origin.
   - OAuth consent screen scopes: `openid`, `email`, `profile`. Add test users while in Testing mode.
2. Backend `backend/.env`: `Google__ClientId=<client id>`.
3. Frontend `frontend/.env.local`: `NEXT_PUBLIC_GOOGLE_CLIENT_ID=<same client id>`.
4. Local services: `docker compose --env-file backend/.env -f backend/compose.yaml up -d --wait`.
5. Apply the migration: `dotnet run --project backend/tools/TutorMatching.DatabaseMigrator`.

## Automated checks

| Check | Command | Expected |
|---|---|---|
| Domain + Application unit | `dotnet test backend/TutorMatching.slnx --filter "FullyQualifiedName~GoogleSignIn"` | All pass |
| API integration (fake verifier) | `dotnet test backend/tests/TutorMatching.Api.IntegrationTests --filter "FullyQualifiedName~GoogleAuth"` | All pass, no outbound call to Google |
| Contract parity | `dotnet test backend/tests/TutorMatching.Api.IntegrationTests --filter "FullyQualifiedName~OpenApiContract"` | Both operations match [contracts/openapi.json](contracts/openapi.json) |
| Regression: password auth | `dotnet test backend/tests/TutorMatching.Api.IntegrationTests --filter "FullyQualifiedName~Auth"` | Unchanged results (SC-007) |
| Frontend components | `npm --prefix frontend run test -- GoogleSignIn` | All pass |
| Frontend lint/build | `npm --prefix frontend run lint && npm --prefix frontend run build` | No new errors |
| E2E (mocked Google) | `npm --prefix frontend run test:e2e -- google-auth.spec.ts` | All pass |

## Manual scenarios (real Google account)

Start the API (`dotnet run --project backend/src/TutorMatching.Api`) and the frontend
(`npm --prefix frontend run dev`).

1. **US2 register**: with a Google account whose email is unused, choose "Tiếp tục với Google" on
   `/register`, choose Học Sinh → you land on `/` signed in; the avatar is the Google picture.
2. **US1 return**: sign out, choose Google on `/login` → you are signed in without the role step.
3. **US2 tutor**: with another unused Google account, choose Gia sư → you land on `/onboarding`.
4. **US3 link**: register `x@gmail.com` with a password, then sign in with Google as `x@gmail.com` →
   same account, no role step; password sign-in still works.
5. **US4 admin**: Google sign-in with the seeded admin email → generic error; no session.
6. **US4 locked**: lock a learner account in the database, then try Google → the same generic error.
7. **Expiry**: reach the role step, wait more than 10 minutes, choose a role → the flow asks you to
   restart Google sign-in; no account exists.
8. **Privacy**: search API logs and the audit events table for `eyJ` (JWT prefix) and the test email →
   zero matches (SC-006).
