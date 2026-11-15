"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Spinner } from "@/components/ui";
import {
  useMarkAllNotificationsRead,
  useNotificationList,
  useOpenNotification,
} from "@/hooks/use-notifications";
import type { NotificationItem as NotificationItemData } from "@/lib/api/notifications";
import { NotificationItem } from "./NotificationItem";
import {
  notificationHref,
  type NotificationViewerRole,
} from "./notification-routes";

export interface NotificationListProps {
  role: NotificationViewerRole | undefined;
  /** Called after a notification navigates away, e.g. to close a popover. */
  onNavigate?: () => void;
}

export function NotificationList({ role, onNavigate }: NotificationListProps) {
  const router = useRouter();
  const list = useNotificationList();
  const open = useOpenNotification();
  const markAll = useMarkAllNotificationsRead();
  const [unavailableIds, setUnavailableIds] = React.useState<
    ReadonlySet<string>
  >(() => new Set());

  const pages = list.data?.pages ?? [];
  const items = pages.flatMap((page) => page.items);
  const firstPage = pages[0];
  const unreadCount = firstPage?.unreadCount ?? 0;

  const handleOpen = async (notification: NotificationItemData) => {
    try {
      const result = await open.mutateAsync(notification.id);
      const href = result.target ? notificationHref(result.target, role) : null;
      if (result.unavailable || !href) {
        setUnavailableIds((current) => new Set(current).add(notification.id));
        return;
      }
      onNavigate?.();
      router.push(href);
    } catch {
      // The mutation rolls back its optimistic read state; the item stays clickable.
    }
  };

  const handleMarkAll = () => {
    if (!firstPage) return;
    markAll.mutate({
      boundary: firstPage.readAllBoundary,
      boundaryCreatedAt: firstPage.items[0]?.createdAt,
    });
  };

  return (
    <div className="flex flex-col max-h-112">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border-default">
        <h2 className="text-xl font-semibold text-content-primary">
          Thông báo
        </h2>
        <Button
          variant="tertiary"
          size="medium"
          onClick={handleMarkAll}
          disabled={unreadCount === 0 || markAll.isPending}
          isLoading={markAll.isPending}
        >
          Đánh dấu tất cả đã đọc
        </Button>
      </div>

      {list.isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner size="medium" variant="brand" label="Đang tải thông báo" />
        </div>
      ) : list.isError ? (
        <div className="px-4 py-6 text-center text-sm text-content-secondary">
          <p role="alert">Không tải được thông báo.</p>
          <Button
            variant="secondary"
            size="small"
            className="mt-3"
            onClick={() => list.refetch()}
          >
            Thử lại
          </Button>
        </div>
      ) : items.length === 0 ? (
        <p className="px-4 py-8 text-center text-base text-content-secondary">
          Bạn chưa có thông báo nào.
        </p>
      ) : (
        <ul className="overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
          {items.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              unavailable={unavailableIds.has(notification.id)}
              disabled={open.isPending && open.variables === notification.id}
              onOpen={handleOpen}
            />
          ))}
        </ul>
      )}

      {list.hasNextPage && (
        <div className="px-4 py-2 border-t border-border-default">
          <Button
            variant="tertiary"
            size="small"
            isFullWidth
            onClick={() => list.fetchNextPage()}
            isLoading={list.isFetchingNextPage}
          >
            Xem thêm
          </Button>
        </div>
      )}
    </div>
  );
}
