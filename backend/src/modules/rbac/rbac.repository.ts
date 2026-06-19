import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

/**
 * RBAC Repository — Roles, Permissions, and their mappings.
 */
@Injectable()
export class RbacRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getRoles() {
    return this.prisma.role.findMany({
      orderBy: { name: "asc" },
    });
  }

  async getPermissions() {
    return this.prisma.permission.findMany({
      orderBy: { key: "asc" },
    });
  }

  async getRolePermissions() {
    return this.prisma.rolePermission.findMany({
      include: {
        role: { select: { name: true } },
        permission: { select: { key: true } },
      },
    });
  }

  /**
   * Replace all permissions for a specific role.
   * Runs in a transaction: Deletes old mappings, inserts new ones.
   */
  async updateRolePermissions(roleId: string, permissionIds: string[]) {
    return this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({
        where: { roleId },
      });

      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({
            roleId,
            permissionId,
          })),
        });
      }
    });
  }
}
