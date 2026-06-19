import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ProgramsRepository } from "./programs.repository";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "../audit/audit.types";
import { PrismaService } from "../../prisma/prisma.service";
import { CloudinaryProvider } from "../../lib/upload/cloudinary.provider";
import type { ProgramInput } from "../../../../shared/validations/programs.schema";

/**
 * Generate a unique slug from a title.
 */
function generateSlug(title: string): string {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${baseSlug}-${randomSuffix}`;
}

@Injectable()
export class ProgramsService {
  private readonly logger = new Logger(ProgramsService.name);

  constructor(
    private readonly programsRepository: ProgramsRepository,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  async getDashboardPrograms(page: number, limit: number, search?: string, lazId?: string) {
    return this.programsRepository.findMany(page, limit, search, lazId);
  }

  async getPublishedPrograms() {
    return this.programsRepository.findPublished();
  }

  async getProgramBySlug(slug: string) {
    return this.programsRepository.getProgramBySlug(slug);
  }

  async createProgram(data: ProgramInput, adminId: string) {
    const slug = generateSlug(data.title);

    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
      select: { lazId: true },
    });

    if (!admin) {
      throw new NotFoundException("Admin tidak ditemukan");
    }

    const newProgram = await this.programsRepository.create({
      title: data.title,
      slug,
      description: data.description,
      targetAmount: data.targetAmount,
      category: data.category,
      status: data.status,
      imageUrl: data.image || null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      createdById: adminId,
      lazId: admin.lazId,
    });

    await this.auditService.log({
      userId: adminId,
      action: AuditAction.CREATE,
      entity: "Program",
      entityId: newProgram.id,
      newData: newProgram as any,
    });

    return newProgram;
  }

  async updateProgram(id: string, data: ProgramInput, adminId: string) {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
      select: { lazId: true },
    });

    if (!admin) {
      throw new NotFoundException("Admin tidak ditemukan");
    }

    const oldProgram = await this.prisma.program.findUnique({
      where: { id },
      select: { imageUrl: true },
    });

    const updatedProgram = await this.programsRepository.update(id, {
      title: data.title,
      description: data.description,
      targetAmount: data.targetAmount,
      category: data.category,
      status: data.status,
      imageUrl: data.image || null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
    });

    // If the image was changed or removed, delete the old image from Cloudinary
    const newImageUrl = data.image || null;
    if (oldProgram?.imageUrl && oldProgram.imageUrl !== newImageUrl) {
      const match = oldProgram.imageUrl.match(/\/upload\/(?:v\d+\/)?([^\.]+)/);
      const oldPublicId = match ? match[1] : null;
      if (oldPublicId) {
        try {
          const provider = new CloudinaryProvider();
          await provider.delete(oldPublicId);
        } catch (e) {
          this.logger.error({ err: e }, "Gagal menghapus gambar lama program");
        }
      }
    }

    await this.auditService.log({
      userId: adminId,
      action: AuditAction.UPDATE,
      entity: "Program",
      entityId: updatedProgram.id,
      newData: updatedProgram as any,
    });

    return updatedProgram;
  }

  async deleteProgram(id: string, adminId: string) {
    // Delete the program
    const deletedProgram = await this.programsRepository.delete(id);

    // Log the deletion
    await this.auditService.log({
      userId: adminId,
      action: AuditAction.DELETE,
      entity: "Program",
      entityId: id,
      oldData: deletedProgram as any,
    });

    return deletedProgram;
  }
}
