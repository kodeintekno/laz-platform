import { rbacRepository } from "@/features/rbac/repositories/rbac.repository";
import { auditService } from "@/features/audit/services/audit.service";
import { AuditAction } from "@/features/audit/types/audit.types";

/**
 * RBAC Service — Phase 3.
 *
 * Orchestrates RBAC business logic, enforces safety guards (SUPER_ADMIN),
 * and emits audit logs.
 */
export const rbacService = {
  async getMatrixData() {
    const [roles, permissions, rolePermissions] = await Promise.all([
      rbacRepository.getRoles(),
      rbacRepository.getPermissions(),
      rbacRepository.getRolePermissions(),
    ]);

    // Format into an easy-to-consume lookup matrix for the UI
    const activeMappings = new Set(
      rolePermissions.map((rp) => `${rp.roleId}_${rp.permissionId}`)
    );

    return { roles, permissions, activeMappings };
  },

  async updateRolePermissions(roleId: string, permissionIds: string[], adminUserId: string) {
    // 1. Safety Guard: Prevent stripping 'roles.manage' from SUPER_ADMIN
    const roles = await rbacRepository.getRoles();
    const targetRole = roles.find((r) => r.id === roleId);

    if (!targetRole) {
      throw new Error("Role tidak ditemukan");
    }

    if (targetRole.name === "SUPER_ADMIN") {
      const permissions = await rbacRepository.getPermissions();
      const rolesManagePerm = permissions.find((p) => p.key === "roles.manage");
      
      if (rolesManagePerm && !permissionIds.includes(rolesManagePerm.id)) {
        throw new Error(
          "Keamanan: SUPER_ADMIN tidak boleh kehilangan akses roles.manage"
        );
      }
    }

    // 2. Perform Update
    await rbacRepository.updateRolePermissions(roleId, permissionIds);

    // 3. Emit Audit Log
    await auditService.log({
      userId: adminUserId,
      action: AuditAction.UPDATE,
      entity: "RolePermission",
      entityId: roleId,
      newData: { role: targetRole.name, permissionIds },
    });
  },
};
