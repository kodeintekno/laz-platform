import { PERMISSIONS, type PermissionKey } from "@/constants/permissions";

/**
 * Sidebar navigation items.
 *
 * Each item declares the permission required to be visible.
 * The Sidebar component filters items based on the current user's permissions.
 * This ensures RBAC is data-driven, not scattered if/else role checks.
 */

export interface NavItem {
  label: string;
  href: string;
  icon: string; // Lucide icon name — resolved in Sidebar component
  permission: PermissionKey;
  children?: NavItem[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: "LayoutDashboard",
    permission: PERMISSIONS.DONATIONS_READ,
  },
  {
    label: "Programs",
    href: "/dashboard/programs",
    icon: "BookOpen",
    permission: PERMISSIONS.PROGRAMS_READ,
  },
  {
    label: "Donations",
    href: "/dashboard/donations",
    icon: "Heart",
    permission: PERMISSIONS.DONATIONS_READ,
  },
  {
    label: "Payments",
    href: "/dashboard/payments",
    icon: "CreditCard",
    permission: PERMISSIONS.PAYMENTS_READ,
  },
  {
    label: "Distributions",
    href: "/dashboard/distributions",
    icon: "Truck",
    permission: PERMISSIONS.DISTRIBUTIONS_READ,
  },
  {
    label: "Reports",
    href: "/dashboard/reports",
    icon: "BarChart2",
    permission: PERMISSIONS.REPORTS_READ,
  },
  {
    label: "User Management",
    href: "/dashboard/users",
    icon: "Users",
    permission: PERMISSIONS.USERS_READ,
  },
  
  {
    label: "LAZ Management",
    href: "/dashboard/laz",
    icon: "Building2",
    permission: PERMISSIONS.LAZ_MANAGE,
  },
  {
    label: "Hak Akses",
    href: "/dashboard/rbac",
    icon: "Shield",
    permission: PERMISSIONS.ROLES_MANAGE,
  },
  {
    label: "Audit Logs",
    href: "/dashboard/audit",
    icon: "ScrollText",
    permission: PERMISSIONS.AUDIT_READ,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: "Settings",
    permission: PERMISSIONS.SETTINGS_MANAGE,
  },
];
