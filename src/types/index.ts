/**
 * Global types barrel re-export.
 * Feature-specific types live in features/<name>/types/*.types.ts
 * Truly shared types live here.
 */

// RBAC
export type { RBACRole, RBACSessionUser, PermissionContext, RoleName } from "@/features/rbac/types/rbac.types";

// Audit
export type { CreateAuditLogInput, AuditLogRecord } from "@/features/audit/types/audit.types";
export { AuditAction } from "@/features/audit/types/audit.types";

// Permissions
export type { PermissionKey } from "@/constants/permissions";
export { PERMISSIONS } from "@/constants/permissions";
