import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AutoJournalService } from "../journal/auto-journal.service";
import type { Prisma } from "@prisma/client";
import { AppError } from "../../common/errors/app.error";
import type { DistributionInput } from "../../../../shared/validations/distributions.schema";

@Injectable()
export class DistributionsRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly autoJournalService: AutoJournalService,
  ) {}

  /**
   * List all distributions (admin/dashboard).
   */
  async findMany(page = 1, limit = 10, search?: string, lembagaId?: string) {
    const skip = (page - 1) * limit;

    const where: Prisma.DistributionWhereInput = {};
    if (lembagaId) {
      where.lembagaId = lembagaId;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { program: { title: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.distribution.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          program: { select: { title: true, currentAmount: true, distributedAmount: true } },
          createdBy: { select: { name: true, email: true } },
          approvedBy: { select: { name: true } },
        },
      }),
      this.prisma.distribution.count({ where }),
    ]);

    return {
      items,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create and immediately finalize a distribution (no approval step).
   *
   * Balance check + increment happens as one conditional UPDATE (not a plain
   * read-then-write) so two concurrent submissions can't both pass a
   * check-then-update race and jointly over-distribute a program's funds —
   * the WHERE clause re-verifies the remaining balance atomically under the
   * row lock Postgres takes for the UPDATE itself.
   */
  async create(data: DistributionInput, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const program = await tx.program.findUnique({
        where: { id: data.programId },
        select: { lembagaId: true, category: true },
      });
      if (!program) {
        throw new AppError("PROGRAM_NOT_FOUND", "Program tidak ditemukan", 404);
      }

      const affected = await tx.$executeRaw`
        UPDATE "programs"
        SET "distributedAmount" = "distributedAmount" + ${data.amount}
        WHERE "id" = ${data.programId}
          AND "currentAmount" - "distributedAmount" >= ${data.amount}
      `;

      if (affected === 0) {
        throw new AppError(
          "INSUFFICIENT_BALANCE",
          "Saldo program tidak mencukupi untuk penyaluran ini",
          409,
        );
      }

      const distribution = await tx.distribution.create({
        data: {
          amount: data.amount,
          title: data.title,
          description: data.description,
          receiptImageUrl: data.receiptImageUrl,
          programId: data.programId,
          createdById: userId,
          status: "COMPLETED",
          lembagaId: program.lembagaId,
        },
      });

      await this.autoJournalService.createDistributionJournal(
        tx,
        distribution.id,
        Number(data.amount),
        data.programId,
        program.lembagaId,
        program.category,
        userId
      );

      return distribution;
    });
  }

  /**
   * Get COMPLETED distributions for a specific program (public view).
   */
  async getByProgramSlug(slug: string) {
    return this.prisma.distribution.findMany({
      where: {
        program: { slug },
        status: "COMPLETED",
      },
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { name: true } },
      },
    });
  }

  /**
   * Riwayat penyaluran/pengeluaran berdasarkan nomor telepon donatur — publik,
   * lintas-lembaga. Distribution tidak menyimpan donorPhone (bukan entitas milik
   * donatur), jadi semantiknya: "pengeluaran dari lembaga yang pernah saya
   * donasikan", bukan penelusuran per-donasi.
   */
  async findHistoryByPhone(phone: string, page = 1, limit = 10) {
    const donorLembagas = await this.prisma.donation.findMany({
      where: { donorPhone: phone },
      select: { lembagaId: true },
      distinct: ["lembagaId"],
    });
    const lembagaIds = donorLembagas.map((d) => d.lembagaId);

    if (lembagaIds.length === 0) {
      return { items: [], metadata: { total: 0, page, limit, totalPages: 1 } };
    }

    const skip = (page - 1) * limit;
    const where: Prisma.DistributionWhereInput = {
      lembagaId: { in: lembagaIds },
      status: "COMPLETED",
    };

    const [items, total] = await Promise.all([
      this.prisma.distribution.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          program: { select: { title: true, slug: true } },
          lembaga: { select: { name: true, slug: true } },
        },
      }),
      this.prisma.distribution.count({ where }),
    ]);

    return {
      items,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}
