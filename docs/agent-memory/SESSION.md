# Current Session Handoff

- **Active feature**: `010-google-oauth` (Sign in / register with Google), prioritized by the product owner on 2026-11-14. Branch is still `feat/hire-negotiation`; nothing committed.
- **Done**: T001–T035, T037–T039, T041 (39/46). End-to-end Google sign-in on `/login`: GIS-rendered button (`GoogleSignInButton`), `POST /api/v1/auth/google` (200 session / 202 role_required / 401 generic), `GoogleRoleDialog` (LEARNER "Học viên" / TUTOR "Gia sư") → `POST /api/v1/auth/google/complete` (201). Auto-link by verified email, ADMIN/locked/unverified refused, race-safe creation, Google avatar on new accounts.
- **Key code**: `Application/Authentication/Google/*Handler.cs`, `Infrastructure/Authentication/IdentityExternalAccountService.cs`, `GoogleIdTokenVerifier.cs`, `DataProtectionPendingGoogleRegistrationProtector.cs`, `AuthController` Google actions, OpenAPI transformer entries in `Api/OpenApi/OpenApiExtensions.cs`; frontend `components/auth/GoogleSignInButton.tsx`, `GoogleRoleDialog.tsx`, `hooks/use-auth.ts`, `lib/auth/session.ts`, `types/google-identity.d.ts`.
- **Evidence (2026-11-14)**: Domain 139/139, Application 117/117, API integration 345/345 (incl. `GoogleAuthTests`, contract parity); Vitest `GoogleSignIn` 8/8, `LoginForm` 6/6; tsc/eslint clean on changed files.
- **Open tasks**: T036 add the button to `RegisterCard`; T040 add 429 + log-capture checks; T042 Playwright `google-auth.spec.ts`; T043 PROJECT-MAP; T044–T046 quickstart evidence, full gates, converge + PROJECT/DECISIONS update.
- **To try locally**: set `Google__ClientId` (backend `.env`) and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (frontend `.env.local`) to the same Web client ID with `http://localhost:3000` as an authorized JavaScript origin, then restart API and `next dev`.

## Not caused by 010 (parallel work in the same working tree)

- 4 failing Vitest tests: `hire-close`, `tutor-detail`, `PaymentCheckoutDialog`, `TutorDashboardClient` (UI text/buttons changed in uncommitted hiring/tutor edits).
- Pre-existing lint errors (`react-hooks/set-state-in-effect`) in `HireRequestDetail.tsx` and `LeaveReviewDialog.tsx`.
- Remaining MVP gaps after OAuth: password reset (001 US5), notifications (004 US2), admin users/lock (004 US3), articles/monitoring (004 US4), dashboard/audit (004 US5), release gates (004 US6) — re-verify, parallel work may have changed them.
