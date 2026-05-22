import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const donationsRepository = {
  /**
   * Fetch all donations for the admin dashboard.
   */
  async findMany(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;

    const where: Prisma.DonationWhereInput = search
      ? {
          OR: [
            { id: { contains: search, mode: "insensitive" } },
            { user: { name: { contains: search, mode: "insensitive" } } },
            { user: { email: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.donation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
          program: { select: { title: true } },
          payment: true,
        },
      }),
      prisma.donation.count({ where }),
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
   * Create a donation and payment record in a transaction.
   */
  async createWithPayment(data: {
    amount: number;
    message?: string;
    isAnonymous: boolean;
    userId?: string;
    programId: string;
    paymentMethod: string;
  }) {
    return prisma.$transaction(async (tx) => {
      // 1. Create Donation (status PENDING by default)
      const donation = await tx.donation.create({
        data: {
          amount: data.amount,
          message: data.message,
          isAnonymous: data.isAnonymous,
          userId: data.userId,
          programId: data.programId,
        },
      });

      // 2. Create Payment Stub (Gateway integration placeholder)
      const payment = await tx.payment.create({
        data: {
          donationId: donation.id,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          gatewayRef: `MOCK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        },
      });

      return { donation, payment };
    });
  },

  /**
   * Complete a donation (called by Payment Webhook or Simulation).
   */
  async markAsPaid(donationId: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Update Donation & Payment
      const donation = await tx.donation.update({
        where: { id: donationId },
        data: { status: "PAID" },
      });

      await tx.payment.update({
        where: { donationId },
        data: { status: "SUCCESS" },
      });

      // 2. Update Program currentAmount
      await tx.program.update({
        where: { id: donation.programId },
        data: {
          currentAmount: {
            increment: donation.amount,
          },
        },
      });

      return donation;
    });
  },
};
