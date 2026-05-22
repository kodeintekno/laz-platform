import { usersRepository } from "@/features/users/repositories/users.repository";
import { auditService } from "@/features/audit/services/audit.service";
import { AuditAction } from "@/features/audit/types/audit.types";
import { userRepository } from "@/features/auth/repositories/user.repository";

/**
 * Users Service — Phase 3.
 *
 * Orchestrates user management business logic, enforces safety rules,
 * and emits audit logs.
 */
export const usersService = {
  /**
   * Fetch paginated users.
   */
  async getUsers(page: number, limit: number, search?: string) {
    return usersRepository.findMany(page, limit, search);
  },

  /**
   * Fetch available roles for assignment.
   */
  async getRoles() {
    return usersRepository.findRoles();
  },

  /**
   * Update a user's role with safety checks.
   */
  async changeRole(
    targetUserId: string,
    newRoleId: string,
    adminUserId: string
  ) {
    // 1. Fetch current user state
    const user = await userRepository.findById(targetUserId);
    if (!user) {
      throw new Error("User tidak ditemukan");
    }

    if (user.roleId === newRoleId) {
      return user; // No change needed
    }

    // 2. Safety Check: If user is SUPER_ADMIN, ensure they are not the last one
    if (user.role?.name === "SUPER_ADMIN") {
      const superAdminCount = await usersRepository.countSuperAdmins();
      if (superAdminCount <= 1) {
        throw new Error(
          "Tidak dapat mengubah role: Minimal harus ada 1 SUPER_ADMIN aktif."
        );
      }
    }

    // 3. Update Role
    const updatedUser = await usersRepository.updateRole(targetUserId, newRoleId);

    // 4. Emit Audit Log
    await auditService.log({
      userId: adminUserId,
      action: AuditAction.ROLE_CHANGE,
      entity: "User",
      entityId: targetUserId,
      oldData: { roleId: user.roleId, roleName: user.role?.name },
      newData: { roleId: updatedUser.roleId, roleName: updatedUser.role?.name },
    });

    return updatedUser;
  },
};
