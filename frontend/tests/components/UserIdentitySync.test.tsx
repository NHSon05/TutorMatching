import { act, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render as rtlRender } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "../query-wrapper";
import { LearnerShell } from "@/components/layouts/LearnerShell";
import { AdminLayoutShell } from "@/components/layouts/AdminLayoutShell";
import { TutorSidebar } from "@/components/navigation/TutorSidebar";
import { getSession } from "@/lib/auth/session";
import { sessionKey } from "@/lib/query/client";
import { nameInitials, toUserDisplay } from "@/lib/auth/user-display";
import { useUIStore } from "@/stores/use-ui-store";
import type { AccountResponse } from "@/lib/api/auth";

vi.mock("@/hooks/use-messenger-badge", () => ({
  useMessengerBadge: () => 0,
  formatBadgeCount: (count: number) => String(count),
}));
vi.mock("@/components/notifications/NotificationBell", () => ({ NotificationBell: () => null }));
vi.mock("@/components/LogoutButton", () => ({ LogoutButton: () => <button type="button">Đăng xuất</button> }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));
vi.mock("@/lib/auth/session", () => ({ getSession: vi.fn(), logout: vi.fn(), login: vi.fn() }));

const GOOGLE_PICTURE = "https://lh3.googleusercontent.com/a/learner-picture";

function account(overrides: Partial<AccountResponse> = {}): AccountResponse {
  return {
    id: "user-1",
    email: "user@gmail.com",
    fullName: "Nguyễn Văn Minh",
    role: "LEARNER",
    status: "ACTIVE",
    avatarUrl: null,
    ...overrides,
  };
}

const avatarImage = (testId: string) => within(screen.getByTestId(testId)).queryByRole("img");

describe("user display helper", () => {
  it("uses the last two Vietnamese name parts for initials", () => {
    expect(nameInitials("Nguyễn Văn Minh")).toBe("VM");
    expect(nameInitials("Minh")).toBe("M");
  });

  it("resolves API upload paths and falls back to the role name", () => {
    const display = toUserDisplay({ fullName: " ", avatarUrl: "/uploads/avatars/a.png" }, "Gia sư");
    expect(display.name).toBe("Gia sư");
    expect(display.avatarSrc).toBe("http://localhost:5014/uploads/avatars/a.png");
    expect(toUserDisplay(null, "Học viên").avatarSrc).toBeUndefined();
  });
});

describe("learner top bar and sidebar stay in sync", () => {
  beforeEach(() => useUIStore.getState().setMode("expanded"));

  it("shows the session name and Google avatar in both places", () => {
    render(
      <LearnerShell account={account({ avatarUrl: GOOGLE_PICTURE })}>
        <div />
      </LearnerShell>,
    );

    expect(screen.getByText("Nguyễn Văn Minh")).toBeInTheDocument();
    expect(avatarImage("rail-avatar")).toHaveAttribute("src", GOOGLE_PICTURE);
    expect(avatarImage("topbar-avatar")).toHaveAttribute("src", GOOGLE_PICTURE);
    expect(screen.queryByText("Esther")).not.toBeInTheDocument();
    expect(screen.queryByText("Nguyễn Hồng Sơn")).not.toBeInTheDocument();
  });

  it("shows the same initials in both places when there is no avatar", () => {
    render(
      <LearnerShell account={account()}>
        <div />
      </LearnerShell>,
    );

    expect(screen.getByTestId("rail-avatar")).toHaveTextContent("VM");
    expect(screen.getByTestId("topbar-avatar")).toHaveTextContent("VM");
    expect(avatarImage("topbar-avatar")).toBeNull();
  });

  it("uses the same initials in the collapsed rail", () => {
    useUIStore.getState().setMode("collapsed");
    render(
      <LearnerShell account={account()}>
        <div />
      </LearnerShell>,
    );
    expect(screen.getByTestId("rail-avatar")).toHaveTextContent("VM");
  });
});

describe("session-backed sidebars", () => {
  it("admin header and sidebar show the signed-in admin instead of a placeholder", async () => {
    vi.mocked(getSession).mockResolvedValue(
      account({ id: "admin-1", fullName: "Trần Thị Quản", role: "ADMIN", avatarUrl: GOOGLE_PICTURE }),
    );
    render(
      <AdminLayoutShell>
        <div />
      </AdminLayoutShell>,
    );

    await waitFor(() => expect(screen.getAllByText("Trần Thị Quản")).toHaveLength(2));
    expect(avatarImage("admin-header-avatar")).toHaveAttribute("src", GOOGLE_PICTURE);
    expect(avatarImage("admin-sidebar-avatar")).toHaveAttribute("src", GOOGLE_PICTURE);
  });

  it("tutor sidebar updates immediately when the session changes after a profile edit", async () => {
    vi.mocked(getSession).mockResolvedValue(account({ role: "TUTOR", fullName: "Lê Gia Sư" }));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    rtlRender(
      <QueryClientProvider client={client}>
        <TutorSidebar />
      </QueryClientProvider>,
    );
    await waitFor(() => expect(screen.getByText("Lê Gia Sư")).toBeInTheDocument());
    expect(screen.getByTestId("tutor-sidebar-avatar")).toHaveTextContent("GS");

    // ProfileForm writes the saved account into the session cache.
    act(() => {
      client.setQueryData(sessionKey, account({ role: "TUTOR", fullName: "Lê Văn Mới", avatarUrl: GOOGLE_PICTURE }));
    });

    expect(await screen.findByText("Lê Văn Mới")).toBeInTheDocument();
    expect(avatarImage("tutor-sidebar-avatar")).toHaveAttribute("src", GOOGLE_PICTURE);
  });
});
