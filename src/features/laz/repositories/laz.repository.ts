import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const lazRepository = {
  /**
   * Find all LAZ organizations.
   */
  async findMany() {
    return prisma.laz.findMany({
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Find a LAZ by its unique ID.
   */
  async findById(id: string) {
    return prisma.laz.findUnique({
      where: { id },
    });
  },

  /**
   * Find a LAZ by its unique slug.
   */
  async findBySlug(slug: string) {
    return prisma.laz.findUnique({
      where: { slug },
    });
  },

  /**
   * Create a new LAZ organization.
   */
  async create(data: Prisma.LazCreateInput) {
    return prisma.laz.create({
      data,
    });
  },

  /**
   * Update an existing LAZ organization's details.
   */
  async update(id: string, data: Prisma.LazUpdateInput) {
    return prisma.laz.update({
      where: { id },
      data,
    });
  },
};
