import { create } from "zustand";

/**
 * UI store — manages global UI state such as sidebar collapse.
 *
 * Naming convention: *.store.ts
 * Only UI state lives here — no business logic, no API calls.
 */

interface UIState {
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapsed: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  isSidebarCollapsed: false,

  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  setSidebarOpen: (open) => set({ isSidebarOpen: open }),

  toggleSidebarCollapsed: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
}));
