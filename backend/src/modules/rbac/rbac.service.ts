import { Injectable, NotFoundException } from "@nestjs/common";
import { RbacRepository } from "./rbac.repository";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "../audit/audit.types";
import { AppError } from "../../common/errors/app.error";

/**
 * RBAC Service — enforces safety guards (SUPER_ADMIN) and emits audit logs.
 */
@Injectable()
export class RbacService {
  constructor(
    private readonly rbacRepository: RbacRepository,
    private readonly auditService: AuditService,
  ) {}

  async getMatrixData() {
    const [roles, permissions, rolePermissions] = await Promise.all([
      this.rbacRepository.getRoles(),
      this.rbacRepository.getPermissions(),
      this.rbacRepository.getRolePermissions(),
    ]);

    // Format into an easy-to-consume lookup matrix for the UI
    const activeMappings = rolePermissions.map((rp) => `${rp.roleId}_${rp.permissionId}`);

    return { roles, permissions, activeMappings };
  }

  async getRoles() {
    return this.rbacRepository.getRoles();
  }

  async updateRolePermissions(roleId: string, permissionIds: string[], adminUserId: string) {
    // 1. Safety Guard: Prevent stripping 'roles.manage' from SUPER_ADMIN
    const roles = await this.rbacRepository.getRoles();
    const targetRole = roles.find((r) => r.id === roleId);

    if (!targetRole) {
      throw new NotFoundException("Role tidak ditemukan");
    }

    if (targetRole.name === "SUPER_ADMIN") {
      const permissions = await this.rbacRepository.getPermissions();
      const rolesManagePerm = permissions.find((p) => p.key === "roles.manage");

      if (rolesManagePerm && !permissionIds.includes(rolesManagePerm.id)) {
        throw new AppError(
          "SUPER_ADMIN_GUARD",
          "Keamanan: SUPER_ADMIN tidak boleh kehilangan akses roles.manage",
          409,
        );
      }
    }

    // 2. Perform Update
    await this.rbacRepository.updateRolePermissions(roleId, permissionIds);

    // 3. Emit Audit Log
    await this.auditService.log({
      userId: adminUserId,
      action: AuditAction.UPDATE,
      entity: "RolePermission",
      entityId: roleId,
      newData: { role: targetRole.name, permissionIds },
    });
  }
}
