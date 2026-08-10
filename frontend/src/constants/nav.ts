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
  permission?: PermissionKey;
  /**
   * Item hanya relevan untuk staff yang terikat ke satu lembaga (mis. profil
   * lembaga sendiri). SUPER_ADMIN lolos setiap permission check secara
   * otomatis (lihat hasPermission) walau lembagaId-nya null, jadi item ini
   * perlu difilter terpisah berdasarkan lembagaId, bukan permission saja.
   */
  requiresLembaga?: boolean;
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
    label: "Manajemen Lembaga",
    href: "/dashboard/lembaga",
    icon: "Building2",
    permission: PERMISSIONS.LEMBAGA_MANAGE,
  },
  {
    label: "Profil Lembaga",
    href: "/dashboard/lembaga/profil",
    icon: "Building2",
    permission: PERMISSIONS.LEMBAGA_READ,
    requiresLembaga: true,
  },
  {
    label: "Kegiatan Relawan",
    href: "/dashboard/relawan/kegiatan",
    icon: "HeartHandshake",
    permission: PERMISSIONS.VOLUNTEERS_MANAGE,
  },
  {
    label: "Pendaftaran Relawan",
    href: "/dashboard/relawan/pendaftaran",
    icon: "ClipboardCheck",
    permission: PERMISSIONS.VOLUNTEERS_MANAGE,
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
    label: "Akuntansi",
    href: "/dashboard/accounting",
    icon: "Calculator",
    requiresLembaga: true,
    children: [
      {
        label: "Dashboard",
        href: "/dashboard/accounting",
        icon: "LayoutDashboard",
        permission: PERMISSIONS.JOURNAL_READ, // Or a separate permission, but JOURNAL_READ is safe
      },
      {
        label: "Chart of Accounts",
        href: "/dashboard/coa",
        icon: "BookMarked",
        permission: PERMISSIONS.COA_READ,
      },
      {
        label: "Jurnal Umum",
        href: "/dashboard/journal",
        icon: "ClipboardList",
        permission: PERMISSIONS.JOURNAL_READ,
      },
    ],
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: "Settings",
  },
];
