import bcrypt from "bcryptjs";
import { userRepository } from "@/features/auth/repositories/user.repository";
import { auditService } from "@/features/audit/services/audit.service";
import { AuditAction } from "@/features/audit/types/audit.types";
import type { LoginInput, RegisterInput } from "@/features/auth/validations/auth.schema";
import { prisma } from "@/lib/prisma";
import type { RBACSessionUser, PermissionKey } from "@/types";
import { logger } from "@/lib/logger";

/**
 * Auth Service — Phase 2.
 *
 * Orchestrates authentication logic, integrates with UserRepository,
 * and emits Audit logs.
 */
export const authService = {
  /**
   * Verify credentials and return user object shaped for NextAuth session.
   */
  async signIn(credentials: LoginInput): Promise<RBACSessionUser | null> {
    const user = await userRepository.findByEmail(credentials.email);

    if (!user || !user.password) {
      return null; // Don't leak if user exists or not
    }

    if (user.status !== "ACTIVE") {
      throw new Error("Akun ini tidak aktif");
    }

    const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    // Map permissions flat array
    const permissions =
      user.role?.rolePermissions.map((rp) => rp.permission.key as PermissionKey) ?? [];

    // Update last login (fire and forget)
    userRepository.updateLastLogin(user.id).catch((err) => logger.error({ err }, "Failed to update last login timestamp"));

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roleId: user.roleId ?? undefined,
      roleName: (user.role?.name as RBACSessionUser["roleName"]) ?? undefined,
      permissions,
      lazId: user.lazId,
    };
  },

  /**
   * Register a new public user (DONATUR).
   */
  async register(data: RegisterInput): Promise<void> {
    // 1. Check if email exists
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw new Error("Email sudah terdaftar");
    }

    // 2. Get DONATUR role id
    const donaturRole = await userRepository.findRoleByName("DONATUR");
    if (!donaturRole) {
      throw new Error("Role konfigurasi sistem tidak ditemukan (DONATUR)");
    }

    // 2.5 Get default LAZ tenant
    const defaultLaz = await prisma.laz.findFirst();
    if (!defaultLaz) {
      throw new Error("Sistem belum memiliki data LAZ aktif");
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // 4. Create user
    const newUser = await userRepository.create({
      email: data.email,
      name: data.name,
      password: hashedPassword,
      roleId: donaturRole.id,
      status: "ACTIVE",
      lazId: defaultLaz.id,
    });

    // 5. Write audit log
    await auditService.log({
      userId: null,
      action: AuditAction.CREATE,
      entity: "User",
      entityId: newUser.id,
      newData: { email: newUser.email, role: "DONATUR" },
    });
  },
  async getUserById(id: string) {
    const user = await userRepository.findById(id);
    if (!user) {
      return null;
    }
    const permissions =
      user.role?.rolePermissions.map((rp) => rp.permission.key as PermissionKey) ?? [];
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roleId: user.roleId ?? undefined,
      roleName: (user.role?.name as RBACSessionUser["roleName"]) ?? undefined,
      permissions,
      lazId: user.lazId,
      avatarUrl: (user as any).avatarUrl,
      avatarPublicId: (user as any).avatarPublicId,
    };
  },

}
