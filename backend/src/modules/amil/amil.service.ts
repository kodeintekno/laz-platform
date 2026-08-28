import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Prisma, ProgramCategory } from "@prisma/client";
import { AppError } from "../../common/errors/app.error";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "../audit/audit.types";

export interface AmilSplitResult {
  platformPercentage: number;
  institutionPercentage: number;
  amilPlatformAmount: number;
  amilInstitutionAmount: number;
  netAmount: number;
}

@Injectable()
export class AmilService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getGlobalSettings() {
    return this.prisma.amilGlobalSetting.findMany({
      orderBy: { category: "asc" },
    });
  }

  async updateGlobalSetting(category: ProgramCategory, maxTotalPercentage: number, defaultPlatformPercentage: number) {
    if (maxTotalPercentage < 0 || maxTotalPercentage > 100) {
      throw new BadRequestException("maxTotalPercentage must be between 0 and 100");
    }
    if (defaultPlatformPercentage < 0 || defaultPlatformPercentage > maxTotalPercentage) {
      throw new BadRequestException("defaultPlatformPercentage must be between 0 and maxTotalPercentage");
    }

    return this.prisma.amilGlobalSetting.upsert({
      where: { category },
      update: { maxTotalPercentage, defaultPlatformPercentage },
      create: { category, maxTotalPercentage, defaultPlatformPercentage },
    });
  }

  async getInstitutionSettings(lembagaId: string) {
    // We want to return settings for all categories.
    // If an institution setting doesn't exist, we fall back to global defaults.
    const globalSettings = await this.getGlobalSettings();
    const institutionSettings = await this.prisma.amilInstitutionSetting.findMany({
      where: { lembagaId },
    });

    return globalSettings.map((global: any) => {
      const instSetting = institutionSettings.find((s: any) => s.category === global.category);
      return {
        category: global.category,
        maxTotalPercentage: Number(global.maxTotalPercentage),
        platformPercentage: instSetting ? Number(instSetting.platformPercentage) : Number(global.defaultPlatformPercentage),
        institutionPercentage: instSetting ? Number(instSetting.institutionPercentage) : Number(global.maxTotalPercentage) - Number(global.defaultPlatformPercentage),
      };
    });
  }

  async updateInstitutionSetting(lembagaId: string, category: ProgramCategory, institutionPercentage: number, platformPercentageOverride?: number) {
    const globalSetting = await this.prisma.amilGlobalSetting.findUnique({
      where: { category },
    });

    if (!globalSetting) {
      throw new NotFoundException(`Global setting for category ${category} not found`);
    }

    // Determine platform percentage
    // Admin Lembaga cannot provide platformPercentageOverride (it will be undefined).
    // Super Admin can provide it.
    let platformPercentage = Number(globalSetting.defaultPlatformPercentage);
    
    // Check if there is an existing setting to preserve existing platformPercentage if not overridden
    const existingSetting = await this.prisma.amilInstitutionSetting.findUnique({
      where: { lembagaId_category: { lembagaId, category } },
    });

    if (platformPercentageOverride !== undefined) {
      platformPercentage = platformPercentageOverride;
    } else if (existingSetting) {
      platformPercentage = Number(existingSetting.platformPercentage);
    }

    const totalPercentage = platformPercentage + institutionPercentage;

    if (institutionPercentage < 0 || platformPercentage < 0) {
      throw new BadRequestException("Percentage cannot be negative");
    }

    if (totalPercentage > Number(globalSetting.maxTotalPercentage)) {
      throw new BadRequestException(
        `Total percentage (${totalPercentage}%) exceeds the maximum allowed (${globalSetting.maxTotalPercentage}%) for ${category}`
      );
    }

    return this.prisma.amilInstitutionSetting.upsert({
      where: { lembagaId_category: { lembagaId, category } },
      update: { institutionPercentage, platformPercentage },
      create: { lembagaId, category, institutionPercentage, platformPercentage },
    });
  }

  /** Ambil default lembaga + kategori lalu bentuk snapshot untuk satu program. */
  async getDefaultProgramAmilSnapshot(
    tx: Prisma.TransactionClient,
    input: {
      lembagaId: string;
      category: ProgramCategory;
      institutionPercentage?: number;
    },
  ) {
    const globalSetting = await tx.amilGlobalSetting.findUnique({ where: { category: input.category } });
    if (!globalSetting) throw new NotFoundException(`Pengaturan amil untuk kategori ${input.category} tidak ditemukan`);

    const existing = await tx.amilInstitutionSetting.findUnique({
      where: { lembagaId_category: { lembagaId: input.lembagaId, category: input.category } },
    });
    const platformPercentage = existing
      ? Number(existing.platformPercentage)
      : Number(globalSetting.defaultPlatformPercentage);
    const institutionPercentage = input.institutionPercentage ?? (existing
      ? Number(existing.institutionPercentage)
      : Number(globalSetting.maxTotalPercentage) - platformPercentage);
    const maxTotalPercentage = Number(globalSetting.maxTotalPercentage);

    this.validateProgramAmilSnapshot(platformPercentage, institutionPercentage, maxTotalPercentage);
    return { platformPercentage, institutionPercentage, maxTotalPercentage };
  }

  validateProgramAmilSnapshot(platformPercentage: number, institutionPercentage: number, maxTotalPercentage: number) {
    const values = [platformPercentage, institutionPercentage, maxTotalPercentage];
    if (values.some((value) => !Number.isFinite(value) || value < 0 || value > 100)) {
      throw new BadRequestException("Persentase snapshot amil program tidak valid");
    }
    if (values.some((value) => Math.abs(value * 100 - Math.round(value * 100)) > 1e-8)) {
      throw new BadRequestException("Persentase amil maksimal menggunakan 2 angka desimal");
    }
    if (platformPercentage + institutionPercentage > maxTotalPercentage) {
      throw new BadRequestException(
        `Total porsi amil (${platformPercentage + institutionPercentage}%) melebihi batas maksimum (${maxTotalPercentage}%)`,
      );
    }
  }

  async getMyPlatformChangeRequests(lembagaId: string) {
    return this.prisma.amilPlatformChangeRequest.findMany({
      where: { lembagaId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { program: { select: { title: true, slug: true } } },
    });
  }

  async createPlatformChangeRequest(
    lembagaId: string,
    userId: string,
    category: ProgramCategory,
    requestedPlatformPercentage: number,
    reason: string,
  ) {
    const cleanReason = reason?.trim();
    if (!Object.values(ProgramCategory).includes(category)) {
      throw new BadRequestException("Kategori program tidak valid");
    }
    if (!Number.isFinite(requestedPlatformPercentage) || requestedPlatformPercentage < 0 || requestedPlatformPercentage > 100) {
      throw new BadRequestException("Porsi amil platform yang diajukan harus berada di antara 0% dan 100%");
    }
    if (!cleanReason || cleanReason.length < 10 || cleanReason.length > 1000) {
      throw new BadRequestException("Alasan permohonan harus terdiri dari 10 sampai 1000 karakter");
    }

    const request = await this.prisma.$transaction(async (tx) => {
      const globalSetting = await tx.amilGlobalSetting.findUnique({ where: { category } });
      if (!globalSetting) throw new NotFoundException(`Pengaturan amil untuk kategori ${category} tidak ditemukan`);
      const existing = await tx.amilInstitutionSetting.findUnique({
        where: { lembagaId_category: { lembagaId, category } },
      });
      const currentPlatformPercentage = existing
        ? Number(existing.platformPercentage)
        : Number(globalSetting.defaultPlatformPercentage);
      const institutionPercentage = existing
        ? Number(existing.institutionPercentage)
        : Number(globalSetting.maxTotalPercentage) - currentPlatformPercentage;
      const maximum = Number(globalSetting.maxTotalPercentage);

      if (requestedPlatformPercentage === currentPlatformPercentage) {
        throw new BadRequestException("Porsi platform yang diajukan harus berbeda dari porsi saat ini");
      }
      if (requestedPlatformPercentage + institutionPercentage > maximum) {
        throw new BadRequestException(`Total porsi usulan tidak boleh melebihi batas maksimum ${maximum}%`);
      }
      const pending = await tx.amilPlatformChangeRequest.findFirst({
        where: { lembagaId, category, status: "PENDING" },
        select: { id: true },
      });
      if (pending) {
        throw new AppError(
          "AMIL_REQUEST_ALREADY_PENDING",
          `Masih ada permohonan kategori ${category} yang menunggu keputusan Super Admin`,
          409,
        );
      }

      return tx.amilPlatformChangeRequest.create({
        data: {
          lembagaId,
          category,
          currentPlatformPercentage,
          requestedPlatformPercentage,
          institutionPercentage,
          reason: cleanReason,
        },
      });
    });

    await this.auditService.log({
      userId,
      action: AuditAction.CREATE,
      entity: "AmilPlatformChangeRequest",
      entityId: request.id,
      newData: request as any,
      lembagaId,
    });
    return request;
  }

  async getPlatformChangeRequests(page = 1, limit = 10, status?: string, search?: string) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    if (status && !["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      throw new BadRequestException("Status permohonan tidak valid");
    }
    const where: Prisma.AmilPlatformChangeRequestWhereInput = {
      ...(status ? { status: status as any } : {}),
      ...(search ? {
        OR: [
          { lembaga: { name: { contains: search, mode: "insensitive" } } },
          { program: { title: { contains: search, mode: "insensitive" } } },
          { reason: { contains: search, mode: "insensitive" } },
        ],
      } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.amilPlatformChangeRequest.findMany({
        where,
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
        orderBy: { createdAt: "desc" },
        include: {
          lembaga: { select: { name: true, slug: true } },
          program: { select: { title: true, slug: true } },
          reviewedBy: { select: { name: true } },
        },
      }),
      this.prisma.amilPlatformChangeRequest.count({ where }),
    ]);
    return { items, metadata: { total, page: safePage, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) || 1 } };
  }

  async approvePlatformChangeRequest(id: string, reviewerId: string, reviewNote?: string) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const request = await tx.amilPlatformChangeRequest.findUnique({ where: { id } });
      if (!request) throw new NotFoundException("Permohonan perubahan porsi platform tidak ditemukan");
      if (request.status !== "PENDING") throw new AppError("AMIL_REQUEST_ALREADY_REVIEWED", "Permohonan ini sudah diproses", 409);

      const globalSetting = await tx.amilGlobalSetting.findUnique({ where: { category: request.category } });
      if (!globalSetting) throw new NotFoundException(`Pengaturan amil ${request.category} tidak ditemukan`);
      const currentSetting = await tx.amilInstitutionSetting.findUnique({
        where: { lembagaId_category: { lembagaId: request.lembagaId, category: request.category } },
      });
      const institutionPercentage = currentSetting ? Number(currentSetting.institutionPercentage) : Number(request.institutionPercentage);
      const requestedPlatformPercentage = Number(request.requestedPlatformPercentage);
      if (institutionPercentage + requestedPlatformPercentage > Number(globalSetting.maxTotalPercentage)) {
        throw new BadRequestException("Permohonan tidak dapat disetujui karena total porsi amil akan melampaui batas maksimum");
      }

      const claimed = await tx.amilPlatformChangeRequest.updateMany({
        where: { id, status: "PENDING" },
        data: { status: "APPROVED", reviewedById: reviewerId, reviewedAt: new Date(), reviewNote: reviewNote?.trim() || null },
      });
      if (claimed.count !== 1) throw new AppError("AMIL_REQUEST_ALREADY_REVIEWED", "Permohonan ini sudah diproses", 409);
      await tx.amilInstitutionSetting.upsert({
        where: { lembagaId_category: { lembagaId: request.lembagaId, category: request.category } },
        update: { platformPercentage: requestedPlatformPercentage },
        create: { lembagaId: request.lembagaId, category: request.category, institutionPercentage, platformPercentage: requestedPlatformPercentage },
      });
      return tx.amilPlatformChangeRequest.findUnique({ where: { id } });
    });

    await this.auditService.log({
      userId: reviewerId,
      action: AuditAction.UPDATE,
      entity: "AmilPlatformChangeRequest",
      entityId: id,
      newData: { status: "APPROVED", requestedPlatformPercentage: Number(updated!.requestedPlatformPercentage) },
      lembagaId: updated!.lembagaId,
    });
    return updated;
  }

  async rejectPlatformChangeRequest(id: string, reviewerId: string, reviewNote: string) {
    if (!reviewNote?.trim() || reviewNote.trim().length < 5) throw new BadRequestException("Alasan penolakan minimal 5 karakter");
    const request = await this.prisma.amilPlatformChangeRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException("Permohonan perubahan porsi platform tidak ditemukan");
    const updated = await this.prisma.amilPlatformChangeRequest.updateMany({
      where: { id, status: "PENDING" },
      data: { status: "REJECTED", reviewedById: reviewerId, reviewedAt: new Date(), reviewNote: reviewNote.trim() },
    });
    if (updated.count !== 1) throw new AppError("AMIL_REQUEST_ALREADY_REVIEWED", "Permohonan ini sudah diproses", 409);
    const result = await this.prisma.amilPlatformChangeRequest.findUnique({ where: { id } });
    await this.auditService.log({
      userId: reviewerId,
      action: AuditAction.UPDATE,
      entity: "AmilPlatformChangeRequest",
      entityId: id,
      newData: { status: "REJECTED", reviewNote: reviewNote.trim() },
      lembagaId: request.lembagaId,
    });
    return result;
  }

  calculateSplitFromProgramSnapshot(
    amount: number,
    platformPercentage: number,
    institutionPercentage: number,
  ): AmilSplitResult {
    if (!Number.isFinite(amount) || amount < 0) throw new BadRequestException("Nominal donasi tidak valid");
    if ([platformPercentage, institutionPercentage].some((value) => !Number.isFinite(value) || value < 0 || value > 100)) {
      throw new BadRequestException("Snapshot persentase amil program tidak valid");
    }
    if (platformPercentage + institutionPercentage > 100) {
      throw new BadRequestException("Total snapshot amil program tidak boleh melebihi 100%");
    }
    const amilPlatformAmount = Math.floor(amount * (platformPercentage / 100));
    const amilInstitutionAmount = Math.floor(amount * (institutionPercentage / 100));
    const netAmount = amount - amilPlatformAmount - amilInstitutionAmount;

    return {
      platformPercentage,
      institutionPercentage,
      amilPlatformAmount,
      amilInstitutionAmount,
      netAmount,
    };
  }
}
