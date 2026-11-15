import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "../query-wrapper";
import SharedNavbar from "@/components/navigation/SharedNavbar";
import { LearnerNavigationRail } from "@/components/navigation/LearnerNavigationRail";
import { TutorSidebar } from "@/components/navigation/TutorSidebar";

const session = {
  id: "user-1",
  role: "LEARNER",
  fullName: "Người dùng",
  tutorProfileStatus: "APPROVED",
};

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
vi.mock("next/image", () => ({
  default: (props: { alt: string }) => <span>{props.alt}</span>,
}));
vi.mock("@/hooks/use-session", () => ({
  useSession: () => ({ data: session }),
}));
vi.mock("@/hooks/use-signalr-events", () => ({
  useSignalREvents: () => ({ isConnected: true }),
}));
vi.mock("@/hooks/use-auth", () => ({
  useLogout: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

const api = vi.hoisted(() => ({
  getNotifications: vi.fn(),
  getUnreadCount: vi.fn(),
  markRead: vi.fn(),
  markAllRead: vi.fn(),
  openNotification: vi.fn(),
}));
vi.mock("@/lib/api/notifications", () => ({ notificationsApi: api }));

function counts(unreadCount: number, messageUnreadCount: number) {
  api.getUnreadCount.mockResolvedValue({
    unreadCount,
    messageUnreadCount,
    asOf: "2026-11-14T08:00:00Z",
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Messenger badge", () => {
  it("badges the Messenger icon, not the bell, for unread messages", async () => {
    counts(0, 3);
    render(<SharedNavbar />);
    const messenger = await screen.findByRole("link", {
      name: "Tin nhắn, 3 chưa đọc",
    });
    expect(within(messenger).getByText("3")).toBeInTheDocument();
    // The bell carries no badge when only messages are unread.
    expect(
      await screen.findByRole("button", { name: "Thông báo" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /chưa đọc/ })).toBeNull();
  });

  it("keeps the bell badge for other notifications alongside messages", async () => {
    counts(2, 1);
    render(<SharedNavbar />);
    expect(
      await screen.findByRole("button", { name: "Thông báo, 2 chưa đọc" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Tin nhắn, 1 chưa đọc" })
    ).toBeInTheDocument();
  });

  it("shows no Messenger badge when there are no unread messages", async () => {
    counts(4, 0);
    render(<SharedNavbar />);
    await screen.findByRole("button", { name: "Thông báo, 4 chưa đọc" });
    expect(screen.queryByRole("link", { name: /Tin nhắn,/ })).toBeNull();
  });

  it("caps the learner rail badge at 99+", async () => {
    counts(0, 120);
    render(<LearnerNavigationRail />);
    expect(await screen.findByText("99+")).toBeInTheDocument();
  });

  it("badges the tutor sidebar Messenger item", async () => {
    session.role = "TUTOR";
    counts(0, 5);
    render(<TutorSidebar />);
    expect(
      await screen.findByLabelText("5 tin nhắn chưa đọc")
    ).toHaveTextContent("5");
    session.role = "LEARNER";
  });
});
