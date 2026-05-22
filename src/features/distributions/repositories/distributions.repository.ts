import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { DistributionInput } from "../validations/distributions.schema";

export const distributionsRepository = {
  /**
   * List all distributions (admin/dashboard).
   */
  async findMany(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;

    const where: Prisma.DistributionWhereInput = search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { program: { title: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.distribution.findMany({
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
      prisma.distribution.count({ where }),
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
  },

  /**
   * Create a new distribution request.
   */
  async create(data: DistributionInput, userId: string) {
    return prisma.distribution.create({
      data: {
        amount: data.amount,
        title: data.title,
        description: data.description,
        receiptImage: data.receiptImage,
        programId: data.programId,
        createdById: userId,
        status: "PENDING",
      },
    });
  },

  /**
   * Approve a distribution and atomically increment the program's distributedAmount.
   */
  async approve(distributionId: string, adminUserId: string) {
    return prisma.$transaction(async (tx) => {
      const distribution = await tx.distribution.findUnique({
        where: { id: distributionId },
      });

      if (!distribution) throw new Error("Distribution not found");
      if (distribution.status !== "PENDING") throw new Error("Only PENDING distributions can be approved");

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
  },

  /**
   * Reject a distribution.
   */
  async reject(distributionId: string, adminUserId: string) {
    const distribution = await prisma.distribution.findUnique({
      where: { id: distributionId },
    });

    if (!distribution) throw new Error("Distribution not found");
    if (distribution.status !== "PENDING") throw new Error("Only PENDING distributions can be rejected");

    return prisma.distribution.update({
      where: { id: distributionId },
      data: {
        status: "REJECTED",
        approvedById: adminUserId,
      },
    });
  },

  /**
   * Get COMPLETED distributions for a specific program (public view).
   */
  async getByProgramSlug(slug: string) {
    return prisma.distribution.findMany({
      where: {
        program: { slug },
        status: "COMPLETED",
      },
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { name: true } },
      },
    });
  },
};
