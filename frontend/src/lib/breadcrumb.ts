/**
 * Breadcrumb Resolution Utilities.
 * Handles parsing Next.js route paths, translating static route segments,
 * and formatting dynamic slugs or IDs into human-readable labels.
 */

export interface BreadcrumbItem {
  label: string;
  href: string;
  isLast: boolean;
  key: string;
}

// Indonesian translations for static route segments
export const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  audit: "Audit Log",
  distributions: "Distribusi",
  donations: "Donasi",
  payments: "Pembayaran",
  programs: "Program",
  new: "Tambah Baru",
  edit: "Ubah",
  lembaga: "Manajemen Lembaga",
  relawan: "Relawan",
  rbac: "Hak Akses",
  reports: "Laporan",
  settings: "Pengaturan",
  users: "Pengguna",
};

// Set of valid listing page paths in the dashboard
const VALID_PATHS = new Set([
  "/dashboard",
  "/dashboard/users",
  "/dashboard/lembaga",
  "/dashboard/relawan",
  "/dashboard/programs",
  "/dashboard/donations",
  "/dashboard/distributions",
  "/dashboard/payments",
  "/dashboard/audit",
  "/dashboard/reports",
  "/dashboard/settings",
  "/dashboard/rbac",
]);

/**
 * Format dynamic slugs (e.g. "clean-water-project" -> "Clean Water Project")
 * If the segment matches a typical UUID or numeric ID, fallback to "Detail" or "Item".
 */
export function formatSegmentLabel(segment: string): string {
  if (!segment) return "";

  // Check if segment is a numeric ID (e.g., "123"), typical UUID, or CUID (e.g., cmpq...)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);
  const isNumeric = /^\d+$/.test(segment);
  const isCuid = /^c[a-z0-9]{24}$/i.test(segment);
  
  if (isUuid || isNumeric || isCuid) {
    return "Detail";
  }

  // Convert hyphens and underscores to spaces and capitalize each word
  return segment
    .split(/[-_]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Generates an array of breadcrumb items from a pathname and user overrides.
 * 
 * @param pathname Current router path (e.g. "/dashboard/programs/water-source/new")
 * @param overrides Client/Page overrides mapping exact path to custom labels
 */
export function resolveBreadcrumbs(
  pathname: string,
  overrides: Record<string, string> = {}
): BreadcrumbItem[] {
  // Normalize path by stripping query params/hashes and trailing slashes
  const cleanPath = pathname.split(/[?#]/)[0].replace(/\/+$/, "");
  if (!cleanPath || cleanPath === "") {
    return [{ label: "Dashboard", href: "/dashboard", isLast: true, key: "/dashboard" }];
  }

  const segments = cleanPath.split("/").filter(Boolean);
  const items: BreadcrumbItem[] = [];
  let accumulatedPath = "";

  segments.forEach((segment, index) => {
    accumulatedPath += `/${segment}`;
    const isLast = index === segments.length - 1;

    // Resolve label priority:
    // 1. Exact path override from page provider
    // 2. Predefined translation dictionary
    // 3. Automated dynamic slug formatter
    let label = overrides[accumulatedPath];
    if (!label) {
      const lowerSegment = segment.toLowerCase();
      label = ROUTE_LABELS[lowerSegment] || formatSegmentLabel(segment);
    }

    // Resolve href: if the accumulated path is in VALID_PATHS, link to it.
    // Otherwise, link to the nearest parent path that is in VALID_PATHS.
    let href = accumulatedPath;
    if (!VALID_PATHS.has(href)) {
      const parts = href.split("/");
      while (parts.length > 0) {
        parts.pop();
        const parentPath = parts.join("/");
        if (VALID_PATHS.has(parentPath)) {
          href = parentPath;
          break;
        }
      }
    }

    items.push({
      label,
      href,
      isLast,
      key: accumulatedPath,
    });
  });

  return items;
}
