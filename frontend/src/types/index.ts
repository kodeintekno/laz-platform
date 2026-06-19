/**
 * Global types barrel re-export.
 * Truly shared types live in @shared (dipakai juga backend).
 */

// RBAC
export type {
  RBACRole,
  RBACSessionUser,
  PermissionContext,
  RoleName,
} from "@shared/types/rbac";

// Audit
export type { CreateAuditLogInput, AuditLogRecord } from "@/features/audit/types/audit.types";
export { AuditAction } from "@/features/audit/types/audit.types";

// Permissions
export type { PermissionKey } from "@shared/constants/permissions";
export { PERMISSIONS } from "@shared/constants/permissions";

// API envelope
export type { ApiResponse, ApiSuccess, ApiErrorBody, PaginationMeta } from "@shared/types/api";
