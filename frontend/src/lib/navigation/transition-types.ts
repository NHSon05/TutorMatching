/**
 * React view-transition types attached to navigations (Link `transitionTypes`,
 * router.push/replace `{ transitionTypes }`). PageTransition maps them to the
 * CSS classes defined in globals.css.
 */
/** Guest opens the login or register screen (landing, footer, auth cross-links). */
export const AUTH_OPEN = "auth-open";
/** Successful sign-in: entering the workspace. */
export const AUTH_IN = "auth-in";
/** Sign-out: leaving the workspace back to login. */
export const AUTH_OUT = "auth-out";

export const AUTH_OPEN_TYPES = [AUTH_OPEN];
export const AUTH_IN_TYPES = [AUTH_IN];
export const AUTH_OUT_TYPES = [AUTH_OUT];
