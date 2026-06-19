import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import bcrypt from "bcryptjs";
import { UsersRepository } from "./users.repository";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "../audit/audit.types";
import { AppError } from "../../common/errors/app.error";
import { revokeUserSessions } from "../../config/session";
import type {
  CreateUserInput,
  UpdateUserInput,
} from "../../../../shared/validations/users.schema";

/**
 * Users Service — orchestrates user management business logic,
 * enforces safety rules, and emits audit logs.
 */
@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly auditService: AuditService,
  ) {}

  async getUsers(page: number, limit: number, search?: string, lazId?: string) {
    return this.usersRepository.findMany(page, limit, search, lazId);
  }

  async getRoles() {
    return this.usersRepository.findRoles();
  }

  async getUserById(id: string) {
    return this.usersRepository.findById(id);
  }

  async getAllLazs() {
    return this.usersRepository.findAllLazs();
  }

  /**
   * Create a new user with safety and unique constraints validation.
   */
  async createUser(
    input: CreateUserInput,
    adminId: string,
    adminLazId?: string,
    isSuperAdmin?: boolean,
  ) {
    // 1. Check if email is unique
    const existing = await this.usersRepository.findByEmail(input.email);
    if (existing) {
      throw new AppError("EMAIL_TAKEN", "Email ini sudah digunakan oleh pengguna lain.", 409);
    }

    // 2. Resolve target tenant scoping
    const targetLazId = isSuperAdmin ? input.lazId : (adminLazId || input.lazId);
    if (!targetLazId) {
      throw new AppError("LAZ_REQUIRED", "LAZ tujuan harus ditentukan.", 422);
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(input.password, 12);

    // 4. Create User
    const user = await this.usersRepository.create({
      name: input.name,
      email: input.email,
      password: hashedPassword,
      roleId: input.roleId,
      lazId: targetLazId,
      status: input.status,
    });

    // 5. Emit Audit Log
    await this.auditService.log({
      userId: adminId,
      action: AuditAction.CREATE,
      entity: "User",
      entityId: user.id,
      newData: {
        name: user.name,
        email: user.email,
        roleId: user.roleId,
        lazId: user.lazId,
        status: user.status,
      },
    });

    return user;
  }

  /**
   * Update an existing user with safety checks.
   */
  async updateUser(
    id: string,
    input: UpdateUserInput,
    adminId: string,
    adminLazId?: string,
    isSuperAdmin?: boolean,
  ) {
    // 1. Fetch current user state
    const existingUser = await this.usersRepository.findById(id);
    if (!existingUser) {
      throw new NotFoundException("User tidak ditemukan");
    }

    // 2. Safety Check: Scoped to same tenant if not Super Admin
    if (!isSuperAdmin && existingUser.lazId !== adminLazId) {
      throw new ForbiddenException(
        "Akses ditolak: Anda tidak dapat mengubah data pengguna dari lembaga amil zakat lain.",
      );
    }

    // 3. Safety Check: If email changes, verify uniqueness
    if (input.email !== existingUser.email) {
      const emailCheck = await this.usersRepository.findByEmail(input.email);
      if (emailCheck) {
        throw new AppError("EMAIL_TAKEN", "Email ini sudah digunakan oleh pengguna lain.", 409);
      }
    }

    // 4. Safety Check: If user is SUPER_ADMIN, prevent self-demotion or deactivation if last
    const isTargetSuperAdmin = existingUser.role?.name === "SUPER_ADMIN";
    const changingRole = input.roleId !== existingUser.roleId;
    const deactivating = input.status !== "ACTIVE" && existingUser.status === "ACTIVE";

    if (isTargetSuperAdmin && (changingRole || deactivating)) {
      const superAdminCount = await this.usersRepository.countSuperAdmins();
      if (superAdminCount <= 1) {
        throw new AppError(
          "LAST_SUPER_ADMIN",
          "Tidak dapat mengubah role/status: Minimal harus ada 1 SUPER_ADMIN aktif tersisa di sistem.",
          409,
        );
      }
    }

    // 5. Prepare update payload
    const updateData: any = {
      name: input.name,
      email: input.email,
      roleId: input.roleId,
      status: input.status,
    };

    if (isSuperAdmin) {
      updateData.lazId = input.lazId;
    }

    if (input.password && input.password.trim() !== "") {
      updateData.password = await bcrypt.hash(input.password, 12);
    }

    // 6. Execute update
    const updatedUser = await this.usersRepository.update(id, updateData);

    // 6.5 Revoke sessions when access-relevant fields change
    if (changingRole || deactivating || updateData.password) {
      await revokeUserSessions(id);
    }

    // 7. Emit Audit Log
    await this.auditService.log({
      userId: adminId,
      action: AuditAction.UPDATE,
      entity: "User",
      entityId: id,
      oldData: {
        name: existingUser.name,
        email: existingUser.email,
        roleId: existingUser.roleId,
        lazId: existingUser.lazId,
        status: existingUser.status,
      },
      newData: {
        name: updatedUser.name,
        email: updatedUser.email,
        roleId: updatedUser.roleId,
        lazId: updatedUser.lazId,
        status: updatedUser.status,
      },
    });

    return updatedUser;
  }

  /**
   * Delete a user with safety checks.
   */
  async deleteUser(id: string, adminId: string, adminLazId?: string, isSuperAdmin?: boolean) {
    // 1. Fetch current user state
    const existingUser = await this.usersRepository.findById(id);
    if (!existingUser) {
      throw new NotFoundException("User tidak ditemukan");
    }

    // 2. Safety Check: Scoped to same tenant if not Super Admin
    if (!isSuperAdmin && existingUser.lazId !== adminLazId) {
      throw new ForbiddenException(
        "Akses ditolak: Anda tidak dapat menghapus pengguna dari lembaga amil zakat lain.",
      );
    }

    // 3. Safety Check: Cannot delete yourself
    if (id === adminId) {
      throw new ForbiddenException(
        "Akses ditolak: Anda tidak dapat menghapus akun Anda sendiri.",
      );
    }

    // 4. Safety Check: Prevent deleting the last active SUPER_ADMIN
    if (existingUser.role?.name === "SUPER_ADMIN") {
      const superAdminCount = await this.usersRepository.countSuperAdmins();
      if (superAdminCount <= 1) {
        throw new AppError(
          "LAST_SUPER_ADMIN",
          "Tidak dapat menghapus: Minimal harus ada 1 SUPER_ADMIN aktif tersisa di sistem.",
          409,
        );
      }
    }

    // 5. Delete User (+ revoke seluruh session-nya)
    const deletedUser = await this.usersRepository.delete(id);
    await revokeUserSessions(id);

    // 6. Emit Audit Log
    await this.auditService.log({
      userId: adminId,
      action: AuditAction.DELETE,
      entity: "User",
      entityId: id,
      oldData: {
        name: deletedUser.name,
        email: deletedUser.email,
        roleId: deletedUser.roleId,
        lazId: deletedUser.lazId,
        status: deletedUser.status,
      },
    });

    return deletedUser;
  }

  /**
   * Update a user's role (legacy compatibility).
   */
  async changeRole(targetUserId: string, newRoleId: string, adminUserId: string) {
    const user = await this.usersRepository.findById(targetUserId);
    if (!user) {
      throw new NotFoundException("User tidak ditemukan");
    }

    if (user.roleId === newRoleId) {
      return user;
    }

    if (user.role?.name === "SUPER_ADMIN") {
      const superAdminCount = await this.usersRepository.countSuperAdmins();
      if (superAdminCount <= 1) {
        throw new AppError(
          "LAST_SUPER_ADMIN",
          "Tidak dapat mengubah role: Minimal harus ada 1 SUPER_ADMIN aktif.",
          409,
        );
      }
    }

    const updatedUser = await this.usersRepository.updateRole(targetUserId, newRoleId);

    // Role berubah → permissions berubah → revoke semua session user target
    await revokeUserSessions(targetUserId);

    await this.auditService.log({
      userId: adminUserId,
      action: AuditAction.ROLE_CHANGE,
      entity: "User",
      entityId: targetUserId,
      oldData: { roleId: user.roleId, roleName: user.role?.name },
      newData: { roleId: updatedUser.roleId, roleName: updatedUser.role?.name },
    });

    return updatedUser;
  }
}
