"use client";

import { useSession } from "@/hooks/use-session";
import { useSignalREvents } from "@/hooks/use-signalr-events";
import { useUnreadMessageCount } from "@/hooks/use-notifications";

/** Unread incoming messages for the signed-in user (0 when signed out). */
export function useMessengerBadge(): number {
  const { data: session } = useSession();
  const signedIn = Boolean(session?.id);
  // Shares the ref-counted hub connection so message events refresh the badge.
  useSignalREvents();
  const { data } = useUnreadMessageCount(signedIn);
  return signedIn ? (data ?? 0) : 0;
}

/** Compact badge text: 1–99, then "99+". */
export function formatBadgeCount(count: number): string {
  return count > 99 ? "99+" : String(count);
}
