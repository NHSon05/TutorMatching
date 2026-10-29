import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardTopBar } from "@/components/learner/DashboardTopBar";
import { LearnerNavigationRail } from "@/components/navigation/LearnerNavigationRail";
import { useUIStore } from "@/stores/use-ui-store";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt || "image"} />
  ),
}));

vi.mock("@/components/LogoutButton", () => ({
  LogoutButton: () => <button type="button">Logout</button>,
}));

describe("LearnerNavigationRail and DashboardTopBar synchronization", () => {
  beforeEach(() => {
    useUIStore.getState().setMode("expanded");
  });

  it("toggles LearnerNavigationRail when DashboardTopBar toggle is clicked and stores in localStorage", () => {
    render(
      <div>
        <LearnerNavigationRail />
        <DashboardTopBar />
      </div>
    );

    // Initial state: expanded
    expect(useUIStore.getState().mode).toBe("expanded");
    expect(screen.getByText("TutorMatch")).toBeInTheDocument();
    expect(screen.getByText("Upgrade to Pro for more facilities")).toBeInTheDocument();

    const toggleButton = screen.getByRole("button", {
      name: "Thu gọn thanh điều hướng",
    });

    // Click toggle to collapse
    fireEvent.click(toggleButton);

    expect(useUIStore.getState().mode).toBe("collapsed");
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);
    // When collapsed, the text TutorMatch and Upgrade text are hidden
    expect(screen.queryByText("TutorMatch")).not.toBeInTheDocument();
    expect(screen.queryByText("Upgrade to Pro for more facilities")).not.toBeInTheDocument();

    // Click toggle again to expand
    const expandButton = screen.getByRole("button", {
      name: "Mở rộng thanh điều hướng",
    });
    fireEvent.click(expandButton);

    expect(useUIStore.getState().mode).toBe("expanded");
    expect(useUIStore.getState().sidebarCollapsed).toBe(false);
    expect(screen.getByText("TutorMatch")).toBeInTheDocument();
    expect(screen.getByText("Upgrade to Pro for more facilities")).toBeInTheDocument();
  });
});
