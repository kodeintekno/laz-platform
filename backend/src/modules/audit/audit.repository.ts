import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { CreateAuditLogInput } from "./audit.types";

/**
 * Audit Repository.
 *
 * RULES:
 * - Audit logs are IMMUTABLE. Only `create` is allowed here.
 * - Never expose update or delete methods.
 * - This repository is the ONLY place that writes to `audit_logs`.
 */
@Injectable()
export class AuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create an immutable audit log entry.
   */
  async create(input: CreateAuditLogInput) {
    let lembagaId = input.lembagaId;
    if (!lembagaId && input.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: input.userId },
        select: { lembagaId: true },
      });
      if (user) {
        lembagaId = user.lembagaId ?? undefined;
      }
    }

    return this.prisma.auditLog.create({
      data: {
        userId: input.userId,
        lembagaId: lembagaId || undefined,
        action: input.action as never, // Prisma enum cast
        entity: input.entity,
        entityId: input.entityId,
        oldData: input.oldData ? (input.oldData as any) : undefined,
        newData: input.newData ? (input.newData as any) : undefined,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  }

  /**
   * Find paged and searchable audit logs.
   */
  async getAuditLogs(
    page: number = 1,
    limit: number = 10,
    search?: string,
    lembagaId?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (lembagaId) {
      where.lembagaId = lembagaId;
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
        "ROLE_CHANGE", "PAYMENT_UPDATE", "DISTRIBUTION_UPDATE",
        "LEMBAGA_APPROVE", "LEMBAGA_REJECT", "VOLUNTEER_APPLICATION_REVIEW",
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
      this.prisma.auditLog.findMany({
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
      this.prisma.auditLog.count({ where }),
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
  }
}
