import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TutorGuard } from "@/components/tutor/TutorGuard";
import { TutorLayoutShell } from "@/components/layouts/TutorLayoutShell";
import { useUIStore } from "@/stores/use-ui-store";

const mockState = vi.hoisted(() => ({
  path: "/onboarding",
  role: "TUTOR" as "TUTOR" | "LEARNER" | "ADMIN",
  status: "DRAFT" as "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED",
  replace: vi.fn(),
  push: vi.fn(),
}));

// The live bell needs a QueryClient and session; it is covered by NotificationBell.test.tsx.
vi.mock("@/components/notifications/NotificationBell", () => ({
  NotificationBell: () => null,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mockState.path,
  useRouter: () => ({
    replace: mockState.replace,
    push: mockState.push,
  }),
}));

vi.mock("@/hooks/use-messenger-badge", () => ({
  useMessengerBadge: () => 0,
  formatBadgeCount: (count: number) => String(count),
}));
vi.mock("@/hooks/use-session", () => ({
  useSession: () => ({
    data: {
      id: "tutor-123",
      role: mockState.role,
      email: "tutor@example.com",
      fullName: "Nguyễn Văn Gia Sư",
      status: "ACTIVE",
      tutorProfileStatus: mockState.status,
    },
    isLoading: false,
    error: null,
  }),
}));

vi.mock("@/hooks/use-auth", () => ({
  useLogout: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

describe("Tutor Onboarding & Sidebar Visibility Guards", () => {
  beforeEach(() => {
    mockState.path = "/onboarding";
    mockState.role = "TUTOR";
    mockState.status = "DRAFT";
    mockState.replace.mockReset();
    mockState.push.mockReset();
  });

  describe("TutorGuard Onboarding Gate", () => {
    it("redirects APPROVED tutors away from /tutor/onboarding to /", async () => {
      mockState.status = "APPROVED";
      mockState.path = "/onboarding";

      render(
        <TutorGuard>
          <div>Onboarding Content</div>
        </TutorGuard>
      );

      // Children should not be displayed
      expect(screen.queryByText("Onboarding Content")).not.toBeInTheDocument();
      // Should redirect immediately to /
      await waitFor(() => {
        expect(mockState.replace).toHaveBeenCalledWith("/");
      });
    });

    it("allows DRAFT tutors to access /tutor/onboarding", () => {
      mockState.status = "DRAFT";
      mockState.path = "/onboarding";

      render(
        <TutorGuard>
          <div>Onboarding Content</div>
        </TutorGuard>
      );

      expect(screen.getByText("Onboarding Content")).toBeInTheDocument();
      expect(mockState.replace).not.toHaveBeenCalled();
    });

    it("allows PENDING_REVIEW tutors to access /tutor/onboarding to view review status", () => {
      mockState.status = "PENDING_REVIEW";
      mockState.path = "/onboarding";

      render(
        <TutorGuard>
          <div>Onboarding Content</div>
        </TutorGuard>
      );

      expect(screen.getByText("Onboarding Content")).toBeInTheDocument();
      expect(mockState.replace).not.toHaveBeenCalled();
    });
  });

  describe("TutorLayoutShell Sidebar Visibility", () => {
    it("does NOT render TutorSidebar when tutor status is DRAFT", () => {
      mockState.status = "DRAFT";
      mockState.path = "/onboarding";

      render(
        <TutorLayoutShell>
          <div>Child Page</div>
        </TutorLayoutShell>
      );

      expect(screen.getByText("Child Page")).toBeInTheDocument();
      // Sidebar navigation should NOT be present
      expect(
        screen.queryByLabelText("Tutor Navigation Sidebar")
      ).not.toBeInTheDocument();
      // Focused header badge should be rendered
      expect(screen.getByText("Hoàn thiện hồ sơ")).toBeInTheDocument();
    });

    it("does NOT render TutorSidebar when tutor status is PENDING_REVIEW", () => {
      mockState.status = "PENDING_REVIEW";
      mockState.path = "/onboarding";

      render(
        <TutorLayoutShell>
          <div>Pending Page</div>
        </TutorLayoutShell>
      );

      expect(screen.getByText("Pending Page")).toBeInTheDocument();
      expect(
        screen.queryByLabelText("Tutor Navigation Sidebar")
      ).not.toBeInTheDocument();
    });

    it("does NOT render TutorSidebar on /onboarding even if not DRAFT", () => {
      mockState.status = "DRAFT";
      mockState.path = "/onboarding";

      render(
        <TutorLayoutShell>
          <div>Registration wizard</div>
        </TutorLayoutShell>
      );

      expect(
        screen.queryByLabelText("Tutor Navigation Sidebar")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByLabelText("Mở menu điều hướng")
      ).not.toBeInTheDocument();
    });

    it("renders TutorSidebar when tutor status is APPROVED on workspace pages", () => {
      mockState.status = "APPROVED";
      mockState.path = "/";

      render(
        <TutorLayoutShell>
          <div>Dashboard Page</div>
        </TutorLayoutShell>
      );

      expect(screen.getByText("Dashboard Page")).toBeInTheDocument();
      // Sidebar should be present
      expect(
        screen.getAllByLabelText("Tutor Navigation Sidebar").length
      ).toBeGreaterThanOrEqual(1);
    });

    it("uses the learner-style top bar with the tutor role and initials", () => {
      mockState.status = "APPROVED";
      mockState.path = "/";
      useUIStore.getState().setMode("expanded");

      render(
        <TutorLayoutShell>
          <div>Dashboard Page</div>
        </TutorLayoutShell>
      );

      // Same controls as the learner bar: toggle, search, role pill, theme, avatar, logout.
      expect(
        screen.getByRole("button", { name: "Thu gọn thanh điều hướng" })
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Search projects")
      ).toBeInTheDocument();
      // Scope to the top bar: the sidebar card now shows the same user and role on purpose.
      const topBar = screen.getByRole("main");
      expect(within(topBar).getByText("Gia sư")).toBeInTheDocument();
      expect(screen.queryByText("Thành viên")).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Chuyển chế độ sáng/tối" })
      ).toBeInTheDocument();
      // No stock photo for a tutor without an avatar: initials of the last two name parts.
      expect(within(topBar).getByText("GS")).toBeInTheDocument();
      // The sidebar shows the very same initials (name/avatar are in sync).
      expect(within(screen.getByTestId("tutor-sidebar-avatar")).getByText("GS")).toBeInTheDocument();
      // Sidebar keeps its own logout; the top bar's lives in the avatar account menu.
      expect(screen.getAllByRole("button", { name: "Đăng xuất" })).toHaveLength(1);
      fireEvent.click(within(topBar).getByRole("button", { name: /^Tài khoản của/ }));
      expect(within(topBar).getByRole("menuitem", { name: "Đăng xuất" })).toBeInTheDocument();
      expect(within(topBar).getByRole("menuitem", { name: "Tài khoản" })).toHaveAttribute("href", "/profile");
    });

    it("collapses and expands the desktop sidebar from the top bar toggle", () => {
      mockState.status = "APPROVED";
      mockState.path = "/";
      useUIStore.getState().setMode("expanded");
      const matchMedia = window.matchMedia;
      window.matchMedia = ((query: string) =>
        ({
          matches: true,
          media: query,
        }) as MediaQueryList) as typeof window.matchMedia;
      try {
        render(
          <TutorLayoutShell>
            <div>Dashboard Page</div>
          </TutorLayoutShell>
        );
        const sidebar = () =>
          screen.getByLabelText("Tutor Navigation Sidebar").parentElement!;
        expect(sidebar()).toHaveClass("md:flex");

        fireEvent.click(
          screen.getByRole("button", { name: "Thu gọn thanh điều hướng" })
        );
        expect(sidebar()).not.toHaveClass("md:flex");

        fireEvent.click(
          screen.getByRole("button", { name: "Mở rộng thanh điều hướng" })
        );
        expect(sidebar()).toHaveClass("md:flex");
      } finally {
        window.matchMedia = matchMedia;
        useUIStore.getState().setMode("expanded");
      }
    });
  });
});
