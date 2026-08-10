"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useUIStore } from "@/stores/ui.store";
import { useAuth } from "@/auth/AuthProvider";
import { usePermission } from "@/hooks/usePermission";
import type { NavItem } from "@/constants/nav";
import { NAV_ITEMS } from "@/constants/nav";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
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
  LogOut,
  HelpCircle,
  Building2,
  HeartHandshake,
  ClipboardCheck,
  BookMarked,
  ClipboardList,
  Calculator,
  ChevronDown,
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
  Building2,
  HeartHandshake,
  ClipboardCheck,
  BookMarked,
  ClipboardList,
  Calculator,
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
export function Sidebar({ initialItems, user }: { initialItems?: NavItem[], user?: any } = {}) {
  const pathname = usePathname();
  const { isSidebarOpen, toggleSidebar, isSidebarCollapsed, toggleSidebarCollapsed } = useUIStore();
  const { can, isLoading, permissions, roleName } = usePermission();
  const { user: authUser } = useAuth();
  // When initialItems are provided (from server), skip permission checks
  const visibleItems =
    initialItems ??
    NAV_ITEMS.filter((item) => {
      if (item.permission && !can(item.permission)) return false;
      // SUPER_ADMIN lolos setiap permission check otomatis meski lembagaId-nya
      // null — item yang hanya relevan untuk staff satu lembaga (mis. profil
      // lembaga sendiri) harus tetap difilter berdasarkan lembagaId asli.
      if (item.requiresLembaga && !authUser?.lembagaId) return false;
      return true;
    });
  const { data: session } = useSession();
  const activeUser = user || session?.user;
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  // Initialize collapse state only on desktop
  const [mounted, setMounted] = useState(false);

  const userInitial = (activeUser?.name || session?.user?.name || "?").charAt(0).toUpperCase();

  // Filter nav items the current user has permission to see
  // removed original visibleItems calculation – now handled above

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
    <>
      {/* Mobile overlay backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 lg:hidden transition-opacity duration-300 ease-in-out z-30 ${
          isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={toggleSidebar}
        aria-label="Close sidebar overlay"
      />

      <aside
        className={`
          flex flex-col h-full text-primary
          bg-surface/95 backdrop-blur-sm rounded-r-2xl shadow-md
          transition-all duration-300 ease-in-out
          w-64 ${isSidebarCollapsed ? "lg:w-16" : "lg:w-64"}
          fixed inset-y-0 left-0 z-40
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:relative lg:translate-x-0 lg:static
        `}
        aria-label="Dashboard navigation"
      >
        {/* Header with mobile hamburger */}
        <div className="flex items-center px-5 h-16 bg-surface/80 backdrop-blur-sm overflow-hidden flex-shrink-0">
          <div className="flex items-center w-full justify-start">
            <Link href="/" className="flex items-center gap-2.5">
              <img
                src="/logo.png"
                alt="Ruang Berbagi"
                className="h-8 w-auto object-contain flex-shrink-0"
              />
              <span className={`text-lg font-black tracking-tight text-emerald-950 transition-all duration-300 ease-in-out truncate ${isSidebarCollapsed ? "opacity-0 max-w-0 ml-0 pointer-events-none" : "opacity-100 max-w-[180px]"}`}>
                ruang <span className="text-emerald-600">berbagi</span>
              </span>
            </Link>
          </div>
        </div>

        {/* Nav Items */}
        <nav className={`flex-1 py-4 px-2 ${isSidebarCollapsed ? "overflow-y-visible overflow-x-visible" : "overflow-y-auto"}`}>
          {isLoading ? (
            <div className="space-y-1">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex items-center px-3 py-2.5 rounded-xl"
                >
                  <Skeleton variant="rectangular" className="w-5 h-5 flex-shrink-0" />
                  <Skeleton
                    variant="text"
                    className={`transition-all duration-300 ease-in-out ${
                      isSidebarCollapsed 
                        ? "opacity-0 max-w-0 ml-0 pointer-events-none" 
                        : "opacity-100 max-w-[120px] ml-3 h-4 w-24"
                    }`}
                  />
                </div>
              ))}
            </div>
          ) : (
            <>
              <ul className="space-y-1" role="list">
                {visibleItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href)) ||
                    (item.children?.some(child => pathname.startsWith(child.href)) ?? false);
                  const IconComponent = iconMap[item.icon] || HelpCircle;

                  if (item.children && item.children.length > 0) {
                    const isOpen = openMenus[item.label] ?? isActive;
                    return (
                      <li key={item.label} className="flex flex-col">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            if (isSidebarCollapsed) toggleSidebarCollapsed();
                            toggleMenu(item.label);
                          }}
                          className={`w-full relative group flex items-center justify-between px-3 py-2.5 text-sm rounded-xl transition-all duration-200 ${
                            isActive
                              ? "bg-surface-soft text-brand-primary font-semibold"
                              : "text-secondary hover:bg-surface-muted hover:text-primary"
                          }`}
                        >
                          <div className="flex items-center">
                            <IconComponent
                              className={`w-5 h-5 flex-shrink-0 transition-colors duration-200 ${
                                isActive ? "text-brand-primary" : "text-secondary group-hover:text-primary"
                              }`}
                            />
                            <span className={`transition-all duration-300 ease-in-out truncate ${isSidebarCollapsed ? "opacity-0 max-w-0 ml-0 pointer-events-none" : "opacity-100 max-w-[150px] ml-3"}`}>
                              {item.label}
                            </span>
                          </div>
                          {!isSidebarCollapsed && (
                            <ChevronDown className={`w-4 h-4 text-secondary transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                          )}
                          
                          {/* Tooltip on Collapsed Hover */}
                          {isSidebarCollapsed && (
                            <div className="absolute left-full ml-3 px-2 py-1 bg-text-primary text-white text-[11px] font-medium rounded-lg shadow-soft pointer-events-none opacity-0 translate-x-[-4px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 whitespace-nowrap z-50">
                              {item.label}
                            </div>
                          )}
                        </button>
                        
                        {!isSidebarCollapsed && isOpen && (
                          <ul className="mt-1 space-y-1 ml-5 pl-4 border-l border-surface-border">
                            {item.children.map(child => {
                              if (child.permission && !can(child.permission)) return null;
                              const isChildActive = pathname === child.href || (child.href !== "/dashboard" && pathname.startsWith(child.href));
                              const ChildIcon = iconMap[child.icon] || HelpCircle;
                              return (
                                <li key={child.href}>
                                  <Link
                                    href={child.href}
                                    className={`flex items-center px-3 py-2 text-sm rounded-xl transition-all duration-200 ${
                                      isChildActive
                                        ? "bg-surface-soft text-brand-primary font-semibold"
                                        : "text-secondary hover:bg-surface-muted hover:text-primary"
                                    }`}
                                  >
                                    <ChildIcon className={`w-4 h-4 mr-3 flex-shrink-0 ${isChildActive ? "text-brand-primary" : "text-secondary"}`} />
                                    <span className="truncate">{child.label}</span>
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </li>
                    );
                  }

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`relative group flex items-center px-3 py-2.5 text-sm rounded-xl transition-all duration-200 ${
                          isActive
                            ? "bg-surface-soft text-brand-primary font-semibold"
                            : "text-secondary hover:bg-surface-muted hover:text-primary"
                        }`}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <IconComponent
                          className={`w-5 h-5 flex-shrink-0 transition-colors duration-200 ${
                            isActive ? "text-brand-primary" : "text-secondary group-hover:text-primary"
                          }`}
                        />
                        <span className={`transition-all duration-300 ease-in-out truncate ${isSidebarCollapsed ? "opacity-0 max-w-0 ml-0 pointer-events-none" : "opacity-100 max-w-[180px] ml-3"}`}>
                          {item.label}
                        </span>

                        {/* Tooltip on Collapsed Hover */}
                        {isSidebarCollapsed && (
                          <div className="absolute left-full ml-3 px-2 py-1 bg-text-primary text-white text-[11px] font-medium rounded-lg shadow-soft pointer-events-none opacity-0 translate-x-[-4px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 whitespace-nowrap z-50">
                            {item.label}
                          </div>
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
        <div className="p-4 mt-auto flex flex-col gap-4 bg-surface/80 backdrop-blur-sm overflow-hidden flex-shrink-0">
          <div className="flex items-center w-full justify-between">
            <div className="flex items-center min-w-0 flex-1">
              {activeUser?.avatarUrl || activeUser?.image ? (
                <img
                  src={activeUser?.avatarUrl || activeUser?.image}
                  alt={activeUser?.name || "User Avatar"}
                  className="w-8 h-8 rounded-full object-cover shadow-sm flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-surface-muted text-primary flex items-center justify-center font-bold text-sm shadow-soft flex-shrink-0">
                  {userInitial}
                </div>
              )}
              <div className={`min-w-0 flex-1 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? "opacity-0 max-w-0 ml-0 pointer-events-none" : "opacity-100 max-w-[180px] ml-3"}`}>
                <p className="text-sm font-semibold text-primary truncate">{activeUser?.name || "Admin"}</p>
                <p className="text-xs text-secondary truncate">{activeUser?.roleName || "Staff"}</p>
              </div>
            </div>
            <button
              onClick={() => setIsLogoutConfirmOpen(true)}
              className={`rounded-xl hover:bg-surface-muted text-primary hover:text-primary flex-shrink-0 flex items-center justify-center transition-all duration-300 ease-in-out ${
                isSidebarCollapsed 
                  ? "opacity-0 max-w-0 p-0 pointer-events-none overflow-hidden" 
                  : "opacity-100 max-w-10 p-1.5"
              }`}
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <ConfirmDialog
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={() => signOut({ callbackUrl: "/login" })}
        title="Konfirmasi Keluar"
        message="Apakah Anda yakin ingin keluar dari akun Anda?"
        confirmText="Keluar"
        cancelText="Batal"
        intent="destructive"
      />
    </>
  );
}
