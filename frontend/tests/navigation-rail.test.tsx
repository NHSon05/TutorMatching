import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import {
  NavigationRail,
  NavGroup,
  NavItem,
  Rail,
} from "../src/components/ui/navigation-rail";

describe("NavigationRail Component (Photonix UI Clone)", () => {
  it("renders expanded navigation rail with header, content, and footer", () => {
    render(
      <NavigationRail
        header={<div>Header Logo</div>}
        footer={<div>Footer User</div>}
      >
        <NavGroup label="Workspace">
          <NavItem id="home" label="Trang chủ" />
          <NavItem id="docs" label="Tài liệu" />
        </NavGroup>
      </NavigationRail>
    );

    expect(screen.getByText("Header Logo")).toBeInTheDocument();
    expect(screen.getByText("Footer User")).toBeInTheDocument();
    expect(screen.getByText("Workspace")).toBeInTheDocument();
    expect(screen.getByText("Trang chủ")).toBeInTheDocument();
    expect(screen.getByText("Tài liệu")).toBeInTheDocument();
  });

  it("renders collapsed navigation rail with 64px width and accessible titles", () => {
    const { container } = render(
      <NavigationRail mode="collapsed">
        <NavItem
          id="home"
          label="Trang chủ"
          icon={<span data-testid="home-icon">🏠</span>}
        />
        <NavItem
          id="no-icon"
          label="Mục không icon"
        />
      </NavigationRail>
    );

    const nav = container.querySelector("nav");
    expect(nav).toHaveStyle({ width: "64px" });
    expect(screen.getByTestId("home-icon")).toBeInTheDocument();
    // Item without icon is hidden in collapsed mode
    expect(screen.queryByText("Mục không icon")).not.toBeInTheDocument();
  });

  it("handles NavItem clicks and keyboard interaction", () => {
    const handleClick = vi.fn();
    render(
      <NavigationRail>
        <NavItem id="test-item" label="Kiểm thử" onClick={handleClick} />
      </NavigationRail>
    );

    const item = screen.getByRole("button", { name: "Kiểm thử" });
    fireEvent.click(item);
    expect(handleClick).toHaveBeenCalledWith("test-item");

    fireEvent.keyDown(item, { key: "Enter" });
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it("respects selected and disabled states on NavItem", () => {
    const handleClick = vi.fn();
    render(
      <NavigationRail>
        <NavItem id="active" label="Đang chọn" selected />
        <NavItem id="disabled" label="Bị khóa" disabled onClick={handleClick} />
      </NavigationRail>
    );

    const activeItem = screen.getByRole("button", { name: "Đang chọn" });
    expect(activeItem).toHaveAttribute("aria-current", "page");
    expect(activeItem.className).toContain("bg-blue-50");

    const disabledItem = screen.getByRole("button", { name: "Bị khóa" });
    expect(disabledItem).toHaveAttribute("aria-disabled", "true");
    expect(disabledItem.className).toContain("cursor-not-allowed");

    fireEvent.click(disabledItem);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("renders number badges with custom colors and variants", () => {
    render(
      <NavigationRail>
        <NavItem
          id="inbox"
          label="Hộp thư"
          badge={5}
          badgeColor="red"
          badgeVariant="primary"
        />
      </NavigationRail>
    );

    const badge = screen.getByText("5");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("bg-red-600");
  });

  it("toggles NavGroup open and closed", () => {
    render(
      <NavigationRail>
        <NavGroup label="Tài liệu" expanded={true}>
          <NavItem id="g1" label="Mục 1" />
        </NavGroup>
      </NavigationRail>
    );

    expect(screen.getByText("Mục 1")).toBeInTheDocument();
    const toggleButton = screen.getByRole("button", { name: "Toggle Tài liệu group" });
    fireEvent.click(toggleButton);

    // After clicking, group collapses and item is hidden
    expect(screen.queryByText("Mục 1")).not.toBeInTheDocument();

    fireEvent.click(toggleButton);
    expect(screen.getByText("Mục 1")).toBeInTheDocument();
  });

  it("supports nested tree children with expansion toggle", () => {
    render(
      <NavigationRail>
        <NavItem
          id="parent"
          label="Mục cha"
          nestedItems={[
            { id: "child-1", label: "Mục con 1" },
            { id: "child-2", label: "Mục con 2" },
          ]}
        />
      </NavigationRail>
    );

    expect(screen.getByText("Mục cha")).toBeInTheDocument();
    expect(screen.queryByText("Mục con 1")).not.toBeInTheDocument();

    // Click parent to expand nested children
    fireEvent.click(screen.getByRole("button", { name: "Mục cha" }));
    expect(screen.getByText("Mục con 1")).toBeInTheDocument();
    expect(screen.getByText("Mục con 2")).toBeInTheDocument();
  });

  it("applies floating styles when floating prop is true", () => {
    const { container } = render(
      <NavigationRail floating>
        <NavItem id="float" label="Nổi" />
      </NavigationRail>
    );

    const nav = container.querySelector("nav");
    expect(nav?.className).toContain("rounded-xl");
    expect(nav?.className).toContain("shadow-md");
  });

  it("renders anchor link when href is supplied", () => {
    render(
      <NavigationRail>
        <NavItem id="link" label="Đi tới trang" href="/dashboard" />
      </NavigationRail>
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/dashboard");
  });

  it("supports Rail alias identically", () => {
    render(
      <Rail>
        <NavItem id="alias" label="Alias Rail" />
      </Rail>
    );

    expect(screen.getByText("Alias Rail")).toBeInTheDocument();
  });
});
