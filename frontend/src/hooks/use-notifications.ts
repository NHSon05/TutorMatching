"use client";

import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  notificationsApi,
  type NotificationItem,
  type NotificationPage,
  type UnreadNotificationCount,
} from "@/lib/api/notifications";

// Every key starts with "notifications" so the SignalR NotificationsChanged hint
// invalidates the list and the badge together.
export const notificationKeys = {
  all: ["notifications"] as const,
  list: ["notifications", "list"] as const,
  unreadCount: ["notifications", "unread-count"] as const,
};

type ListData = InfiniteData<NotificationPage, string | undefined>;

export function useNotificationList(enabled = true) {
  return useInfiniteQuery({
    queryKey: notificationKeys.list,
    queryFn: ({ pageParam }) =>
      notificationsApi.getNotifications({ cursor: pageParam, pageSize: 20 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled,
  });
}

const unreadCountQuery = {
  queryKey: notificationKeys.unreadCount,
  queryFn: notificationsApi.getUnreadCount,
  // REST is the source of truth; push hints only shorten the delay.
  refetchOnWindowFocus: true,
  refetchInterval: 60_000,
} as const;

/** Bell badge source; message notifications are excluded server-side. */
export function useUnreadNotificationCount(enabled = true) {
  return useQuery({ ...unreadCountQuery, enabled });
}

/**
 * Messenger badge: unread incoming messages. Shares the unread-count request
 * with the bell, so both badges update from one fetch and one push hint.
 */
export function useUnreadMessageCount(enabled = true) {
  return useQuery({
    ...unreadCountQuery,
    enabled,
    select: (count: UnreadNotificationCount) => count.messageUnreadCount ?? 0,
  });
}

/** Message notifications never count on the bell badge. */
export function isMessageNotification(item: Pick<NotificationItem, "type">) {
  return item.type === "MESSAGE_CREATED";
}

function applyRead(
  queryClient: ReturnType<typeof useQueryClient>,
  isAffected: (item: NotificationItem) => boolean
) {
  let changed = 0;
  queryClient.setQueryData<ListData>(notificationKeys.list, (data) => {
    if (!data) return data;
    const readAt = new Date().toISOString();
    return {
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        items: page.items.map((item) => {
          if (item.isRead || !isAffected(item)) return item;
          if (!isMessageNotification(item)) changed += 1;
          return { ...item, isRead: true, readAt: item.readAt ?? readAt };
        }),
      })),
    };
  });
  if (changed > 0) {
    queryClient.setQueryData<UnreadNotificationCount>(
      notificationKeys.unreadCount,
      (count) =>
        count
          ? { ...count, unreadCount: Math.max(0, count.unreadCount - changed) }
          : count
    );
  }
}

async function snapshot(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.cancelQueries({ queryKey: notificationKeys.all });
  return {
    list: queryClient.getQueryData<ListData>(notificationKeys.list),
    count: queryClient.getQueryData<UnreadNotificationCount>(
      notificationKeys.unreadCount
    ),
  };
}

function useReadMutation<TVariables, TResult>(
  mutationFn: (variables: TVariables) => Promise<TResult>,
  affects: (variables: TVariables) => (item: NotificationItem) => boolean
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onMutate: async (variables: TVariables) => {
      const previous = await snapshot(queryClient);
      applyRead(queryClient, affects(variables));
      return previous;
    },
    onError: (_error, _variables, previous) => {
      if (!previous) return;
      queryClient.setQueryData(notificationKeys.list, previous.list);
      queryClient.setQueryData(notificationKeys.unreadCount, previous.count);
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

export function useMarkNotificationRead() {
  return useReadMutation(
    (id: string) => notificationsApi.markRead(id),
    (id) => (item) => item.id === id
  );
}

export function useOpenNotification() {
  return useReadMutation(
    (id: string) => notificationsApi.openNotification(id),
    (id) => (item) => item.id === id
  );
}

/**
 * Marks read only items created at or before the list's initial snapshot, so a
 * notification arriving while the list is open stays unread.
 */
export function useMarkAllNotificationsRead() {
  return useReadMutation(
    ({ boundary }: { boundary: string; boundaryCreatedAt?: string }) =>
      notificationsApi.markAllRead(boundary),
    ({ boundaryCreatedAt }) =>
      (item) =>
        !boundaryCreatedAt || item.createdAt <= boundaryCreatedAt
  );
}
