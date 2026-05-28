import type { PermissionKey } from "@/constants/permissions";

/**
 * RBAC core types — Phase 1 scaffold.
 *
 * These types represent the shape of RBAC data that flows through
 * the application. DB model relations are added in the User/RBAC phase.
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

// ─── Session with RBAC ───────────────────────────────────────────────────────

/**
 * Extended session user — injected into JWT then exposed via session callback.
 * The base `Session["user"]` is augmented with RBAC fields.
 */
export interface RBACSessionUser {
  id: string;
  email: string;
  name?: string | null;
  roleId?: string;
  roleName?: RoleName;
  permissions: PermissionKey[];
  lazId?: string;
}

// ─── Permission Check Context ────────────────────────────────────────────────

/**
 * Minimal context shape used by the centralized permission helpers.
 * Accepts either a full session user or a reduced permission array.
 */
export interface PermissionContext {
  permissions: PermissionKey[];
}
