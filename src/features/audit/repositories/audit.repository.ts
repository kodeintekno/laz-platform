import { prisma } from "@/lib/prisma";
import type { CreateAuditLogInput } from "@/features/audit/types/audit.types";

/**
 * Audit Repository — Phase 2.
 *
 * RULES:
 * - Audit logs are IMMUTABLE. Only `create` is allowed here.
 * - Never expose update or delete methods.
 * - This repository is the ONLY place that writes to `audit_logs`.
 */
export const auditRepository = {
  /**
   * Create an immutable audit log entry.
   */
  async create(input: CreateAuditLogInput & { lazId?: string }) {
    let lazId = input.lazId;
    if (!lazId && input.userId) {
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        select: { lazId: true },
      });
      if (user) {
        lazId = user.lazId;
      }
    }

    return prisma.auditLog.create({
      data: {
        userId: input.userId,
        lazId: lazId || undefined,
        action: input.action as never, // Prisma enum cast
        entity: input.entity,
        entityId: input.entityId,
        oldData: input.oldData ? (input.oldData as any) : undefined,
        newData: input.newData ? (input.newData as any) : undefined,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  },

  /**
   * Find audit logs for a specific entity — read-only.
   */
  async findByEntity(entity: string, entityId: string, lazId?: string) {
    return prisma.auditLog.findMany({
      where: { entity, entityId, lazId },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Find audit logs by user — read-only.
   */
  async findByUser(userId: string, limit = 50, lazId?: string) {
    return prisma.auditLog.findMany({
      where: { userId, lazId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  /**
   * Find paged and searchable audit logs.
   */
  async getAuditLogs(page: number = 1, limit: number = 10, search?: string, lazId?: string, startDate?: string, endDate?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (lazId) {
      where.lazId = lazId;
    }
    if (startDate) {
      where.createdAt = { gte: new Date(startDate) };
    }
    if (endDate) {
      where.createdAt = { ...(where.createdAt || {}), lte: new Date(endDate) };
    }
    if (search) {
      const isActionEnum = [
        "LOGIN", "LOGOUT", "CREATE", "UPDATE", "DELETE",
        "ROLE_CHANGE", "PAYMENT_UPDATE", "DISTRIBUTION_UPDATE"
      ].includes(search.toUpperCase());

      where.OR = [
        { entity: { contains: search, mode: "insensitive" } },
        { entityId: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];

      if (isActionEnum) {
        where.OR.push({ action: { equals: search.toUpperCase() as any } });
      }
    }

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
};

