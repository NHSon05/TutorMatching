import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "../query-wrapper";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { notificationHref } from "@/components/notifications/notification-routes";
import type { NotificationItem, NotificationPage } from "@/lib/api/notifications";

const push = vi.fn();
const session = { id: "user-1", role: "TUTOR" as "LEARNER" | "TUTOR" | "ADMIN" };

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/hooks/use-session", () => ({ useSession: () => ({ data: session }) }));
vi.mock("@/hooks/use-signalr-events", () => ({ useSignalREvents: () => ({ isConnected: true }) }));

const api = vi.hoisted(() => ({
  getNotifications: vi.fn(),
  getUnreadCount: vi.fn(),
  markRead: vi.fn(),
  markAllRead: vi.fn(),
  openNotification: vi.fn(),
}));
vi.mock("@/lib/api/notifications", () => ({ notificationsApi: api }));

const created: NotificationItem = {
  id: "n-1",
  type: "HIRE_REQUEST_CREATED",
  title: "Bạn có yêu cầu thuê gia sư mới.",
  body: null,
  createdAt: "2026-11-14T08:00:00Z",
  isRead: false,
  readAt: null,
};
const cancelled: NotificationItem = {
  ...created,
  id: "n-2",
  type: "HIRE_REQUEST_CANCELLED",
  title: "Yêu cầu đã bị huỷ.",
  createdAt: "2026-11-14T07:00:00Z",
};

function page(items: NotificationItem[]): NotificationPage {
  return {
    items,
    nextCursor: null,
    unreadCount: items.filter((item) => !item.isRead).length,
    readAllBoundary: "boundary-token",
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  session.role = "TUTOR";
  api.getUnreadCount.mockResolvedValue({ unreadCount: 2, asOf: "2026-11-14T08:01:00Z" });
  api.getNotifications.mockResolvedValue(page([created, cancelled]));
});

async function openPanel() {
  render(<NotificationBell />);
  const bell = await screen.findByRole("button", { name: "Thông báo, 2 chưa đọc" });
  fireEvent.click(bell);
  return screen.findByRole("dialog", { name: "Thông báo" });
}

describe("NotificationBell", () => {
  it("shows the unread badge and lists newest notifications when opened", async () => {
    await openPanel();
    expect(await screen.findByText(created.title)).toBeInTheDocument();
    expect(screen.getByText(cancelled.title)).toBeInTheDocument();
    expect(api.getNotifications).toHaveBeenCalledWith({ cursor: undefined, pageSize: 20 });
  });

  it("opens a hire request notification and navigates to the role's request route", async () => {
    api.openNotification.mockResolvedValue({
      notification: { ...created, isRead: true, readAt: "2026-11-14T08:02:00Z" },
      target: { kind: "HIRE_REQUEST", id: "req-1", hireRequestId: "req-1" },
      unavailable: false,
    });
    await openPanel();
    fireEvent.click(await screen.findByRole("button", { name: `${created.title} (chưa đọc)` }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/request/req-1"));
    expect(api.openNotification).toHaveBeenCalledWith("n-1");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("keeps the panel open with a notice when the target is unavailable", async () => {
    api.openNotification.mockResolvedValue({
      notification: { ...cancelled, isRead: true, readAt: "2026-11-14T08:02:00Z" },
      target: null,
      unavailable: true,
    });
    await openPanel();
    fireEvent.click(await screen.findByRole("button", { name: `${cancelled.title} (chưa đọc)` }));
    expect(await screen.findByText("Nội dung này không còn khả dụng.")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("marks all read with the server boundary from the first page", async () => {
    api.markAllRead.mockResolvedValue({ changedCount: 2, unreadCount: 0 });
    await openPanel();
    await screen.findByText(created.title);
    fireEvent.click(screen.getByRole("button", { name: "Đánh dấu tất cả đã đọc" }));
    await waitFor(() => expect(api.markAllRead).toHaveBeenCalledWith("boundary-token"));
  });

  it("renders nothing without a session", () => {
    session.id = "";
    const { container } = render(<NotificationBell />);
    expect(container).toBeEmptyDOMElement();
    session.id = "user-1";
  });
});

describe("notificationHref", () => {
  it("maps only allowlisted kinds to internal routes per role", () => {
    const request = { kind: "HIRE_REQUEST" as const, id: "r-1" };
    expect(notificationHref(request, "LEARNER")).toBe("/learner/requests/r-1");
    expect(notificationHref(request, "TUTOR")).toBe("/request/r-1");
    expect(notificationHref(request, "ADMIN")).toBeNull();
    expect(notificationHref({ kind: "CONVERSATION", id: "c-1" }, "LEARNER")).toBe(
      "/messages?conversationId=c-1"
    );
    expect(notificationHref({ kind: "TUTOR_PROFILE", id: "p-1" }, "TUTOR")).toBe("/profile");
    expect(notificationHref({ kind: "TUTOR_PROFILE", id: "p-1" }, "LEARNER")).toBeNull();
  });
});
