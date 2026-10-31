import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { Tabs, TabPanel } from "@/components/ui/tabs";

describe("Tabs Component (UI Primitive)", () => {
  const sampleTabs = [
    { id: "tab-1", label: "Tab One", badge: 5 },
    { id: "tab-2", label: "Tab Two" },
    { id: "tab-3", label: "Tab Three", disabled: true },
  ];

  it("renders tab items and handles tab switching", () => {
    const handleChange = vi.fn();

    render(
      <div>
        <Tabs
          tabs={sampleTabs}
          activeTab="tab-1"
          onChange={handleChange}
          id="test-tabs"
        />
        <TabPanel tabsId="test-tabs" tabId="tab-1" activeTab="tab-1">
          Content One
        </TabPanel>
        <TabPanel tabsId="test-tabs" tabId="tab-2" activeTab="tab-1">
          Content Two
        </TabPanel>
      </div>
    );

    expect(screen.getByRole("tablist")).toBeInTheDocument();
    expect(screen.getByText("Tab One")).toBeInTheDocument();
    expect(screen.getByText("Tab Two")).toBeInTheDocument();
    expect(screen.getByText("Content One")).toBeInTheDocument();
    expect(screen.queryByText("Content Two")).not.toBeInTheDocument();

    const tabTwo = screen.getByRole("tab", { name: /Tab Two/i });
    fireEvent.click(tabTwo);
    expect(handleChange).toHaveBeenCalledWith("tab-2");
  });

  it("supports uncontrolled mode with defaultTab", () => {
    render(
      <Tabs
        tabs={sampleTabs}
        defaultTab="tab-2"
        variant="pill"
        roleVariant="tutor"
      />
    );

    const tabOne = screen.getByRole("tab", { name: /Tab One/i });
    const tabTwo = screen.getByRole("tab", { name: /Tab Two/i });

    expect(tabTwo).toHaveAttribute("aria-selected", "true");
    expect(tabOne).toHaveAttribute("aria-selected", "false");

    fireEvent.click(tabOne);
    expect(tabOne).toHaveAttribute("aria-selected", "true");
    expect(tabTwo).toHaveAttribute("aria-selected", "false");
  });

  it("handles keyboard navigation according to ARIA tabs pattern", () => {
    const handleChange = vi.fn();

    render(
      <Tabs
        tabs={sampleTabs}
        activeTab="tab-1"
        onChange={handleChange}
        activationMode="automatic"
      />
    );

    const tabOne = screen.getByRole("tab", { name: /Tab One/i });
    tabOne.focus();

    // Arrow Right should jump to tab-2 (skipping tab-1)
    fireEvent.keyDown(tabOne, { key: "ArrowRight" });
    expect(handleChange).toHaveBeenCalledWith("tab-2");

    // End key should jump to last non-disabled tab (tab-2, since tab-3 is disabled)
    fireEvent.keyDown(tabOne, { key: "End" });
    expect(handleChange).toHaveBeenCalledWith("tab-2");

    // Home key jumps back to tab-1
    fireEvent.keyDown(tabOne, { key: "Home" });
    expect(handleChange).toHaveBeenCalledWith("tab-1");
  });

  it("ignores clicks on disabled tab", () => {
    const handleChange = vi.fn();

    render(
      <Tabs
        tabs={sampleTabs}
        activeTab="tab-1"
        onChange={handleChange}
      />
    );

    const tabThree = screen.getByRole("tab", { name: /Tab Three/i });
    expect(tabThree).toBeDisabled();
    fireEvent.click(tabThree);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("renders stacked layout, chevron, and custom badges", () => {
    render(
      <Tabs
        stacked
        size="large"
        roleVariant="admin"
        tabs={[
          {
            id: "starred",
            label: "Starred",
            icon: <span data-testid="test-icon">★</span>,
            showChevron: true,
            badge: "99+",
          },
        ]}
      />
    );

    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
    expect(screen.getByText("Starred")).toBeInTheDocument();
    expect(screen.getByText("99+")).toBeInTheDocument();
  });
});
