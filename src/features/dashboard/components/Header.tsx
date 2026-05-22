"use client";

import { useUIStore } from "@/stores/ui.store";

/**
 * Dashboard Header — Phase 1 Shell.
 *
 * Presentation-only top bar.
 * TODO (Dashboard Phase):
 * - Add breadcrumbs
 * - Add notification bell
 * - Add user avatar dropdown with signout
 */
export function Header() {
  const { toggleSidebar } = useUIStore();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      {/* Left: Mobile sidebar toggle */}
      <button
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
        className="p-2 rounded-md text-gray-500 hover:bg-gray-100 transition-colors lg:hidden"
      >
        <span className="sr-only">Toggle sidebar</span>
        {/* Hamburger placeholder — replaced with lucide icon in Dashboard Phase */}
        <span className="text-lg">☰</span>
      </button>

      {/* Center / Left: Page title placeholder */}
      <div className="flex-1 px-4">
        <p className="text-sm text-gray-500 font-medium">Dashboard</p>
      </div>

      {/* Right: Actions placeholder */}
      <div className="flex items-center gap-3">
        {/* TODO: Notification bell, user avatar */}
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
          <span className="text-xs font-medium text-indigo-700">?</span>
        </div>
      </div>
    </header>
  );
}
