import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { CreateAuditLogInput } from "./audit.types";

/**
 * Audit Repository.
 *
 * RULES:
 * - Audit logs are IMMUTABLE. Only `create` is allowed here.
 * - Never expose update or delete methods.
 * - Domain triggers also write atomic financial/data-change events.
 */
@Injectable()
export class AuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create an immutable audit log entry.
   */
  async create(input: CreateAuditLogInput) {
    const lembagaId = input.lembagaId;

    return this.prisma.auditLog.create({
      data: {
        userId: input.userId,
        status: input.status,
        errorMessage: input.errorMessage,
        transactionData: input.transactionData as any,
        correlationId: input.correlationId,
        lembagaId: lembagaId || undefined,
        action: input.action,
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
    filters: Record<string, string> = {},
  ) {
    page = Math.max(1, (Number.isFinite(page) ? Math.floor(page) : 1) || 1);
    limit = Math.min(100, Math.max(1, (Number.isFinite(limit) ? Math.floor(limit) : 10) || 10));
    const skip = (page - 1) * limit;

    const where: any = {};
    for (const key of ["userId", "actorRole", "action", "module", "entityId", "status", "ipAddress", "requestId", "correlationId"]) {
      if (filters[key]) where[key] = filters[key];
    }
    if (lembagaId) {
      where.lembagaId = lembagaId;
    }
    if (startDate && !Number.isNaN(Date.parse(startDate))) {
      where.createdAt = { gte: new Date(startDate) };
    }
    if (endDate && !Number.isNaN(Date.parse(endDate))) {
      where.createdAt = { ...(where.createdAt || {}), lte: new Date(endDate.length === 10 ? `${endDate}T23:59:59.999Z` : endDate) };
    }
    if (search) {
      where.OR = [
        { action: { contains: search, mode: "insensitive" } },
        { actorName: { contains: search, mode: "insensitive" } },
        { actorEmail: { contains: search, mode: "insensitive" } },
        { entity: { contains: search, mode: "insensitive" } },
        { entityId: { contains: search, mode: "insensitive" } },
      ];


    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items: items.map((item) => ({ ...item, before: item.oldData, after: item.newData, user: item.actorName || item.actorEmail ? { name: item.actorName, email: item.actorEmail } : null })),
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
