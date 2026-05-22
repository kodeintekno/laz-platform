"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/stores/ui.store";
import { usePermission } from "@/hooks/usePermission";
import { NAV_ITEMS } from "@/constants/nav";

/**
 * Dashboard Sidebar — Phase 1 Shell.
 *
 * Presentation-only component. Renders permission-gated nav items.
 * Business logic and data fetching must NOT live here.
 *
 * Active link detection uses usePathname (client hook).
 * Sidebar collapse state is from Zustand UIStore.
 * Visible nav items are filtered by usePermission.
 *
 * TODO (Dashboard Phase): Add icon rendering with lucide-react.
 * TODO (Dashboard Phase): Add user avatar + signout button.
 */
export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarCollapsed, toggleSidebarCollapsed } = useUIStore();
  const { can, isLoading } = usePermission();

  // Filter nav items the current user has permission to see
  const visibleItems = NAV_ITEMS.filter((item) => can(item.permission));

  return (
    <aside
      className={`
        flex flex-col h-full bg-gray-900 text-white transition-all duration-300
        ${isSidebarCollapsed ? "w-16" : "w-64"}
      `}
      aria-label="Dashboard navigation"
    >
      {/* Logo / Brand */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 h-16">
        {!isSidebarCollapsed && (
          <span className="text-lg font-bold tracking-tight text-white">
            LAZ Platform
          </span>
        )}
        <button
          onClick={toggleSidebarCollapsed}
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="p-1.5 rounded-md hover:bg-gray-700 transition-colors ml-auto"
        >
          {/* Chevron placeholder — replaced with lucide icon in Dashboard Phase */}
          <span className="text-gray-400 text-xs">
            {isSidebarCollapsed ? "›" : "‹"}
          </span>
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {isLoading ? (
          <div className="px-3 py-2 text-xs text-gray-500">Loading...</div>
        ) : (
          <ul className="space-y-1" role="list">
            {visibleItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" &&
                  pathname.startsWith(item.href));

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-md text-sm
                      transition-colors duration-150
                      ${
                        isActive
                          ? "bg-indigo-600 text-white"
                          : "text-gray-300 hover:bg-gray-700 hover:text-white"
                      }
                    `}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {/* Icon placeholder — replaced with lucide-react icons in Dashboard Phase */}
                    <span className="w-5 h-5 flex-shrink-0 text-center text-xs opacity-70">
                      ○
                    </span>
                    {!isSidebarCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      {/* Footer / Version */}
      {!isSidebarCollapsed && (
        <div className="p-4 border-t border-gray-700">
          <p className="text-xs text-gray-500">v0.1.0 — Phase 1</p>
        </div>
      )}
    </aside>
  );
}
