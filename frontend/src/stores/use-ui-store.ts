import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { NavigationRailMode } from "@/components/ui/navigation-rail";

export type { NavigationRailMode };

export interface UIState {
  /**
   * Trạng thái thu gọn/mở rộng của navigation rail / sidebar
   */
  sidebarCollapsed: boolean;

  /**
   * Chế độ hiển thị của navigation rail ("expanded" | "collapsed")
   */
  mode: NavigationRailMode;

  /**
   * Toggle trạng thái sidebar
   */
  toggleSidebar: () => void;

  /**
   * Đặt trạng thái sidebar trực tiếp
   */
  setSidebarCollapsed: (collapsed: boolean) => void;

  /**
   * Toggle trạng thái mode ("expanded" <-> "collapsed")
   */
  toggleMode: () => void;

  /**
   * Đặt trạng thái mode trực tiếp
   */
  setMode: (mode: NavigationRailMode) => void;
}

const memoryStorage = new Map<string, string>();

const getSafeStorage = () => {
  if (
    typeof window !== "undefined" &&
    window.localStorage &&
    typeof window.localStorage.getItem === "function" &&
    typeof window.localStorage.setItem === "function"
  ) {
    return window.localStorage;
  }
  return {
    getItem: (key: string) => memoryStorage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memoryStorage.set(key, value);
    },
    removeItem: (key: string) => {
      memoryStorage.delete(key);
    },
  };
};

const syncModeToLocalStorage = (mode: NavigationRailMode) => {
  try {
    getSafeStorage().setItem("mode", mode);
  } catch {
    // ignore
  }
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mode: "expanded",

      toggleSidebar: () =>
        set((state) => {
          const nextCollapsed = !state.sidebarCollapsed;
          const nextMode: NavigationRailMode = nextCollapsed
            ? "collapsed"
            : "expanded";
          syncModeToLocalStorage(nextMode);
          return {
            sidebarCollapsed: nextCollapsed,
            mode: nextMode,
          };
        }),

      setSidebarCollapsed: (collapsed) =>
        set(() => {
          const nextMode: NavigationRailMode = collapsed
            ? "collapsed"
            : "expanded";
          syncModeToLocalStorage(nextMode);
          return {
            sidebarCollapsed: collapsed,
            mode: nextMode,
          };
        }),

      toggleMode: () =>
        set((state) => {
          const nextMode: NavigationRailMode =
            state.mode === "expanded" ? "collapsed" : "expanded";
          syncModeToLocalStorage(nextMode);
          return {
            mode: nextMode,
            sidebarCollapsed: nextMode === "collapsed",
          };
        }),

      setMode: (mode) =>
        set(() => {
          syncModeToLocalStorage(mode);
          return {
            mode,
            sidebarCollapsed: mode === "collapsed",
          };
        }),
    }),
    {
      name: "ui-storage",
      storage: createJSONStorage(() => getSafeStorage()!),
      onRehydrateStorage: () => (state) => {
        const storage = getSafeStorage();
        if (storage && state) {
          try {
            const directMode = storage.getItem("mode");
            if (directMode === "collapsed" || directMode === "expanded") {
              state.mode = directMode;
              state.sidebarCollapsed = directMode === "collapsed";
            } else {
              storage.setItem("mode", state.mode);
            }
          } catch {
            // ignore
          }
        }
      },
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        mode: state.mode,
      }),
    }
  )
);
