"use client";

import { useSession } from "next-auth/react";
import {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
} from "@/features/rbac/lib/permissions";
import type { PermissionKey } from "@/constants/permissions";
import type { PermissionContext } from "@/features/rbac/types/rbac.types";

/**
 * Client-side RBAC hook.
 *
 * Reads the current session and provides permission check utilities.
 * Use this in Client Components only. For Server Components, call
 * the permission helpers directly with the `auth()` session.
 *
 * @example
 *   const { can } = usePermission()
 *   if (can(PERMISSIONS.USERS_READ)) { ... }
 */
export function usePermission() {
  const { data: session, status } = useSession();

  const context: PermissionContext = {
    permissions: session?.user?.permissions ?? [],
  };

  return {
    /** True while the session is loading */
    isLoading: status === "loading",

    /** True if the user is authenticated */
    isAuthenticated: status === "authenticated",

    /** Check for a single permission */
    can: (permission: PermissionKey) => hasPermission(context, permission),

    /** Check for all given permissions */
    canAll: (permissions: PermissionKey[]) =>
      hasAllPermissions(context, permissions),

    /** Check for any of the given permissions */
    canAny: (permissions: PermissionKey[]) =>
      hasAnyPermission(context, permissions),

    /** The raw permission list from session */
    permissions: context.permissions,

    /** The current user's role name */
    roleName: session?.user?.roleName,
  };
}
