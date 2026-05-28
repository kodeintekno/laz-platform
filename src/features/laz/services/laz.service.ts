import { lazRepository } from "../repositories/laz.repository";
import type { LazInput } from "../validations/laz.schema";
import { auditService } from "@/features/audit/services/audit.service";
import { AuditAction } from "@/features/audit/types/audit.types";

export const lazService = {
  /**
   * Get all LAZ tenants with pagination and search parameters.
   */
  async getLazs(page?: number, pageSize?: number, search?: string) {
    return lazRepository.findMany(page, pageSize, search);
  },

  /**
   * Create a new LAZ organization after verifying unique constraints and write to audit logs.
   */
  async createLaz(input: LazInput, creatorUserId: string) {
    // 1. Check if slug is unique
    const existing = await lazRepository.findBySlug(input.slug);
    if (existing) {
      throw new Error("Slug LAZ ini sudah digunakan oleh organisasi lain");
    }

    // 2. Insert to DB
    const laz = await lazRepository.create({
      name: input.name,
      slug: input.slug,
      logo: input.logo || null,
      status: input.status,
    });

    // 3. Write to Audit Log
    await auditService.log({
      userId: creatorUserId,
      action: AuditAction.CREATE,
      entity: "Laz",
      entityId: laz.id,
      newData: { name: laz.name, slug: laz.slug, status: laz.status },
    });

    return laz;
  },

  /**
   * Delete a LAZ organization and write to audit logs.
   */
  async deleteLaz(id: string, executorUserId: string) {
    const existing = await lazRepository.findById(id);
    if (!existing) {
      throw new Error("Lembaga amil zakat tidak ditemukan");
    }

    const deleted = await lazRepository.delete(id);

    await auditService.log({
      userId: executorUserId,
      action: AuditAction.DELETE,
      entity: "Laz",
      entityId: deleted.id,
      oldData: { name: deleted.name, slug: deleted.slug, status: deleted.status },
    });

    return deleted;
  },
};
