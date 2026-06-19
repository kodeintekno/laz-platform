import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { usePermission } from "@/hooks/usePermission";
import type { PermissionKey } from "@shared/constants/permissions";

/**
 * Guard permission level route — pengganti aturan src/proxy.ts.
 * Backend tetap menegakkan via @RequirePermission (batas keamanan asli).
 */
export function RequirePermission({
  permission,
  children,
}: {
  permission: PermissionKey;
  children: ReactNode;
}) {
  const { can, isLoading } = usePermission();

  if (isLoading) return null;
  if (!can(permission)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}
