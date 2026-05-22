import { prisma } from "@/lib/prisma";

/**
 * RBAC Repository — Phase 3.
 *
 * Handles database access for Roles, Permissions, and their mappings.
 */
export const rbacRepository = {
  /**
   * Fetch all roles.
   */
  async getRoles() {
    return prisma.role.findMany({
      orderBy: { name: "asc" },
    });
  },

  /**
   * Fetch all system permissions.
   */
  async getPermissions() {
    return prisma.permission.findMany({
      orderBy: { key: "asc" },
    });
  },

  /**
   * Fetch current mappings (which role has which permissions).
   */
  async getRolePermissions() {
    return prisma.rolePermission.findMany({
      include: {
        role: { select: { name: true } },
        permission: { select: { key: true } },
      },
    });
  },

  /**
   * Replace all permissions for a specific role.
   * Runs in a transaction: Deletes old mappings, inserts new ones.
   */
  async updateRolePermissions(roleId: string, permissionIds: string[]) {
    return prisma.$transaction(async (tx) => {
      // 1. Delete all existing mappings for this role
      await tx.rolePermission.deleteMany({
        where: { roleId },
      });

      // 2. Insert new mappings
      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({
            roleId,
            permissionId,
          })),
        });
      }
    });
  },
};
