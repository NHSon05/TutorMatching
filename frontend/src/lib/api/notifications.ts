import { http } from "./http";

export type NotificationType =
  | "TUTOR_PROFILE_REVIEWED"
  | "HIRE_REQUEST_CREATED"
  | "HIRE_REQUEST_PROPOSED"
  | "HIRE_REQUEST_ACCEPTED"
  | "HIRE_REQUEST_REJECTED"
  | "HIRE_REQUEST_CANCELLED"
  | "HIRE_REQUEST_COMPLETED"
  | "HIRE_PAYMENT_COMPLETED"
  | "TUTOR_REVIEW_RECEIVED"
  | "TUTOR_REVIEW_REPLIED"
  | "MESSAGE_CREATED";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  createdAt: string;
  isRead: boolean;
  readAt: string | null;
}

export interface NotificationPage {
  items: NotificationItem[];
  nextCursor: string | null;
  unreadCount: number;
  /** Opaque server token from the first page; pass it back unchanged to read-all. */
  readAllBoundary: string;
}

export interface UnreadNotificationCount {
  /** Bell badge: unread notifications, excluding message notifications. */
  unreadCount: number;
  /** Messenger badge: unread incoming messages across the user's conversations. */
  messageUnreadCount: number;
  asOf: string;
}

export interface ReadAllNotificationsResult {
  changedCount: number;
  unreadCount: number;
}

export type NotificationTargetKind =
  | "HIRE_REQUEST"
  | "TUTOR_PROFILE"
  | "CONVERSATION";

export interface NotificationTarget {
  kind: NotificationTargetKind;
  id: string;
  hireRequestId?: string;
}

export interface OpenNotificationResult {
  notification: NotificationItem;
  target: NotificationTarget | null;
  unavailable: boolean;
}

export const notificationsApi = {
  getNotifications: async (
    options: { cursor?: string; pageSize?: number; unreadOnly?: boolean } = {}
  ): Promise<NotificationPage> => {
    const params = new URLSearchParams();
    if (options.unreadOnly) params.set("unreadOnly", "true");
    if (options.cursor) params.set("cursor", options.cursor);
    params.set("pageSize", String(options.pageSize ?? 20));
    const res = await http.get<NotificationPage>(
      `/notifications?${params.toString()}`
    );
    return res.data;
  },

  getUnreadCount: async (): Promise<UnreadNotificationCount> => {
    const res = await http.get<UnreadNotificationCount>(
      "/notifications/unread-count"
    );
    return res.data;
  },

  markRead: async (id: string): Promise<NotificationItem> => {
    const res = await http.post<NotificationItem>(`/notifications/${id}/read`);
    return res.data;
  },

  markAllRead: async (boundary: string): Promise<ReadAllNotificationsResult> => {
    const res = await http.post<ReadAllNotificationsResult>(
      "/notifications/read-all",
      { boundary }
    );
    return res.data;
  },

  openNotification: async (id: string): Promise<OpenNotificationResult> => {
    const res = await http.post<OpenNotificationResult>(
      `/notifications/${id}/open`
    );
    return res.data;
  },
};
