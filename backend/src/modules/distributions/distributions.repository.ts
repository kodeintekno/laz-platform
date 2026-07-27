import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { Prisma } from "@prisma/client";
import { AppError } from "../../common/errors/app.error";
import type { DistributionInput } from "../../../../shared/validations/distributions.schema";

@Injectable()
export class DistributionsRepository {
  constructor(private readonly prisma: PrismaService) {}

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
   * Create a new distribution request.
   */
  async create(data: DistributionInput, userId: string) {
    const program = await this.prisma.program.findUnique({
      where: { id: data.programId },
      select: { lembagaId: true },
    });
    if (!program) {
      throw new AppError("PROGRAM_NOT_FOUND", "Program tidak ditemukan", 404);
    }

    return this.prisma.distribution.create({
      data: {
        amount: data.amount,
        title: data.title,
        description: data.description,
        receiptImageUrl: data.receiptImageUrl,
        programId: data.programId,
        createdById: userId,
        status: "PENDING",
        lembagaId: program.lembagaId,
      },
    });
  }

  /**
   * Approve a distribution and atomically increment the program's distributedAmount.
   */
  async approve(distributionId: string, adminUserId: string) {
    return this.prisma.$transaction(async (tx) => {
      const distribution = await tx.distribution.findUnique({
        where: { id: distributionId },
      });

      if (!distribution)
        throw new AppError("DISTRIBUTION_NOT_FOUND", "Distribution not found", 404);
      if (distribution.status !== "PENDING")
        throw new AppError(
          "INVALID_STATUS",
          "Only PENDING distributions can be approved",
          409,
        );

      // Update distribution status
      const updated = await tx.distribution.update({
        where: { id: distributionId },
        data: {
          status: "COMPLETED",
          approvedById: adminUserId,
        },
      });

      // Increment the program's distributed amount
      await tx.program.update({
        where: { id: distribution.programId },
        data: {
          distributedAmount: {
            increment: distribution.amount,
          },
        },
      });

      return updated;
    });
  }

  /**
   * Reject a distribution.
   */
  async reject(distributionId: string, adminUserId: string) {
    const distribution = await this.prisma.distribution.findUnique({
      where: { id: distributionId },
    });

    if (!distribution)
      throw new AppError("DISTRIBUTION_NOT_FOUND", "Distribution not found", 404);
    if (distribution.status !== "PENDING")
      throw new AppError("INVALID_STATUS", "Only PENDING distributions can be rejected", 409);

    return this.prisma.distribution.update({
      where: { id: distributionId },
      data: {
        status: "REJECTED",
        approvedById: adminUserId,
      },
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
}
