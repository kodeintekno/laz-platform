import type { PermissionKey } from "../constants/permissions";
import type { PermissionContext } from "../types/rbac";

/**
 * Centralized permission helper functions.
 *
 * RULES:
 * - Never check roles directly in components, controllers, or guards.
 * - Always use these helpers to enforce RBAC.
 * - Backend uses these in PermissionsGuard; frontend in usePermission().
 */

/**
 * Check if a session context has a specific permission.
 */
export function hasPermission(
  context: PermissionContext | null | undefined,
  permission: PermissionKey,
): boolean {
  if (!context) return false;
  if (context.roleName === "SUPER_ADMIN") return true;
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
  if (context.roleName === "SUPER_ADMIN") return true;
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
  if (context.roleName === "SUPER_ADMIN") return true;
  return permissions.some((p) => context.permissions.includes(p));
}
