import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { VolunteerActivitiesRepository } from "./volunteer-activities.repository";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "../audit/audit.types";
import { AppError } from "../../common/errors/app.error";
import type { VolunteerActivityInput } from "../../../../shared/validations/volunteers.schema";

@Injectable()
export class VolunteerActivitiesService {
  constructor(
    private readonly activitiesRepository: VolunteerActivitiesRepository,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getDashboardActivities(page: number, limit: number, lembagaId?: string, search?: string) {
    return this.activitiesRepository.findMany(page, limit, lembagaId, search);
  }

  async getById(id: string, lembagaScope: string | undefined) {
    const activity = await this.activitiesRepository.findById(id);
    if (!activity) throw new NotFoundException("Kegiatan tidak ditemukan");
    if (lembagaScope && activity.lembagaId !== lembagaScope) {
      throw new ForbiddenException("Akses ditolak: kegiatan ini milik lembaga lain");
    }
    return activity;
  }

  async getOpenActivities() {
    return this.activitiesRepository.findOpen();
  }

  async create(input: VolunteerActivityInput, creatorId: string, lembagaId: string) {
    if (input.programId) {
      const program = await this.prisma.program.findUnique({ where: { id: input.programId } });
      if (!program || program.lembagaId !== lembagaId) {
        throw new AppError("PROGRAM_NOT_FOUND", "Program tidak ditemukan di lembaga Anda", 404);
      }
    }

    const activity = await this.activitiesRepository.create({
      lembagaId,
      programId: input.programId || null,
      createdById: creatorId,
      title: input.title,
      description: input.description,
      location: input.location || null,
      activityDate: input.activityDate ? new Date(input.activityDate) : null,
      quota: input.quota ?? null,
      status: input.status,
    });

    await this.auditService.log({
      userId: creatorId,
      action: AuditAction.CREATE,
      entity: "VolunteerActivity",
      entityId: activity.id,
      newData: { title: activity.title, status: activity.status },
    });

    return activity;
  }

  async update(id: string, input: VolunteerActivityInput, executorId: string, lembagaScope: string | undefined) {
    const existing = await this.activitiesRepository.findById(id);
    if (!existing) throw new NotFoundException("Kegiatan tidak ditemukan");
    if (lembagaScope && existing.lembagaId !== lembagaScope) {
      throw new ForbiddenException("Akses ditolak: kegiatan ini milik lembaga lain");
    }

    if (input.programId) {
      const program = await this.prisma.program.findUnique({ where: { id: input.programId } });
      if (!program || program.lembagaId !== existing.lembagaId) {
        throw new AppError("PROGRAM_NOT_FOUND", "Program tidak ditemukan di lembaga Anda", 404);
      }
    }

    const updated = await this.activitiesRepository.update(id, {
      title: input.title,
      description: input.description,
      location: input.location || null,
      activityDate: input.activityDate ? new Date(input.activityDate) : null,
      quota: input.quota ?? null,
      status: input.status,
      programId: input.programId || null,
    });

    await this.auditService.log({
      userId: executorId,
      action: AuditAction.UPDATE,
      entity: "VolunteerActivity",
      entityId: id,
      oldData: { title: existing.title, status: existing.status },
      newData: { title: updated.title, status: updated.status },
    });

    return updated;
  }

  async delete(id: string, executorId: string, lembagaScope: string | undefined) {
    const existing = await this.activitiesRepository.findById(id);
    if (!existing) throw new NotFoundException("Kegiatan tidak ditemukan");
    if (lembagaScope && existing.lembagaId !== lembagaScope) {
      throw new ForbiddenException("Akses ditolak: kegiatan ini milik lembaga lain");
    }

    const deleted = await this.activitiesRepository.delete(id);

    await this.auditService.log({
      userId: executorId,
      action: AuditAction.DELETE,
      entity: "VolunteerActivity",
      entityId: id,
      oldData: { title: deleted.title },
    });

    return deleted;
  }
}
