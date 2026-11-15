"use client";

import * as React from "react";
import { IconButton } from "@/components/ui";
import { BellIcon } from "@/components/icons";
import { useSession } from "@/hooks/use-session";
import { useSignalREvents } from "@/hooks/use-signalr-events";
import { useUnreadNotificationCount } from "@/hooks/use-notifications";
import { NotificationList } from "./NotificationList";

export interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className = "" }: NotificationBellProps) {
  const { data: session } = useSession();
  const signedIn = Boolean(session?.id);
  // Keeps the shared hub connection alive so NotificationsChanged refreshes the badge.
  useSignalREvents();
  const unread = useUnreadNotificationCount(signedIn);
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const panelId = React.useId();

  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!signedIn) return null;

  const count = unread.data?.unreadCount ?? 0;
  const label = count > 0 ? `Thông báo, ${count} chưa đọc` : "Thông báo";

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <IconButton
        aria-label={label}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-haspopup="dialog"
        variant="ghost"
        shape="circle"
        size="small"
        icon={<BellIcon className="w-5 h-5" />}
        badge={count > 0 ? (count > 99 ? "99+" : count) : undefined}
        onClick={() => setOpen((value) => !value)}
      />
      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label="Thông báo"
          className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] z-50 rounded-xl border border-border-default bg-surface-card shadow-lg overflow-hidden"
        >
          <NotificationList
            role={session?.role}
            onNavigate={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
