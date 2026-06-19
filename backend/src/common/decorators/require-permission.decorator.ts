import { SetMetadata } from "@nestjs/common";
import type { PermissionKey } from "../../../../shared/constants/permissions";

export const PERMISSION_KEY = "requiredPermission";

/** Route butuh permission tertentu — dibaca PermissionsGuard via Reflector. */
export const RequirePermission = (permission: PermissionKey) =>
  SetMetadata(PERMISSION_KEY, permission);
