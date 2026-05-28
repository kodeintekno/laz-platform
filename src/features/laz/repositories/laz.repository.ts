import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { CloudinaryProvider } from "@/lib/upload/cloudinaryProvider";

export const lazRepository = {
  /**
   * Find all LAZ organizations with pagination and search.
   */
  async findMany(page: number = 1, pageSize: number = 10, search?: string) {
    const skip = (page - 1) * pageSize;
    const where: Prisma.LazWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.laz.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.laz.count({ where }),
    ]);

    return {
      items,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
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
    // Fetch existing record to manage previous logo cleanup
    const existing = await prisma.laz.findUnique({ where: { id } });
    if (existing?.logoPublicId && data.logoPublicId && data.logoPublicId !== existing.logoPublicId) {
      // Delete old logo file directly via Cloudinary server-side SDK
      try {
        const provider = new CloudinaryProvider();
        await provider.delete(existing.logoPublicId);
      } catch (e) {
        console.error("Failed to delete old logo from Cloudinary:", e);
      }
    }
    return prisma.laz.update({
      where: { id },
      data,
    });
  },

  /**
   * Delete a LAZ organization by id.
   */
  async delete(id: string) {
    // Retrieve record to delete associated logo file
    const existing = await prisma.laz.findUnique({ where: { id } });
    if (existing?.logoPublicId) {
      try {
        const provider = new CloudinaryProvider();
        await provider.delete(existing.logoPublicId);
      } catch (e) {
        console.error("Failed to delete logo on record removal from Cloudinary:", e);
      }
    }
    return prisma.laz.delete({
      where: { id },
    });
  },
};
