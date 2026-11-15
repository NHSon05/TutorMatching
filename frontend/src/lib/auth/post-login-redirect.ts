import type { useRouter } from "next/navigation";
import type { TutorProfileStatus, UserRole } from "@/types";
import { AUTH_IN_TYPES } from "@/lib/navigation/transition-types";

type PushRouter = Pick<ReturnType<typeof useRouter>, "push">;

/**
 * Destination after any successful sign-in (password or Google): admins go to the dashboard,
 * tutors without an approved profile go to onboarding, everyone else goes home.
 */
export function postSignInPath(role: UserRole, tutorProfileStatus?: TutorProfileStatus | null): string {
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "TUTOR" && tutorProfileStatus !== "APPROVED") return "/onboarding";
  return "/";
}

export function redirectAfterSignIn(
  router: PushRouter,
  role: UserRole,
  tutorProfileStatus?: TutorProfileStatus | null,
): void {
  router.push(postSignInPath(role, tutorProfileStatus), { transitionTypes: AUTH_IN_TYPES });
}
