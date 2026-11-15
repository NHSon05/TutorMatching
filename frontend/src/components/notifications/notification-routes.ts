import type { NotificationTarget } from "@/lib/api/notifications";

export type NotificationViewerRole = "LEARNER" | "TUTOR" | "ADMIN";

/**
 * Maps an allowlisted server target kind to an internal route. The server never
 * supplies a URL, and an unknown kind or role yields no navigation.
 */
export function notificationHref(
  target: NotificationTarget,
  role: NotificationViewerRole | undefined
): string | null {
  const id = encodeURIComponent(target.id);
  switch (target.kind) {
    case "HIRE_REQUEST":
      if (role === "LEARNER") return `/learner/requests/${id}`;
      if (role === "TUTOR") return `/request/${id}`;
      return null;
    case "CONVERSATION":
      return role === "LEARNER" || role === "TUTOR"
        ? `/messages?conversationId=${id}`
        : null;
    case "TUTOR_PROFILE":
      return role === "TUTOR" ? "/profile" : null;
    default:
      return null;
  }
}
