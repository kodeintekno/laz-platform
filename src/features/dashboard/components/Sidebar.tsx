"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/stores/ui.store";
import { usePermission } from "@/hooks/usePermission";
import { NAV_ITEMS } from "@/constants/nav";
import { logger } from "@/lib/logger";

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
  const { can, isLoading, permissions, roleName } = usePermission();

  // Filter nav items the current user has permission to see
  const visibleItems = NAV_ITEMS.filter((item) => can(item.permission));

  useEffect(() => {
    logger.info(
      {
        isLoading,
        roleName,
        permissionsCount: permissions?.length || 0,
        permissions,
        visibleItemsCount: visibleItems.length,
        visibleItems: visibleItems.map((item) => item.label),
      },
      "Sidebar RBAC State"
    );
  }, [isLoading, roleName, permissions, visibleItems]);




  return (
    <aside
      className={`
        flex flex-col h-full bg-brand-primary text-white transition-all duration-300
        ${isSidebarCollapsed ? "w-16" : "w-64"}
      `}
      aria-label="Dashboard navigation"
    >
      {/* Logo / Brand */}
      <div className="flex items-center justify-between p-4 border-b border-brand-secondary/40 h-16">
        {!isSidebarCollapsed && (
          <span className="text-lg font-bold tracking-tight text-white">
            LAZ Platform
          </span>
        )}
        <button
          onClick={toggleSidebarCollapsed}
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="p-1.5 rounded-xl hover:bg-brand-secondary transition-colors ml-auto cursor-pointer"
        >
          {/* Chevron placeholder — replaced with lucide icon in Dashboard Phase */}
          <span className="text-brand-soft text-xs">
            {isSidebarCollapsed ? "›" : "‹"}
          </span>
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {isLoading ? (
          <div className="px-3 py-2 text-xs text-brand-soft">Loading...</div>
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
                      flex items-center gap-3 px-3 py-2 rounded-xl text-sm
                      transition-colors duration-150
                      ${
                        isActive
                          ? "bg-brand-secondary text-white"
                          : "text-surface-soft hover:bg-brand-secondary hover:text-white"
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
        <div className="p-4 border-t border-brand-secondary/40">
          <p className="text-xs text-brand-soft">v0.1.0 — Phase 1</p>
        </div>
      )}
    </aside>
  );
}
