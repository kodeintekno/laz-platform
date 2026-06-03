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
  async getDashboardPrograms(page: number, limit: number, search?: string, lazId?: string) {
    return programsRepository.findMany(page, limit, search, lazId);
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

  async updateProgram(id: string, data: ProgramInput, adminId: string) {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { lazId: true },
    });

    if (!admin) {
      throw new Error("Admin tidak ditemukan");
    }

    const oldProgram = await prisma.program.findUnique({
      where: { id },
      select: { imageUrl: true },
    });

    const updatedProgram = await programsRepository.update(id, {
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
          const { deleteFile } = await import("@/lib/upload/uploadService");
          await deleteFile(oldPublicId);
        } catch (e) {
          console.error("Gagal menghapus gambar lama program:", e);
        }
      }
    }

    await auditService.log({
      userId: adminId,
      action: AuditAction.UPDATE,
      entity: "Program",
      entityId: updatedProgram.id,
      newData: updatedProgram as any,
    });

    return updatedProgram;
  },

  async deleteProgram(id: string, adminId: string) {
    // Delete the program
    const deletedProgram = await programsRepository.delete(id);

    // Log the deletion
    await auditService.log({
      userId: adminId,
      action: AuditAction.DELETE,
      entity: "Program",
      entityId: id,
      oldData: deletedProgram as any,
    });

    return deletedProgram;
  },
};
