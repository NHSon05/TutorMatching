import { create } from "zustand";

export interface UIState {
  /**
   * Trạng thái thu gọn/mở rộng của navigation rail / sidebar
   */
  sidebarCollapsed: boolean;

  /**
   * Toggle trạng thái sidebar
   */
  toggleSidebar: () => void;

  /**
   * Đặt trạng thái sidebar trực tiếp
   */
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setSidebarCollapsed: (collapsed) =>
    set({ sidebarCollapsed: collapsed }),
}));
