import { Injectable, Logger } from "@nestjs/common";
import bcrypt from "bcryptjs";
import { UserRepository } from "./user.repository";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "../audit/audit.types";
import { PrismaService } from "../../prisma/prisma.service";
import { AppError } from "../../common/errors/app.error";
import type {
  LoginInput,
  RegisterInput,
} from "../../../../shared/validations/auth.schema";
import type { RBACSessionUser } from "../../../../shared/types/rbac";
import type { PermissionKey } from "../../../../shared/constants/permissions";

/**
 * Auth Service — pindahan dari src/features/auth dengan penyesuaian:
 * - signIn mengembalikan null untuk kredensial salah (controller memetakan
 *   ke pesan seragam "Email atau password salah").
 * - getUserById dipakai AuthGuard tiap request (permissions fresh dari DB).
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Verify credentials and return the session-user shape.
   */
  async signIn(credentials: LoginInput): Promise<RBACSessionUser | null> {
    const user = await this.userRepository.findByEmail(credentials.email);

    if (!user || !user.password) {
      return null; // Don't leak if user exists or not
    }

    if (user.status !== "ACTIVE") {
      throw new AppError("ACCOUNT_INACTIVE", "Akun ini tidak aktif", 403);
    }

    const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    const permissions =
      user.role?.rolePermissions.map((rp) => rp.permission.key as PermissionKey) ?? [];

    // Update last login (fire and forget)
    this.userRepository
      .updateLastLogin(user.id)
      .catch((err) => this.logger.error({ err }, "Failed to update last login timestamp"));

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roleId: user.roleId ?? undefined,
      roleName: (user.role?.name as RBACSessionUser["roleName"]) ?? undefined,
      permissions,
      lazId: user.lazId,
      avatarUrl: user.avatarUrl,
      avatarPublicId: user.avatarPublicId,
    };
  }

  /**
   * Register a new public user (DONATUR).
   */
  async register(data: RegisterInput): Promise<void> {
    // 1. Check if email exists
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw new AppError("EMAIL_TAKEN", "Email sudah terdaftar", 409);
    }

    // 2. Get DONATUR role id
    const donaturRole = await this.userRepository.findRoleByName("DONATUR");
    if (!donaturRole) {
      throw new AppError(
        "MISSING_ROLE",
        "Role konfigurasi sistem tidak ditemukan (DONATUR)",
        500,
      );
    }

    // 2.5 Get default LAZ tenant
    const defaultLaz = await this.prisma.laz.findFirst();
    if (!defaultLaz) {
      throw new AppError("MISSING_LAZ", "Sistem belum memiliki data LAZ aktif", 500);
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // 4. Create user
    const newUser = await this.userRepository.create({
      email: data.email,
      name: data.name,
      password: hashedPassword,
      roleId: donaturRole.id,
      status: "ACTIVE",
      lazId: defaultLaz.id,
    });

    // 5. Write audit log
    await this.auditService.log({
      userId: null,
      action: AuditAction.CREATE,
      entity: "User",
      entityId: newUser.id,
      newData: { email: newUser.email, role: "DONATUR" },
    });
  }

  /**
   * Session-user shape untuk AuthGuard & GET /api/auth/me.
   */
  async getUserById(id: string): Promise<RBACSessionUser | null> {
    const user = await this.userRepository.findById(id);
    if (!user || user.status !== "ACTIVE") {
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
      avatarUrl: user.avatarUrl,
      avatarPublicId: user.avatarPublicId,
    };
  }
}
