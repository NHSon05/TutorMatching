"use client";

import type { NotificationItem as NotificationItemData } from "@/lib/api/notifications";
import { formatRelativeTime } from "@/lib/date-time";
import {
  BellIcon,
  MessagesIcon,
  RequestIcon,
  UserProfileIcon,
} from "@/components/icons";

export interface NotificationItemProps {
  notification: NotificationItemData;
  /** Shown when the referenced object is gone or no longer accessible. */
  unavailable?: boolean;
  disabled?: boolean;
  onOpen: (notification: NotificationItemData) => void;
}

function TypeIcon({ type }: { type: NotificationItemData["type"] }) {
  const className = "w-4 h-4 text-brand";
  if (type === "MESSAGE_CREATED") return <MessagesIcon className={className} />;
  if (type === "TUTOR_PROFILE_REVIEWED")
    return <UserProfileIcon className={className} />;
  if (type.startsWith("HIRE_")) return <RequestIcon className={className} />;
  return <BellIcon className={className} />;
}

export function NotificationItem({
  notification,
  unavailable = false,
  disabled = false,
  onOpen,
}: NotificationItemProps) {
  const unread = !notification.isRead;
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(notification)}
        disabled={disabled}
        aria-label={`${notification.title}${unread ? " (chưa đọc)" : ""}`}
        className={`w-full text-left flex gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60 ${
          unread ? "bg-brand/5" : ""
        }`}
      >
        <span className="mt-0.5 w-8 h-8 shrink-0 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <TypeIcon type={notification.type} />
        </span>
        <span className="flex-1 min-w-0">
          <span
            className={`block text-base text-content-primary ${unread ? "font-semibold" : ""}`}
          >
            {notification.title}
          </span>
          {notification.body && (
            <span className="block text-xs text-content-secondary line-clamp-2 mt-0.5">
              {notification.body}
            </span>
          )}
          {unavailable && (
            <span
              role="status"
              className="block text-xs text-status-warning mt-1"
            >
              Nội dung này không còn khả dụng.
            </span>
          )}
          <time
            dateTime={notification.createdAt}
            className="block text-xs text-content-secondary mt-1"
          >
            {formatRelativeTime(notification.createdAt)}
          </time>
        </span>
        {unread && (
          <span
            aria-hidden="true"
            className="mt-2 w-2 h-2 shrink-0 rounded-full bg-brand"
          />
        )}
      </button>
    </li>
  );
}
