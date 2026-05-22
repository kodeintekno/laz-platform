import type { PermissionKey } from "@/constants/permissions";
import type { PermissionContext } from "@/features/rbac/types/rbac.types";

/**
 * Centralized permission helper functions.
 *
 * RULES:
 * - Never check roles directly in components or pages.
 * - Always use these helpers to enforce RBAC.
 * - Middleware and Server Components use `auth()` + these helpers.
 * - Client Components use the `usePermission` hook (which wraps these).
 *
 * TODO (RBAC Phase): Connect to actual session data from NextAuth.
 */

/**
 * Check if a session context has a specific permission.
 *
 * @example
 *   const session = await auth()
 *   if (!hasPermission(session?.user, PERMISSIONS.USERS_READ)) {
 *     redirect("/unauthorized")
 *   }
 */
export function hasPermission(
  context: PermissionContext | null | undefined,
  permission: PermissionKey,
): boolean {
  if (!context) return false;
  return context.permissions.includes(permission);
}

/**
 * Check if a session context has ALL of the given permissions.
 */
export function hasAllPermissions(
  context: PermissionContext | null | undefined,
  permissions: PermissionKey[],
): boolean {
  if (!context) return false;
  return permissions.every((p) => context.permissions.includes(p));
}

/**
 * Check if a session context has ANY of the given permissions.
 */
export function hasAnyPermission(
  context: PermissionContext | null | undefined,
  permissions: PermissionKey[],
): boolean {
  if (!context) return false;
  return permissions.some((p) => context.permissions.includes(p));
}
