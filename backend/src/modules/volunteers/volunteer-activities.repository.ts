import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { Prisma } from "@prisma/client";

@Injectable()
export class VolunteerActivitiesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(page = 1, limit = 10, lembagaId?: string, search?: string) {
    const skip = (page - 1) * limit;
    const where: Prisma.VolunteerActivityWhereInput = {
      ...(lembagaId ? { lembagaId } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.volunteerActivity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          program: { select: { title: true, slug: true } },
          _count: { select: { applications: true } },
        },
      }),
      this.prisma.volunteerActivity.count({ where }),
    ]);

    return {
      items,
      metadata: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  async findById(id: string) {
    return this.prisma.volunteerActivity.findUnique({
      where: { id },
      include: {
        program: { select: { title: true, slug: true } },
        _count: { select: { applications: true } },
      },
    });
  }

  /** Kegiatan OPEN — publik, lintas-lembaga (dipakai relawan "Cari Kegiatan"). */
  async findOpen() {
    return this.prisma.volunteerActivity.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      include: {
        lembaga: { select: { name: true, slug: true, logoUrl: true } },
        program: { select: { title: true, slug: true } },
        _count: { select: { applications: { where: { status: { in: ["APPROVED", "REPORT_SUBMITTED", "COMPLETED"] } } } } },
      },
    });
  }

  async findOpenById(id: string) {
    return this.prisma.volunteerActivity.findFirst({
      where: { id, status: "OPEN" },
      include: {
        lembaga: { select: { name: true, slug: true, logoUrl: true } },
        program: { select: { title: true, slug: true } },
      },
    });
  }

  async countApprovedApplications(activityId: string) {
    return this.prisma.volunteerApplication.count({
      where: { activityId, status: { in: ["APPROVED", "REPORT_SUBMITTED", "COMPLETED"] } },
    });
  }

  async create(data: Prisma.VolunteerActivityUncheckedCreateInput) {
    return this.prisma.volunteerActivity.create({ data });
  }

  async update(id: string, data: Prisma.VolunteerActivityUncheckedUpdateInput) {
    return this.prisma.volunteerActivity.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.volunteerActivity.delete({ where: { id } });
  }
}
