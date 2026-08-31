import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import type { NotificationType, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

export interface CreateNotificationInput {
  type?: NotificationType;
  title: string;
  message: string;
  link?: string;
}

type Recipient = { userId: string; volunteerId?: never } | { volunteerId: string; userId?: never };

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async list(recipient: Recipient, limit = 20) {
    const where = this.recipientWhere(recipient);
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const [items, unreadCount] = await this.prisma.$transaction([
      this.prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, take: safeLimit }),
      this.prisma.notification.count({ where: { ...where, readAt: null } }),
    ]);
    return { items, unreadCount };
  }

  async markRead(id: string, recipient: Recipient) {
    const result = await this.prisma.notification.updateMany({
      where: { id, ...this.recipientWhere(recipient) },
      data: { readAt: new Date() },
    });
    if (!result.count) throw new NotFoundException("Notifikasi tidak ditemukan");
    return { id, read: true };
  }

  async markAllRead(recipient: Recipient) {
    const result = await this.prisma.notification.updateMany({
      where: { ...this.recipientWhere(recipient), readAt: null },
      data: { readAt: new Date() },
    });
    return { updatedCount: result.count };
  }

  async notifyUser(userId: string, input: CreateNotificationInput) {
    try {
      return await this.prisma.notification.create({ data: { userId, ...input } });
    } catch (error) {
      this.logger.error({ error, userId }, "Gagal membuat notifikasi pengguna");
      return null;
    }
  }

  async notifyVolunteer(volunteerId: string, input: CreateNotificationInput) {
    try {
      return await this.prisma.notification.create({ data: { volunteerId, ...input } });
    } catch (error) {
      this.logger.error({ error, volunteerId }, "Gagal membuat notifikasi relawan");
      return null;
    }
  }

  async notifyRole(roleName: "SUPER_ADMIN" | "LEMBAGA_ADMIN", input: CreateNotificationInput) {
    const users = await this.prisma.user.findMany({
      where: { role: { name: roleName }, status: "ACTIVE" },
      select: { id: true },
    });
    return this.createForUsers(users.map((user) => user.id), input);
  }

  async notifyLembaga(lembagaId: string, input: CreateNotificationInput, excludeUserId?: string) {
    const users = await this.prisma.user.findMany({
      where: { lembagaId, status: "ACTIVE", ...(excludeUserId ? { id: { not: excludeUserId } } : {}) },
      select: { id: true },
    });
    return this.createForUsers(users.map((user) => user.id), input);
  }

  private async createForUsers(userIds: string[], input: CreateNotificationInput) {
    if (!userIds.length) return Promise.resolve({ count: 0 });
    try {
      return await this.prisma.notification.createMany({
        data: userIds.map((userId) => ({ userId, ...input })),
      });
    } catch (error) {
      this.logger.error({ error, recipientCount: userIds.length }, "Gagal membuat notifikasi massal");
      return { count: 0 };
    }
  }

  private recipientWhere(recipient: Recipient): Prisma.NotificationWhereInput {
    return "userId" in recipient
      ? { userId: recipient.userId, volunteerId: null }
      : { volunteerId: recipient.volunteerId, userId: null };
  }
}
