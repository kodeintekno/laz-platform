import { BadRequestException, Injectable, Logger, NotFoundException, Optional } from "@nestjs/common";
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
import { AmilService } from "../amil/amil.service";
import { NotificationsService } from "../notifications/notifications.service";

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
    private readonly amilService: AmilService,
    @Optional() private readonly notifications?: NotificationsService,
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

  private resolvePlatformProposal(
    data: Pick<ProgramInput, "requestedPlatformPercentage" | "platformChangeReason">,
    snapshot: { platformPercentage: number; institutionPercentage: number; maxTotalPercentage: number },
  ) {
    const requested = data.requestedPlatformPercentage;
    this.amilService.validateProgramAmilSnapshot(
      requested ?? snapshot.platformPercentage,
      snapshot.institutionPercentage,
      snapshot.maxTotalPercentage,
    );
    if (requested === undefined || Math.abs(requested - snapshot.platformPercentage) < 1e-8) {
      return { requestedPlatformPercentage: null, platformChangeReason: null };
    }

    const reason = data.platformChangeReason?.trim();
    if (!reason || reason.length < 10) {
      throw new BadRequestException("Alasan perubahan porsi amil platform minimal 10 karakter");
    }
    return { requestedPlatformPercentage: requested, platformChangeReason: reason };
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

    const newProgram = await this.prisma.$transaction(async (tx) => {
      const snapshot = await this.amilService.getProgramAmilContext(tx, {
        lembagaId: admin.lembagaId!,
        category: data.category,
      });
      if (data.institutionPercentage !== undefined) snapshot.institutionPercentage = data.institutionPercentage;
      const proposal = this.resolvePlatformProposal(data, snapshot);
      const program = await tx.program.create({
        data: {
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
          lembagaId: admin.lembagaId!,
          amilPlatformPercentage: snapshot.platformPercentage,
          amilInstitutionPercentage: snapshot.institutionPercentage,
          amilMaxTotalPercentage: snapshot.maxTotalPercentage,
          requestedAmilPlatformPercentage: proposal.requestedPlatformPercentage,
          amilPlatformChangeReason: proposal.platformChangeReason,
          amilLockedAt: data.status === "PUBLISHED" ? new Date() : null,
        },
      });

      if (data.status === "PENDING_REVIEW") {
        await tx.programReviewHistory.create({
          data: {
            programId: program.id,
            defaultPlatformPercentage: snapshot.platformPercentage,
            requestedPlatformPercentage: proposal.requestedPlatformPercentage,
            institutionPercentage: snapshot.institutionPercentage,
            maxTotalPercentage: snapshot.maxTotalPercentage,
            platformChangeReason: proposal.platformChangeReason,
          },
        });
      }
      return program;
    });

    await this.auditService.log({
      userId: adminId,
      action: AuditAction.CREATE,
      entity: "Program",
      entityId: newProgram.id,
      newData: newProgram as any,
    });

    if (newProgram.status === "PENDING_REVIEW") {
      await this.notifications?.notifyRole("SUPER_ADMIN", {
        type: "ACTION_REQUIRED",
        title: "Program menunggu review",
        message: `Program “${newProgram.title}” baru diajukan untuk ditinjau.`,
        link: "/dashboard/programs",
      });
    }

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

    const oldProgram = await this.prisma.program.findUnique({ where: { id } });
    if (!oldProgram) throw new NotFoundException("Program tidak ditemukan");
    if (oldProgram.status === "PENDING_REVIEW" && ["PUBLISHED", "REJECTED"].includes(data.status)) {
      throw new AppError(
        "PROGRAM_REVIEW_ACTION_REQUIRED",
        "Gunakan aksi Setujui atau Tolak agar keputusan program dan porsi amil diproses bersamaan",
        409,
      );
    }
    if (actor.lembagaId && oldProgram.lembagaId !== actor.lembagaId && !hasPermission(actor, PERMISSIONS.PROGRAMS_APPROVE)) {
      throw new AppError("FORBIDDEN_PROGRAM", "Anda tidak memiliki izin untuk mengubah program lembaga lain", 403);
    }

    const snapshotLocked = !!oldProgram.amilLockedAt || ["PUBLISHED", "COMPLETED", "CANCELLED"].includes(oldProgram.status);
    const requestedInstitution = data.institutionPercentage ?? Number(oldProgram.amilInstitutionPercentage);
    const currentProposal = oldProgram.requestedAmilPlatformPercentage === null
      ? Number(oldProgram.amilPlatformPercentage)
      : Number(oldProgram.requestedAmilPlatformPercentage);
    if (snapshotLocked && (
      data.category !== oldProgram.category
      || Math.abs(requestedInstitution - Number(oldProgram.amilInstitutionPercentage)) > 1e-8
      || (data.requestedPlatformPercentage !== undefined && Math.abs(data.requestedPlatformPercentage - currentProposal) > 1e-8)
    )) {
      throw new AppError(
        "PROGRAM_AMIL_LOCKED",
        "Kategori dan porsi amil program yang sudah dipublikasikan tidak dapat diubah",
        409,
      );
    }

    const updatedProgram = await this.prisma.$transaction(async (tx) => {
      let snapshot = {
        platformPercentage: Number(oldProgram.amilPlatformPercentage),
        institutionPercentage: Number(oldProgram.amilInstitutionPercentage),
        maxTotalPercentage: Number(oldProgram.amilMaxTotalPercentage),
      };
      if (!snapshotLocked && data.category !== oldProgram.category) {
        snapshot = await this.amilService.getProgramAmilContext(tx, {
          lembagaId: oldProgram.lembagaId,
          category: data.category,
        });
        if (data.institutionPercentage !== undefined) snapshot.institutionPercentage = data.institutionPercentage;
      } else if (!snapshotLocked) {
        snapshot.institutionPercentage = requestedInstitution;
      }

      const proposal = snapshotLocked
        ? {
            requestedPlatformPercentage: oldProgram.requestedAmilPlatformPercentage === null
              ? null
              : Number(oldProgram.requestedAmilPlatformPercentage),
            platformChangeReason: oldProgram.amilPlatformChangeReason,
          }
        : this.resolvePlatformProposal(data, snapshot);

      const program = await tx.program.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description,
          targetAmount: data.targetAmount,
          category: data.category,
          status: data.status,
          imageUrl: data.image || null,
          startDate: data.startDate ? new Date(data.startDate) : null,
          endDate: data.endDate ? new Date(data.endDate) : null,
          amilPlatformPercentage: snapshot.platformPercentage,
          amilInstitutionPercentage: snapshot.institutionPercentage,
          amilMaxTotalPercentage: snapshot.maxTotalPercentage,
          requestedAmilPlatformPercentage: proposal.requestedPlatformPercentage,
          amilPlatformChangeReason: proposal.platformChangeReason,
          ...(oldProgram.status !== "PENDING_REVIEW" && data.status === "PENDING_REVIEW" ? { rejectionReason: null } : {}),
          ...(!oldProgram.amilLockedAt && data.status === "PUBLISHED" ? { amilLockedAt: new Date() } : {}),
        },
      });

      const reviewSnapshot = {
        defaultPlatformPercentage: snapshot.platformPercentage,
        requestedPlatformPercentage: proposal.requestedPlatformPercentage,
        institutionPercentage: snapshot.institutionPercentage,
        maxTotalPercentage: snapshot.maxTotalPercentage,
        platformChangeReason: proposal.platformChangeReason,
      };
      if (oldProgram.status !== "PENDING_REVIEW" && data.status === "PENDING_REVIEW") {
        await tx.programReviewHistory.create({ data: { programId: id, ...reviewSnapshot } });
      } else if (oldProgram.status === "PENDING_REVIEW" && data.status === "PENDING_REVIEW") {
        const pendingReview = await tx.programReviewHistory.findFirst({
          where: { programId: id, status: "PENDING" },
          orderBy: { submittedAt: "desc" },
          select: { id: true },
        });
        if (pendingReview) {
          await tx.programReviewHistory.update({ where: { id: pendingReview.id }, data: reviewSnapshot });
        } else {
          await tx.programReviewHistory.create({ data: { programId: id, ...reviewSnapshot } });
        }
      } else if (oldProgram.status === "PENDING_REVIEW" && data.status !== "PENDING_REVIEW") {
        await tx.programReviewHistory.updateMany({
          where: { programId: id, status: "PENDING" },
          data: { status: "WITHDRAWN", reviewedAt: new Date() },
        });
      }

      return program;
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
      oldData: oldProgram as any,
      newData: updatedProgram as any,
    });

    if (oldProgram.status !== "PENDING_REVIEW" && updatedProgram.status === "PENDING_REVIEW") {
      await this.notifications?.notifyRole("SUPER_ADMIN", {
        type: "ACTION_REQUIRED",
        title: "Program menunggu review",
        message: `Program “${updatedProgram.title}” diajukan untuk ditinjau.`,
        link: "/dashboard/programs",
      });
    }

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

    const effectivePlatformPercentage = existing.requestedAmilPlatformPercentage === null
      ? Number(existing.amilPlatformPercentage)
      : Number(existing.requestedAmilPlatformPercentage);
    this.amilService.validateProgramAmilSnapshot(
      effectivePlatformPercentage,
      Number(existing.amilInstitutionPercentage),
      Number(existing.amilMaxTotalPercentage),
    );

    const updated = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.program.updateMany({
        where: { id, status: "PENDING_REVIEW" },
        data: {
          status: "PUBLISHED",
          approvedAt: new Date(),
          amilLockedAt: new Date(),
          approvedById: approverId,
          rejectionReason: null,
          amilPlatformPercentage: effectivePlatformPercentage,
        },
      });
      if (claimed.count !== 1) {
        throw new AppError("INVALID_STATUS", "Pengajuan program ini sudah diproses", 409);
      }

      const pendingReview = await tx.programReviewHistory.findFirst({
        where: { programId: id, status: "PENDING" },
        orderBy: { submittedAt: "desc" },
        select: { id: true },
      });
      if (pendingReview) {
        await tx.programReviewHistory.update({
          where: { id: pendingReview.id },
          data: { status: "APPROVED", reviewedAt: new Date() },
        });
      } else {
        await tx.programReviewHistory.create({
          data: {
            programId: id,
            status: "APPROVED",
            defaultPlatformPercentage: existing.amilPlatformPercentage,
            requestedPlatformPercentage: existing.requestedAmilPlatformPercentage,
            institutionPercentage: existing.amilInstitutionPercentage,
            maxTotalPercentage: existing.amilMaxTotalPercentage,
            platformChangeReason: existing.amilPlatformChangeReason,
            reviewedAt: new Date(),
          },
        });
      }
      return tx.program.findUniqueOrThrow({ where: { id } });
    });

    await this.auditService.log({
      userId: approverId,
      action: AuditAction.PROGRAM_APPROVE,
      entity: "Program",
      entityId: id,
      oldData: { status: existing.status, amilLockedAt: existing.amilLockedAt },
      newData: {
        status: updated.status,
        amilLockedAt: updated.amilLockedAt,
        amilPlatformPercentage: Number(updated.amilPlatformPercentage),
        amilInstitutionPercentage: Number(updated.amilInstitutionPercentage),
        amilMaxTotalPercentage: Number(updated.amilMaxTotalPercentage),
      },
    });

    await this.notifications?.notifyUser(existing.createdById, {
      type: "SUCCESS",
      title: "Program disetujui",
      message: `Program “${existing.title}” telah disetujui dan dipublikasikan.`,
      link: "/dashboard/programs",
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

    const updated = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.program.updateMany({
        where: { id, status: "PENDING_REVIEW" },
        data: {
          status: "REJECTED",
          rejectionReason: reason,
          approvedById: approverId,
          approvedAt: null,
          amilLockedAt: null,
        },
      });
      if (claimed.count !== 1) {
        throw new AppError("INVALID_STATUS", "Pengajuan program ini sudah diproses", 409);
      }

      const pendingReview = await tx.programReviewHistory.findFirst({
        where: { programId: id, status: "PENDING" },
        orderBy: { submittedAt: "desc" },
        select: { id: true },
      });
      if (pendingReview) {
        await tx.programReviewHistory.update({
          where: { id: pendingReview.id },
          data: { status: "REJECTED", rejectionReason: reason, reviewedAt: new Date() },
        });
      } else {
        await tx.programReviewHistory.create({
          data: {
            programId: id,
            status: "REJECTED",
            defaultPlatformPercentage: existing.amilPlatformPercentage,
            requestedPlatformPercentage: existing.requestedAmilPlatformPercentage,
            institutionPercentage: existing.amilInstitutionPercentage,
            maxTotalPercentage: existing.amilMaxTotalPercentage,
            platformChangeReason: existing.amilPlatformChangeReason,
            rejectionReason: reason,
            reviewedAt: new Date(),
          },
        });
      }
      return tx.program.findUniqueOrThrow({ where: { id } });
    });

    await this.auditService.log({
      userId: approverId,
      action: AuditAction.PROGRAM_REJECT,
      entity: "Program",
      entityId: id,
      oldData: { status: existing.status },
      newData: { status: updated.status, rejectionReason: reason },
    });

    await this.notifications?.notifyUser(existing.createdById, {
      type: "WARNING",
      title: "Program perlu diperbaiki",
      message: `Program “${existing.title}” ditolak: ${reason}`,
      link: "/dashboard/programs",
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
