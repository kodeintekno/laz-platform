import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ProgramsRepository } from "./programs.repository";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "../audit/audit.types";
import { PrismaService } from "../../prisma/prisma.service";
import { CloudinaryProvider } from "../../lib/upload/cloudinary.provider";
import { AppError } from "../../common/errors/app.error";
import { hasPermission } from "../../../../shared/lib/permissions";
import { PERMISSIONS } from "../../../../shared/constants/permissions";
import { MAX_FEATURED_PROGRAMS, type ProgramInput } from "../../../../shared/validations/programs.schema";
import type { RBACSessionUser } from "../../../../shared/types/rbac";
import { Prisma } from "@prisma/client";

/** Statuses only a SUPER_ADMIN (programs.approve) may set — everyone else must go through approve/reject. */
const APPROVAL_GATED_STATUSES = new Set(["PUBLISHED", "REJECTED"]);

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

  async getDashboardPrograms(
    page: number,
    limit: number,
    search?: string,
    lembagaId?: string,
    status?: string,
  ) {
    return this.programsRepository.findMany(page, limit, search, lembagaId, status);
  }

  /** Only SUPER_ADMIN (programs.approve) may push a program straight to PUBLISHED/REJECTED — everyone else must go through the dedicated approve/reject endpoints. */
  private assertAllowedStatus(actor: RBACSessionUser, status: string) {
    if (APPROVAL_GATED_STATUSES.has(status) && !hasPermission(actor, PERMISSIONS.PROGRAMS_APPROVE)) {
      throw new AppError(
        "FORBIDDEN_STATUS",
        "Hanya Super Admin yang dapat mempublikasikan atau menolak program. Ajukan program untuk direview.",
        403,
      );
    }
  }

  async getPublishedPrograms(options?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    lembagaId?: string;
    lembagaSlug?: string;
    sort?: "newest" | "most-funded" | "ending-soon";
  }) {
    return this.programsRepository.findPublished(options);
  }

  async getProgramBySlug(slug: string) {
    return this.programsRepository.getProgramBySlug(slug);
  }

  async createProgram(data: ProgramInput, actor: RBACSessionUser) {
    this.assertAllowedStatus(actor, data.status);
    const adminId = actor.id;
    const slug = generateSlug(data.title);

    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
      select: { lembagaId: true },
    });

    if (!admin) {
      throw new NotFoundException("Admin tidak ditemukan");
    }
    if (!admin.lembagaId) {
      throw new AppError(
        "LEMBAGA_REQUIRED",
        "Akun ini tidak terhubung dengan lembaga manapun sehingga tidak dapat membuat program",
        422,
      );
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
      lembagaId: admin.lembagaId,
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

  async updateProgram(id: string, data: ProgramInput, actor: RBACSessionUser) {
    this.assertAllowedStatus(actor, data.status);
    const adminId = actor.id;

    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
      select: { lembagaId: true },
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

  async approveProgram(id: string, approverId: string) {
    const existing = await this.programsRepository.findById(id);
    if (!existing) throw new NotFoundException("Program tidak ditemukan");
    if (existing.status !== "PENDING_REVIEW") {
      throw new AppError(
        "INVALID_STATUS",
        "Hanya program berstatus Menunggu Review yang dapat disetujui",
        409,
      );
    }

    const updated = await this.programsRepository.approve(id, approverId);

    await this.auditService.log({
      userId: approverId,
      action: AuditAction.PROGRAM_APPROVE,
      entity: "Program",
      entityId: id,
      oldData: { status: existing.status },
      newData: { status: updated.status },
    });

    return updated;
  }

  async rejectProgram(id: string, reason: string, approverId: string) {
    const existing = await this.programsRepository.findById(id);
    if (!existing) throw new NotFoundException("Program tidak ditemukan");
    if (existing.status !== "PENDING_REVIEW") {
      throw new AppError(
        "INVALID_STATUS",
        "Hanya program berstatus Menunggu Review yang dapat ditolak",
        409,
      );
    }

    const updated = await this.programsRepository.reject(id, reason, approverId);

    await this.auditService.log({
      userId: approverId,
      action: AuditAction.PROGRAM_REJECT,
      entity: "Program",
      entityId: id,
      oldData: { status: existing.status },
      newData: { status: updated.status, rejectionReason: reason },
    });

    return updated;
  }

  /** Get up to MAX_FEATURED_PROGRAMS programs curated for the homepage. */
  async getFeaturedPrograms() {
    return this.programsRepository.findFeatured(MAX_FEATURED_PROGRAMS);
  }

  /** Mark/unmark a program as featured on the homepage — SUPER_ADMIN only, capped at MAX_FEATURED_PROGRAMS. */
  async setFeaturedProgram(id: string, isFeatured: boolean, actor: RBACSessionUser) {
    const existing = await this.programsRepository.findById(id);
    if (!existing) throw new NotFoundException("Program tidak ditemukan");

    if (isFeatured) {
      if (existing.status !== "PUBLISHED") {
        throw new AppError(
          "INVALID_STATUS",
          "Hanya program berstatus Published yang dapat dijadikan program utama",
          409,
        );
      }
      const featuredCount = await this.programsRepository.countFeatured(id);
      if (featuredCount >= MAX_FEATURED_PROGRAMS) {
        throw new AppError(
          "FEATURED_LIMIT_REACHED",
          `Maksimal ${MAX_FEATURED_PROGRAMS} program utama dapat dipilih. Batalkan salah satu terlebih dahulu.`,
          409,
        );
      }
    }

    const updated = await this.programsRepository.setFeatured(id, isFeatured);

    await this.auditService.log({
      userId: actor.id,
      action: AuditAction.UPDATE,
      entity: "Program",
      entityId: id,
      oldData: { isFeatured: existing.isFeatured },
      newData: { isFeatured: updated.isFeatured },
    });

    return updated;
  }

  async deleteProgram(id: string, actor: RBACSessionUser) {
    // 1. Pastikan program ada
    const existing = await this.programsRepository.findById(id);
    if (!existing) throw new NotFoundException("Program tidak ditemukan");

    // 2. Tenant scoping: LEMBAGA_ADMIN hanya boleh hapus program milik lembaganya sendiri
    if (
      actor.lembagaId &&
      !hasPermission(actor, PERMISSIONS.PROGRAMS_APPROVE) &&
      existing.lembagaId !== actor.lembagaId
    ) {
      throw new AppError(
        "FORBIDDEN_PROGRAM",
        "Anda tidak memiliki izin untuk menghapus program lembaga lain",
        403,
      );
    }

    // 3. Hapus program, tangani error foreign key constraint dengan pesan yang jelas
    let deletedProgram: typeof existing;
    try {
      deletedProgram = await this.programsRepository.delete(id);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2003"
      ) {
        throw new AppError(
          "PROGRAM_HAS_RELATIONS",
          "Program tidak dapat dihapus karena masih memiliki data donasi atau penyaluran terkait",
          409,
        );
      }
      throw err;
    }

    // 4. Log the deletion
    await this.auditService.log({
      userId: actor.id,
      action: AuditAction.DELETE,
      entity: "Program",
      entityId: id,
      oldData: deletedProgram as any,
    });

    return deletedProgram;
  }
}
