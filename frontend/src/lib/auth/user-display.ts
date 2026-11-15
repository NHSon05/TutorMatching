import type { AccountResponse } from "@/lib/api/auth";
import { resolveAvatarUrl } from "@/lib/api/profile";

export interface UserDisplay {
  /** Full name shown in navbars/sidebars. */
  name: string;
  /** Absolute, displayable avatar URL (Google picture or API upload), or undefined for initials. */
  avatarSrc?: string;
  /** Up to two letters used when there is no avatar. */
  initials: string;
}

/** "Nguyễn Văn Minh" → "VM": last two name parts, as Vietnamese names read. */
export function nameInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(-2)
    .map(part => part[0]!.toUpperCase())
    .join("");
}

/**
 * Single source for how the signed-in user appears in every navbar and sidebar, so name and avatar
 * stay in sync after login, Google sign-up and profile edits (all of which update the session cache).
 */
export function toUserDisplay(
  account: Pick<AccountResponse, "fullName" | "avatarUrl"> | null | undefined,
  fallbackName: string,
): UserDisplay {
  const name = account?.fullName?.trim() || fallbackName;
  return {
    name,
    avatarSrc: resolveAvatarUrl(account?.avatarUrl),
    initials: nameInitials(name),
  };
}
