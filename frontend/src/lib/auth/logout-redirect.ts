/** Where the user lands after an intentional logout. */
export const POST_LOGOUT_PATH = "/";

// Recorded when the user signs out on purpose so AuthGuard sends them to the landing page instead
// of /login when the cleared session reaches a protected layout. It expires quickly, so a later
// session expiry or guest visit to a protected page still goes to /login.
const SIGNED_OUT_WINDOW_MS = 5_000;
let userSignedOutAt = 0;

export function markUserSignedOut(): void {
  userSignedOutAt = Date.now();
}

/** Returns true once, right after an intentional logout. */
export function consumeUserSignedOut(): boolean {
  const recent = Date.now() - userSignedOutAt < SIGNED_OUT_WINDOW_MS;
  userSignedOutAt = 0;
  return recent;
}
