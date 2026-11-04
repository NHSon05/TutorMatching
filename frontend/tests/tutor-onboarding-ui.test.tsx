import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TutorGuard } from "@/components/tutor/TutorGuard";
import { TutorLayoutShell } from "@/components/layouts/TutorLayoutShell";

const mockState = vi.hoisted(() => ({
  path: "/onboarding",
  role: "TUTOR" as "TUTOR" | "LEARNER" | "ADMIN",
  status: "DRAFT" as "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED",
  replace: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mockState.path,
  useRouter: () => ({
    replace: mockState.replace,
    push: mockState.push,
  }),
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
      expect(screen.queryByLabelText("Mở menu điều hướng")).not.toBeInTheDocument();
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
  });
});
