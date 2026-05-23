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
  async create(input: CreateAuditLogInput) {
    return prisma.auditLog.create({
      data: {
        userId: input.userId,
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
  async findByEntity(entity: string, entityId: string) {
    return prisma.auditLog.findMany({
      where: { entity, entityId },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Find audit logs by user — read-only.
   */
  async findByUser(userId: string, limit = 50) {
    return prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  /**
   * Find paged and searchable audit logs.
   */
  async getAuditLogs(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};
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

