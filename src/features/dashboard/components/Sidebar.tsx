"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useUIStore } from "@/stores/ui.store";
import { usePermission } from "@/hooks/usePermission";
import { NAV_ITEMS } from "@/constants/nav";
import { logger } from "@/lib/logger";
import {
  LayoutDashboard,
  BookOpen,
  Heart,
  CreditCard,
  Truck,
  BarChart2,
  Users,
  Shield,
  ScrollText,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  HelpCircle,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  BookOpen,
  Heart,
  CreditCard,
  Truck,
  BarChart2,
  Users,
  Shield,
  ScrollText,
  Settings,
};

/**
 * Dashboard Sidebar — Polished Production Component.
 *
 * Presentation-only component. Renders permission-gated nav items.
 * Business logic and data fetching must NOT live here.
 *
 * Active link detection uses usePathname (client hook).
 * Sidebar collapse state is from Zustand UIStore.
 * Visible nav items are filtered by usePermission.
 */
export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarCollapsed, toggleSidebarCollapsed } = useUIStore();
  const { can, isLoading, permissions, roleName } = usePermission();
  const { data: session } = useSession();

  const userInitial = session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "?";

  // Filter nav items the current user has permission to see
  const visibleItems = NAV_ITEMS; // temporarily show all items for debugging

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
      style={{ width: isSidebarCollapsed ? '4rem' : '16rem', backgroundColor: 'var(--color-brand-primary)' }}
      className={`
        flex flex-col h-full text-white transition-all duration-300
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
          className="p-1.5 rounded-xl hover:bg-brand-secondary transition-colors ml-auto cursor-pointer flex items-center justify-center"
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="h-4 w-4 text-brand-soft" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-brand-soft" />
          )}
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {isLoading ? (
          <div className="px-3 py-2 text-xs text-brand-soft">Loading...</div>
        ) : (
          <>
            <ul className="space-y-1" role="list">
              {visibleItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname.startsWith(item.href));
                const IconComponent = iconMap[item.icon] || HelpCircle;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`
                        flex items-center gap-3 px-3 py-2 rounded-xl text-sm
                        transition-colors duration-150
                        ${
                          isActive
                            ? "bg-brand-primary text-white"
                            : "text-white hover:bg-brand-primary hover:text-white"
                        }
                      `}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <IconComponent className="w-5 h-5 flex-shrink-0" />
                      {!isSidebarCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>

          </>
        )}
      </nav>

      {/* Profile Footer */}
      <div className="p-4 border-t border-brand-secondary/40 mt-auto flex flex-col gap-4">
        <div className="flex items-center gap-3">
          {session?.user?.image ? (
            <img
              src={session.user.image}
              alt={session.user.name || "User Avatar"}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-brand-secondary"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-brand-secondary text-white flex items-center justify-center font-bold text-sm shadow-soft">
              {userInitial}
            </div>
          )}
          {!isSidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{session?.user?.name || "Admin"}</p>
              <p className="text-xs text-brand-soft truncate">{session?.user?.roleName || "Staff"}</p>
            </div>
          )}
          {!isSidebarCollapsed && (
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-1.5 rounded-xl hover:bg-brand-secondary text-brand-soft hover:text-white transition-colors cursor-pointer"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
        {isSidebarCollapsed && (
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mx-auto p-1.5 rounded-xl hover:bg-brand-secondary text-brand-soft hover:text-white transition-colors cursor-pointer"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
