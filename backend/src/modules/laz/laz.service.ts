import { Injectable, NotFoundException } from "@nestjs/common";
import { LazRepository } from "./laz.repository";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "../audit/audit.types";
import { AppError } from "../../common/errors/app.error";
import type { LazInput } from "../../../../shared/validations/laz.schema";

@Injectable()
export class LazService {
  constructor(
    private readonly lazRepository: LazRepository,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Get all LAZ tenants with pagination and search parameters.
   */
  async getLazs(page?: number, pageSize?: number, search?: string) {
    return this.lazRepository.findMany(page, pageSize, search);
  }

  async getOptions() {
    return this.lazRepository.findActive();
  }

  /**
   * Create a new LAZ organization after verifying unique constraints.
   */
  async createLaz(input: LazInput, creatorUserId: string) {
    // 1. Check if slug is unique
    const existing = await this.lazRepository.findBySlug(input.slug);
    if (existing) {
      throw new AppError(
        "SLUG_TAKEN",
        "Slug LAZ ini sudah digunakan oleh organisasi lain",
        409,
      );
    }

    // 2. Insert to DB
    const laz = await this.lazRepository.create({
      name: input.name,
      slug: input.slug,
      logoUrl: input.logoUrl || null,
      logoPublicId: input.logoPublicId || null,
      status: input.status,
    });

    // 3. Write to Audit Log
    await this.auditService.log({
      userId: creatorUserId,
      action: AuditAction.CREATE,
      entity: "Laz",
      entityId: laz.id,
      newData: { name: laz.name, slug: laz.slug, status: laz.status },
    });

    return laz;
  }

  /**
   * Delete a LAZ organization and write to audit logs.
   */
  async deleteLaz(id: string, executorUserId: string) {
    const existing = await this.lazRepository.findById(id);
    if (!existing) {
      throw new NotFoundException("Lembaga amil zakat tidak ditemukan");
    }

    const deleted = await this.lazRepository.delete(id);

    await this.auditService.log({
      userId: executorUserId,
      action: AuditAction.DELETE,
      entity: "Laz",
      entityId: deleted.id,
      oldData: { name: deleted.name, slug: deleted.slug, status: deleted.status },
    });

    return deleted;
  }

  /**
   * Update an existing LAZ organization and write an audit log.
   */
  async updateLaz(id: string, input: LazInput, executorUserId: string) {
    const existing = await this.lazRepository.findById(id);
    if (!existing) {
      throw new NotFoundException("Lembaga amil zakat tidak ditemukan");
    }

    const updated = await this.lazRepository.update(id, {
      name: input.name,
      slug: input.slug,
      logoUrl: input.logoUrl ?? null,
      logoPublicId: input.logoPublicId ?? null,
      status: input.status,
    });

    await this.auditService.log({
      userId: executorUserId,
      action: AuditAction.UPDATE,
      entity: "Laz",
      entityId: updated.id,
      oldData: {
        name: existing.name,
        slug: existing.slug,
        status: existing.status,
      },
      newData: {
        name: updated.name,
        slug: updated.slug,
        status: updated.status,
      },
    });

    return updated;
  }
}
