import type { PermissionKey } from "../constants/permissions";

/**
 * RBAC core types — shared between backend (guards) and frontend (AuthProvider).
 * Plain types, no framework module augmentation.
 */

// ─── Role ────────────────────────────────────────────────────────────────────

export type RoleName =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "FINANCE"
  | "DONATUR"
  | "RELAWAN";

export interface RBACRole {
  id: string;
  name: RoleName;
  description?: string;
  permissions: PermissionKey[];
}

// ─── Session user ────────────────────────────────────────────────────────────

/**
 * The authenticated user shape attached to each request by the backend
 * AuthGuard and returned by `GET /api/auth/me`.
 */
export interface RBACSessionUser {
  id: string;
  email: string;
  name?: string | null;
  roleId?: string;
  roleName?: RoleName;
  permissions: PermissionKey[];
  lazId?: string;
  avatarUrl?: string | null;
  avatarPublicId?: string | null;
}

// ─── Permission Check Context ────────────────────────────────────────────────

/**
 * Minimal context shape used by the centralized permission helpers.
 * Accepts either a full session user or a reduced permission array.
 */
export interface PermissionContext {
  permissions: PermissionKey[];
  roleName?: RoleName;
}
