import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TopNavigation, TopBar } from "../src/components/ui/top-navigation";

describe("TopNavigation Component (Photonix UI Clone)", () => {
  it("renders default platform logo when no logo provided", () => {
    render(<TopNavigation />);
    expect(screen.getByText("TutorMatch")).toBeInTheDocument();
  });

  it("renders custom logo when provided", () => {
    render(<TopNavigation logo={<span>Custom Brand Logo</span>} />);
    expect(screen.getByText("Custom Brand Logo")).toBeInTheDocument();
    expect(screen.queryByText("TutorMatch")).not.toBeInTheDocument();
  });

  it("renders centerContent and rightContent correctly", () => {
    render(
      <TopNavigation
        centerContent={<input placeholder="Tìm kiếm gia sư..." />}
        rightContent={<button type="button">Đăng nhập</button>}
      />
    );
    expect(screen.getByPlaceholderText("Tìm kiếm gia sư...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đăng nhập" })).toBeInTheDocument();
  });

  it("hides left section when hideLeftSection is true", () => {
    render(<TopNavigation hideLeftSection />);
    expect(screen.queryByText("TutorMatch")).not.toBeInTheDocument();
  });

  it("applies border divider when showDivider is true", () => {
    const { container } = render(<TopNavigation showDivider={true} />);
    const header = container.querySelector("header");
    expect(header?.className).toContain("border-b");
  });

  it("removes border divider when showDivider is false", () => {
    const { container } = render(<TopNavigation showDivider={false} />);
    const header = container.querySelector("header");
    expect(header?.className).not.toContain("border-b");
  });

  it("supports TopBar alias identically", () => {
    render(<TopBar centerContent={<span>Center Title</span>} />);
    expect(screen.getByText("Center Title")).toBeInTheDocument();
    expect(screen.getByText("TutorMatch")).toBeInTheDocument();
  });
});
