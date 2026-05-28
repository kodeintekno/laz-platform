import { programsRepository } from "@/features/programs/repositories/programs.repository";
import { auditService } from "@/features/audit/services/audit.service";
import { AuditAction } from "@/features/audit/types/audit.types";
import type { ProgramInput } from "@/features/programs/validations/programs.schema";
import { prisma } from "@/lib/prisma";

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

export const programsService = {
  async getDashboardPrograms(page: number, limit: number, search?: string) {
    return programsRepository.findMany(page, limit, search);
  },

  async getPublishedPrograms() {
    return programsRepository.findPublished();
  },

  async getProgramBySlug(slug: string) {
    return programsRepository.getProgramBySlug(slug);
  },

  async createProgram(data: ProgramInput, adminId: string) {
    const slug = generateSlug(data.title);

    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { lazId: true },
    });

    if (!admin) {
      throw new Error("Admin tidak ditemukan");
    }

    const newProgram = await programsRepository.create({
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

    await auditService.log({
      userId: adminId,
      action: AuditAction.CREATE,
      entity: "Program",
      entityId: newProgram.id,
      newData: newProgram as any,
    });

    return newProgram;
  },
};
