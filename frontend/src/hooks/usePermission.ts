import { useAuth } from "@/auth/AuthProvider";
import {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
} from "@shared/lib/permissions";
import type { PermissionKey } from "@shared/constants/permissions";
import type { PermissionContext } from "@shared/types/rbac";

/**
 * Client-side RBAC hook — API sama dengan versi NextAuth lama
 * (can/canAll/canAny), kini di atas AuthProvider.
 *
 * @example
 *   const { can } = usePermission()
 *   if (can(PERMISSIONS.USERS_READ)) { ... }
 */
export function usePermission() {
  const { user, isLoading } = useAuth();

  const context: PermissionContext = {
    permissions: user?.permissions ?? [],
    roleName: user?.roleName,
  };

  return {
    /** True while the session is loading */
    isLoading,

    /** True if the user is authenticated */
    isAuthenticated: !!user,

    /** Check for a single permission */
    can: (permission: PermissionKey) => hasPermission(context, permission),

    /** Check for all given permissions */
    canAll: (permissions: PermissionKey[]) => hasAllPermissions(context, permissions),

    /** Check for any of the given permissions */
    canAny: (permissions: PermissionKey[]) => hasAnyPermission(context, permissions),

    /** The raw permission list from session */
    permissions: context.permissions,

    /** The current user's role name */
    roleName: user?.roleName,
  };
}
