import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import bcrypt from "bcryptjs";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "../audit/audit.types";
import { AppError } from "../../common/errors/app.error";
import { revokeUserSessions } from "../../config/session";
import { CloudinaryProvider } from "../../lib/upload/cloudinary.provider";
import type {
  ChangePasswordInput,
  UpdateNotificationsInput,
  UpdateProfileInput,
} from "../../../../shared/validations/settings.schema";

/**
 * Settings Service — self-service profile/password/notifications/avatar.
 * Pindahan dari settings.actions + avatar.actions.
 */
@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const existingUser = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      throw new NotFoundException("User tidak ditemukan.");
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: input.name,
        phoneNumber: input.phoneNumber,
      },
    });

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE,
      entity: "User",
      entityId: userId,
      oldData: {
        name: existingUser.name,
        phoneNumber: existingUser.phoneNumber,
      },
      newData: {
        name: updatedUser.name,
        phoneNumber: updatedUser.phoneNumber,
      },
    });

    return { name: updatedUser.name, phoneNumber: updatedUser.phoneNumber };
  }

  /**
   * Ganti password — verifikasi password lama, lalu revoke semua session
   * LAIN milik user (session aktif dipertahankan via exceptSid).
   */
  async changePassword(userId: string, input: ChangePasswordInput, currentSid?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.password) {
      throw new NotFoundException("User atau password tidak ditemukan di sistem.");
    }

    const isPasswordValid = await bcrypt.compare(input.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new AppError(
        "INVALID_PASSWORD",
        "Password saat ini yang Anda masukkan salah.",
        400,
      );
    }

    const hashedNewPassword = await bcrypt.hash(input.newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    await revokeUserSessions(userId, currentSid);

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE,
      entity: "UserPassword",
      entityId: userId,
      newData: { action: "Password changed by user" },
    });

    return { changed: true };
  }

  async updateNotifications(userId: string, input: UpdateNotificationsInput) {
    const existingUser = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      throw new NotFoundException("User tidak ditemukan.");
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        emailNotifications: input.emailNotifications,
        waNotifications: input.waNotifications,
      },
    });

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE,
      entity: "UserNotifications",
      entityId: userId,
      oldData: {
        emailNotifications: existingUser.emailNotifications,
        waNotifications: existingUser.waNotifications,
      },
      newData: {
        emailNotifications: updatedUser.emailNotifications,
        waNotifications: updatedUser.waNotifications,
      },
    });

    return {
      emailNotifications: updatedUser.emailNotifications,
      waNotifications: updatedUser.waNotifications,
    };
  }

  /**
   * Update user's avatar (url + publicId hasil POST /api/upload),
   * lalu hapus avatar lama dari Cloudinary.
   */
  async updateAvatar(userId: string, url: string, publicId: string) {
    const existing = await this.prisma.user.findUnique({ where: { id: userId } });
    const oldPublicId = existing?.avatarPublicId;

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: url, avatarPublicId: publicId },
    });

    // Delete previous avatar after successful update
    if (oldPublicId && oldPublicId !== publicId) {
      try {
        const provider = new CloudinaryProvider();
        await provider.delete(oldPublicId);
        this.logger.log({ publicId: oldPublicId }, "Deleted old avatar file");
      } catch (e) {
        this.logger.error({ err: e }, "Failed to delete old avatar file");
      }
    }

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE,
      entity: "UserAvatar",
      entityId: userId,
      newData: { avatarUrl: updated.avatarUrl },
    });

    return { avatarUrl: updated.avatarUrl };
  }
}
