import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const programsRepository = {
  /**
   * Fetch all programs for the admin dashboard (paginated).
   */
  async findMany(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;

    const where: Prisma.ProgramWhereInput = search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.program.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: { select: { name: true } },
        },
      }),
      prisma.program.count({ where }),
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

  /**
   * Fetch published programs for the public feed.
   */
  async findPublished() {
    return prisma.program.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Find a specific program by its slug.
   */
  async getProgramBySlug(slug: string) {
    return prisma.program.findFirst({
      where: { slug },
      include: {
        createdBy: { select: { name: true, avatarUrl: true } },
        donations: {
          where: { status: "PAID" },
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            user: { select: { name: true, avatarUrl: true } },
          },
        },
        distributions: {
          where: { status: "COMPLETED" },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  },

  /**
   * Create a new program.
   */
  async create(data: Prisma.ProgramUncheckedCreateInput) {
    return prisma.program.create({ data });
  },

  /**
   * Update an existing program.
   */
  async update(id: string, data: Prisma.ProgramUncheckedUpdateInput) {
    return prisma.program.update({
      where: { id },
      data,
    });
  },
};
