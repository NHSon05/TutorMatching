import { beforeEach, describe, expect, it } from "vitest";
import { useUIStore } from "@/stores/use-ui-store";

describe("useUIStore", () => {
  beforeEach(() => {
    useUIStore.getState().setSidebarCollapsed(false);
  });

  it("has default sidebarCollapsed as false and mode as expanded", () => {
    expect(useUIStore.getState().sidebarCollapsed).toBe(false);
    expect(useUIStore.getState().mode).toBe("expanded");
  });

  it("toggles sidebarCollapsed state and synchronizes mode", () => {
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);
    expect(useUIStore.getState().mode).toBe("collapsed");

    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarCollapsed).toBe(false);
    expect(useUIStore.getState().mode).toBe("expanded");
  });

  it("sets sidebarCollapsed directly and synchronizes mode", () => {
    useUIStore.getState().setSidebarCollapsed(true);
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);
    expect(useUIStore.getState().mode).toBe("collapsed");

    useUIStore.getState().setSidebarCollapsed(false);
    expect(useUIStore.getState().sidebarCollapsed).toBe(false);
    expect(useUIStore.getState().mode).toBe("expanded");
  });

  it("toggles mode state and synchronizes sidebarCollapsed", () => {
    useUIStore.getState().toggleMode();
    expect(useUIStore.getState().mode).toBe("collapsed");
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);

    useUIStore.getState().toggleMode();
    expect(useUIStore.getState().mode).toBe("expanded");
    expect(useUIStore.getState().sidebarCollapsed).toBe(false);
  });

  it("sets mode directly and synchronizes sidebarCollapsed", () => {
    useUIStore.getState().setMode("collapsed");
    expect(useUIStore.getState().mode).toBe("collapsed");
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);

    useUIStore.getState().setMode("expanded");
    expect(useUIStore.getState().mode).toBe("expanded");
    expect(useUIStore.getState().sidebarCollapsed).toBe(false);
  });
});
