import { beforeEach, describe, expect, it } from "vitest";
import { useUIStore } from "@/stores/use-ui-store";

describe("useUIStore", () => {
  beforeEach(() => {
    useUIStore.getState().setSidebarCollapsed(false);
  });

  it("has default sidebarCollapsed as false", () => {
    expect(useUIStore.getState().sidebarCollapsed).toBe(false);
  });

  it("toggles sidebarCollapsed state", () => {
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);

    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarCollapsed).toBe(false);
  });

  it("sets sidebarCollapsed directly", () => {
    useUIStore.getState().setSidebarCollapsed(true);
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);
  });
});
