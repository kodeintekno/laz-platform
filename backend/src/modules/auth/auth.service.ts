import { Injectable, Logger } from "@nestjs/common";
import bcrypt from "bcryptjs";
import { UserRepository } from "./user.repository";
import { AppError } from "../../common/errors/app.error";
import type { LoginInput } from "../../../../shared/validations/auth.schema";
import type { RBACSessionUser } from "../../../../shared/types/rbac";
import type { PermissionKey } from "../../../../shared/constants/permissions";

/**
 * Auth Service — pindahan dari src/features/auth dengan penyesuaian:
 * - signIn mengembalikan null untuk kredensial salah (controller memetakan
 *   ke pesan seragam "Email atau password salah").
 * - getUserById dipakai AuthGuard tiap request (permissions fresh dari DB).
 * - Donatur tidak lagi memiliki akun — tidak ada register() publik di sini;
 *   lembaga mendaftar lewat LembagaService.registerLembaga(), relawan lewat
 *   VolunteersService (principal terpisah, lihat modules/volunteers).
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Verify credentials and return the session-user shape.
   * Melempar error spesifik jika akun LEMBAGA_ADMIN milik lembaga yang
   * belum/tidak disetujui — agar frontend bisa menampilkan pesan yang jelas.
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

    if (user.role?.name === "LEMBAGA_ADMIN" && user.lembaga) {
      if (user.lembaga.status === "PENDING") {
        throw new AppError(
          "LEMBAGA_PENDING",
          "Pendaftaran lembaga Anda masih menunggu persetujuan Super Admin",
          403,
        );
      }
      if (user.lembaga.status === "REJECTED") {
        throw new AppError(
          "LEMBAGA_REJECTED",
          user.lembaga.rejectionReason
            ? `Pendaftaran lembaga Anda ditolak: ${user.lembaga.rejectionReason}`
            : "Pendaftaran lembaga Anda ditolak",
          403,
        );
      }
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
      lembagaId: user.lembagaId,
      avatarUrl: user.avatarUrl,
      avatarPublicId: user.avatarPublicId,
      phoneNumber: user.phoneNumber,
      emailNotifications: user.emailNotifications,
      waNotifications: user.waNotifications,
    };
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
      lembagaId: user.lembagaId,
      avatarUrl: user.avatarUrl,
      avatarPublicId: user.avatarPublicId,
      phoneNumber: user.phoneNumber,
      emailNotifications: user.emailNotifications,
      waNotifications: user.waNotifications,
    };
  }
}
