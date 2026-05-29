/**
 * Auth feature types — Phase 1 scaffold.
 *
 * Extended NextAuth types for the custom session shape with RBAC fields.
 * These types augment the default `next-auth` module declarations.
 */

import type { PermissionKey } from "@/constants/permissions";
import type { RoleName } from "@/features/rbac/types/rbac.types";
import type { DefaultSession } from "next-auth";

/**
 * Augment the NextAuth Session type to include custom RBAC fields.
 * This makes `session.user.permissions` and `session.user.roleName`
 * type-safe throughout the entire application.
 */
declare module "next-auth" {
    interface Session {
      user: {
        id: string;
        roleName?: RoleName;
        roleId?: string;
        permissions: PermissionKey[];
        lazId?: string;
        avatarUrl?: string;
        avatarPublicId?: string;
      } & DefaultSession["user"];
    }

    interface JWT {
      id?: string;
      roleName?: RoleName;
      roleId?: string;
      permissions?: PermissionKey[];
      lazId?: string;
      avatarUrl?: string;
      avatarPublicId?: string;
    }

    // Extend the AdapterUser (returned by the adapter) with avatar fields
    interface User {
      avatarUrl?: string;
      avatarPublicId?: string;
    }

    interface AdapterUser {
      avatarUrl?: string;
      avatarPublicId?: string;
    }
  }
