"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui";
import { LogOutIcon, UserProfileIcon } from "@/components/icons";
import { useLogout } from "@/hooks/use-auth";
import { POST_LOGOUT_PATH } from "@/lib/auth/logout-redirect";
import { AUTH_OUT_TYPES } from "@/lib/navigation/transition-types";

export interface AccountMenuProps {
  name: string;
  avatarSrc?: string | null;
  initials: string;
  /** Secondary line under the name (e.g. role label). */
  subtitle?: string;
  /** Forwarded to the trigger Avatar for tests. */
  avatarTestId?: string;
}

/** Avatar button that opens a menu with "Tài khoản" and "Đăng xuất". */
export function AccountMenu({ name, avatarSrc, initials, subtitle, avatarTestId }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const { mutateAsync: logout, isPending } = useLogout();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    // Move focus into the menu so keyboard users land on the first item.
    rootRef.current?.querySelector<HTMLElement>("[role='menuitem']")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  async function handleLogout() {
    if (isPending) return;
    setError("");
    try {
      await logout();
      setOpen(false);
      router.replace(POST_LOGOUT_PATH, { transitionTypes: AUTH_OUT_TYPES });
    } catch {
      setError("Đăng xuất chưa thành công. Vui lòng thử lại.");
    }
  }

  const itemClass =
    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-content-primary hover:bg-gray-900/5 focus:bg-gray-900/5 focus:outline-none disabled:opacity-60";

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Tài khoản của ${name}`}
        title={name}
        onClick={() => setOpen((value) => !value)}
        className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
      >
        <Avatar
          src={avatarSrc ?? undefined}
          alt={name}
          fallbackText={initials}
          data-testid={avatarTestId}
          className="border-2 border-white dark:border-gray-800 shadow-xs"
        />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Tài khoản"
          className="absolute right-0 top-full z-50 mt-2 w-60 rounded-2xl border border-border-default bg-surface-card p-2 shadow-xl"
        >
          <div className="px-3 py-2 border-b border-border-default mb-1">
            <p className="truncate text-sm font-semibold text-content-primary">{name}</p>
            {subtitle && <p className="truncate text-xs text-content-secondary">{subtitle}</p>}
          </div>
          <Link href="/profile" role="menuitem" onClick={() => setOpen(false)} className={itemClass}>
            <UserProfileIcon className="w-4 h-4 text-content-secondary" />
            Tài khoản
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            disabled={isPending}
            aria-busy={isPending}
            className={`${itemClass} text-status-error`}
          >
            <LogOutIcon className="w-4 h-4" />
            {isPending ? "Đang đăng xuất..." : "Đăng xuất"}
          </button>
          {error && (
            <p role="alert" className="px-3 pt-2 text-xs text-status-error">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
