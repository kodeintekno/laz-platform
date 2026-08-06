import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { Prisma } from "@prisma/client";

@Injectable()
export class ProgramsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetch all programs for the admin dashboard (paginated).
   */
  async findMany(page = 1, limit = 10, search?: string, lembagaId?: string, status?: string) {
    const skip = (page - 1) * limit;

    const where: Prisma.ProgramWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (lembagaId) {
      where.lembagaId = lembagaId;
    }

    if (status) {
      where.status = status as any;
    }

    const [items, total] = await Promise.all([
      this.prisma.program.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: { select: { name: true } },
          lembaga: { select: { name: true, slug: true } },
        },
      }),
      this.prisma.program.count({ where }),
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

  /**
   * Fetch published programs for the public marketplace feed — search,
   * filter by category/lembaga, sort, and paginate.
   */
  async findPublished(options?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    lembagaId?: string;
    lembagaSlug?: string;
    sort?: "newest" | "most-funded" | "ending-soon";
  }) {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 12;
    const skip = (page - 1) * limit;

    const where: Prisma.ProgramWhereInput = { status: "PUBLISHED" };
    if (options?.search) {
      where.OR = [
        { title: { contains: options.search, mode: "insensitive" } },
        { description: { contains: options.search, mode: "insensitive" } },
      ];
    }
    if (options?.category) {
      where.category = options.category as any;
    }
    if (options?.lembagaId) {
      where.lembagaId = options.lembagaId;
    }
    if (options?.lembagaSlug) {
      where.lembaga = { slug: options.lembagaSlug };
    }

    const orderBy: Prisma.ProgramOrderByWithRelationInput =
      options?.sort === "most-funded"
        ? { currentAmount: "desc" }
        : options?.sort === "ending-soon"
          ? { endDate: "asc" }
          : { createdAt: "desc" };

    const [items, total] = await Promise.all([
      this.prisma.program.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          lembaga: {
            select: { name: true, slug: true, logoUrl: true },
          },
        },
      }),
      this.prisma.program.count({ where }),
    ]);

    return {
      items,
      metadata: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  /**
   * Find a specific program by its id.
   */
  async findById(id: string) {
    return this.prisma.program.findUnique({ where: { id } });
  }

  /**
   * Published programs curated by SUPER_ADMIN to appear on the homepage.
   */
  async findFeatured(limit: number) {
    return this.prisma.program.findMany({
      where: { status: "PUBLISHED", isFeatured: true },
      orderBy: { updatedAt: "desc" },
      take: limit,
      include: {
        lembaga: { select: { name: true, slug: true, logoUrl: true } },
      },
    });
  }

  /** Count currently featured programs, optionally excluding one program (for re-toggling itself). */
  async countFeatured(excludeId?: string) {
    return this.prisma.program.count({
      where: { isFeatured: true, ...(excludeId ? { id: { not: excludeId } } : {}) },
    });
  }

  /** Mark/unmark a program as featured on the homepage. */
  async setFeatured(id: string, isFeatured: boolean) {
    return this.prisma.program.update({
      where: { id },
      data: { isFeatured },
    });
  }

  /**
   * Find a specific program by its slug.
   */
  async getProgramBySlug(slug: string) {
    return this.prisma.program.findFirst({
      where: { slug },
      include: {
        lembaga: {
          select: { name: true, slug: true, logoUrl: true },
        },
        createdBy: { select: { name: true, avatarUrl: true } },
        donations: {
          where: { status: "PAID" },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        distributions: {
          where: { status: "COMPLETED" },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            donations: { where: { status: "PAID" } },
          },
        },
      },
    });
  }

  /**
   * Create a new program.
   */
  async create(data: Prisma.ProgramUncheckedCreateInput) {
    return this.prisma.program.create({ data });
  }

  /**
   * Update an existing program.
   */
  async update(id: string, data: Prisma.ProgramUncheckedUpdateInput) {
    return this.prisma.program.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a program.
   */
  async delete(id: string) {
    return this.prisma.program.delete({
      where: { id },
    });
  }

  /**
   * Approve a program pending review — publishes it.
   */
  async approve(id: string, approvedById: string) {
    return this.prisma.program.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        approvedAt: new Date(),
        approvedById,
        rejectionReason: null,
      },
    });
  }

  /**
   * Reject a program pending review.
   */
  async reject(id: string, reason: string, approvedById: string) {
    return this.prisma.program.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectionReason: reason,
        approvedById,
        approvedAt: null,
      },
    });
  }
}
