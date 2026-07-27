import { Injectable, NotFoundException } from "@nestjs/common";
import { VolunteerApplicationsRepository } from "./volunteer-applications.repository";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "../audit/audit.types";
import { AppError } from "../../common/errors/app.error";

const ACTIVE_STATUSES = ["APPROVED", "REPORT_SUBMITTED", "COMPLETED"];

@Injectable()
export class VolunteerApplicationsService {
  constructor(
    private readonly applicationsRepository: VolunteerApplicationsRepository,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async apply(volunteerId: string, activityId: string) {
    const activity = await this.prisma.volunteerActivity.findUnique({
      where: { id: activityId },
      select: { id: true, lembagaId: true, status: true, quota: true },
    });
    if (!activity) {
      throw new AppError("ACTIVITY_NOT_FOUND", "Kegiatan tidak ditemukan", 404);
    }
    if (activity.status !== "OPEN") {
      throw new AppError(
        "ACTIVITY_NOT_OPEN",
        "Kegiatan ini tidak lagi membuka pendaftaran relawan",
        422,
      );
    }

    const existing = await this.applicationsRepository.findByVolunteerAndActivity(volunteerId, activityId);
    if (existing) {
      throw new AppError("ALREADY_APPLIED", "Anda sudah mendaftar ke kegiatan ini", 409);
    }

    if (activity.quota) {
      const approvedCount = await this.prisma.volunteerApplication.count({
        where: { activityId, status: { in: ACTIVE_STATUSES as any } },
      });
      if (approvedCount >= activity.quota) {
        throw new AppError("QUOTA_FULL", "Kuota relawan untuk kegiatan ini sudah penuh", 422);
      }
    }

    return this.applicationsRepository.create({
      volunteerId,
      activityId,
      lembagaId: activity.lembagaId,
      status: "PENDING",
    });
  }

  /** "Pendaftaran Saya" — PENDING/REJECTED (belum/tidak jadi diikuti). */
  async getPendingApplications(volunteerId: string) {
    return this.applicationsRepository.findOwnApplications(volunteerId, ["PENDING", "REJECTED"]);
  }

  /** "Kegiatan Saya" — APPROVED/REPORT_SUBMITTED (sedang diikuti / menunggu verifikasi). */
  async getActiveApplications(volunteerId: string) {
    return this.applicationsRepository.findOwnApplications(volunteerId, ["APPROVED", "REPORT_SUBMITTED"]);
  }

  /** "Riwayat & Kontribusi" — COMPLETED (selesai & terverifikasi). */
  async getCompletedApplications(volunteerId: string) {
    return this.applicationsRepository.findOwnApplications(volunteerId, "COMPLETED");
  }

  async getOwnApplications(volunteerId: string) {
    return this.applicationsRepository.findOwnApplications(volunteerId);
  }

  async getDashboardApplications(
    page: number,
    limit: number,
    lembagaId?: string,
    status?: string,
    search?: string,
    activityId?: string,
  ) {
    return this.applicationsRepository.findMany(page, limit, lembagaId, status, search, activityId);
  }

  async approve(id: string, lembagaScope: string | undefined, reviewerId: string) {
    const application = await this.applicationsRepository.findById(id);
    if (!application) throw new NotFoundException("Pendaftaran relawan tidak ditemukan");
    if (lembagaScope && application.lembagaId !== lembagaScope) {
      throw new AppError("FORBIDDEN", "Akses ditolak: lamaran ini milik lembaga lain", 403);
    }
    if (application.status !== "PENDING") {
      throw new AppError("INVALID_STATUS", "Hanya pendaftaran PENDING yang dapat disetujui", 409);
    }

    const updated = await this.applicationsRepository.approve(id, reviewerId);

    await this.auditService.log({
      userId: reviewerId,
      action: AuditAction.VOLUNTEER_APPLICATION_REVIEW,
      entity: "VolunteerApplication",
      entityId: id,
      newData: { status: updated.status },
    });

    return updated;
  }

  async reject(id: string, reason: string, lembagaScope: string | undefined, reviewerId: string) {
    const application = await this.applicationsRepository.findById(id);
    if (!application) throw new NotFoundException("Pendaftaran relawan tidak ditemukan");
    if (lembagaScope && application.lembagaId !== lembagaScope) {
      throw new AppError("FORBIDDEN", "Akses ditolak: lamaran ini milik lembaga lain", 403);
    }
    if (application.status !== "PENDING") {
      throw new AppError("INVALID_STATUS", "Hanya pendaftaran PENDING yang dapat ditolak", 409);
    }

    const updated = await this.applicationsRepository.reject(id, reason, reviewerId);

    await this.auditService.log({
      userId: reviewerId,
      action: AuditAction.VOLUNTEER_APPLICATION_REVIEW,
      entity: "VolunteerApplication",
      entityId: id,
      newData: { status: updated.status, rejectionReason: reason },
    });

    return updated;
  }

  /** Relawan mengirim laporan/tugas selesai — hanya untuk lamaran APPROVED. */
  async submitReport(
    id: string,
    volunteerId: string,
    data: { reportText: string; reportFileUrl?: string; reportFilePublicId?: string },
  ) {
    const application = await this.applicationsRepository.findById(id);
    if (!application) throw new NotFoundException("Pendaftaran relawan tidak ditemukan");
    if (application.volunteerId !== volunteerId) {
      throw new AppError("FORBIDDEN", "Akses ditolak: ini bukan pendaftaran Anda", 403);
    }
    if (application.status !== "APPROVED") {
      throw new AppError(
        "INVALID_STATUS",
        "Laporan hanya dapat dikirim untuk kegiatan yang sudah disetujui dan sedang diikuti",
        409,
      );
    }

    const updated = await this.applicationsRepository.submitReport(id, data);

    await this.auditService.log({
      userId: null,
      action: AuditAction.VOLUNTEER_REPORT_SUBMIT,
      entity: "VolunteerApplication",
      entityId: id,
      newData: { status: updated.status },
    });

    return updated;
  }

  /** Lembaga memverifikasi laporan — kegiatan resmi selesai untuk relawan ini. */
  async verifyReport(id: string, lembagaScope: string | undefined, verifierId: string, note?: string) {
    const application = await this.applicationsRepository.findById(id);
    if (!application) throw new NotFoundException("Pendaftaran relawan tidak ditemukan");
    if (lembagaScope && application.lembagaId !== lembagaScope) {
      throw new AppError("FORBIDDEN", "Akses ditolak: lamaran ini milik lembaga lain", 403);
    }
    if (application.status !== "REPORT_SUBMITTED") {
      throw new AppError(
        "INVALID_STATUS",
        "Hanya laporan berstatus menunggu verifikasi yang dapat diverifikasi",
        409,
      );
    }

    const updated = await this.applicationsRepository.verifyReport(id, verifierId, note);

    await this.auditService.log({
      userId: verifierId,
      action: AuditAction.VOLUNTEER_REPORT_VERIFY,
      entity: "VolunteerApplication",
      entityId: id,
      newData: { status: updated.status },
    });

    return updated;
  }

  /** Lembaga meminta relawan merevisi laporan (kembali berstatus APPROVED). */
  async requestReportRevision(id: string, lembagaScope: string | undefined, verifierId: string, note?: string) {
    const application = await this.applicationsRepository.findById(id);
    if (!application) throw new NotFoundException("Pendaftaran relawan tidak ditemukan");
    if (lembagaScope && application.lembagaId !== lembagaScope) {
      throw new AppError("FORBIDDEN", "Akses ditolak: lamaran ini milik lembaga lain", 403);
    }
    if (application.status !== "REPORT_SUBMITTED") {
      throw new AppError(
        "INVALID_STATUS",
        "Hanya laporan berstatus menunggu verifikasi yang dapat diminta revisi",
        409,
      );
    }

    const updated = await this.applicationsRepository.requestReportRevision(id, verifierId, note);

    await this.auditService.log({
      userId: verifierId,
      action: AuditAction.VOLUNTEER_REPORT_VERIFY,
      entity: "VolunteerApplication",
      entityId: id,
      newData: { status: updated.status, reportNote: note },
    });

    return updated;
  }
}
