import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { Prisma } from "@prisma/client";
import { CloudinaryProvider } from "../../lib/upload/cloudinary.provider";

@Injectable()
export class LazRepository {
  private readonly logger = new Logger(LazRepository.name);

  constructor(private readonly prisma: PrismaService) {}

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
      this.prisma.laz.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      this.prisma.laz.count({ where }),
    ]);

    return {
      items,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }

  async findById(id: string) {
    return this.prisma.laz.findUnique({
      where: { id },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.laz.findUnique({
      where: { slug },
    });
  }

  async create(data: Prisma.LazCreateInput) {
    return this.prisma.laz.create({
      data,
    });
  }

  /**
   * Update an existing LAZ organization's details.
   */
  async update(id: string, data: Prisma.LazUpdateInput) {
    // Fetch existing record to manage previous logo cleanup
    const existing = await this.prisma.laz.findUnique({ where: { id } });
    if (
      existing?.logoPublicId &&
      data.logoPublicId &&
      data.logoPublicId !== existing.logoPublicId
    ) {
      // Delete old logo file directly via Cloudinary server-side SDK
      try {
        const provider = new CloudinaryProvider();
        await provider.delete(existing.logoPublicId);
      } catch (e) {
        this.logger.error(
          { err: e, id, oldLogoPublicId: existing.logoPublicId },
          "Failed to delete old logo from Cloudinary",
        );
      }
    }
    return this.prisma.laz.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a LAZ organization by id.
   */
  async delete(id: string) {
    // Retrieve record to delete associated logo file
    const existing = await this.prisma.laz.findUnique({ where: { id } });
    if (existing?.logoPublicId) {
      try {
        const provider = new CloudinaryProvider();
        await provider.delete(existing.logoPublicId);
      } catch (e) {
        this.logger.error(
          { err: e, id, logoPublicId: existing.logoPublicId },
          "Failed to delete logo on record removal from Cloudinary",
        );
      }
    }
    return this.prisma.laz.delete({
      where: { id },
    });
  }

  /** Active LAZ list (untuk dropdown). */
  async findActive() {
    return this.prisma.laz.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
    });
  }
}
