import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const donationsRepository = {
  /**
   * Fetch all donations for the admin dashboard.
   */
  async findMany(page = 1, limit = 10, search?: string, lazId?: string) {
    const skip = (page - 1) * limit;

    const where: Prisma.DonationWhereInput = {
      ...(lazId && { lazId }),
      ...(search && {
        OR: [
          { id: { contains: search, mode: "insensitive" } },
          { user: { name: { contains: search, mode: "insensitive" } } },
          { user: { email: { contains: search, mode: "insensitive" } } },
        ],
      }),
    };

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
    donorName?: string;
    donorEmail?: string;
    donorPhone?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      // 0. Fetch parent program's lazId
      const program = await tx.program.findUnique({
        where: { id: data.programId },
        select: { lazId: true },
      });
      if (!program) {
        throw new Error("Program tidak ditemukan");
      }

      // 1. Create Donation (status PENDING by default)
      const donation = await tx.donation.create({
        data: {
          amount: data.amount,
          message: data.message,
          isAnonymous: data.isAnonymous,
          userId: data.userId,
          programId: data.programId,
          lazId: program.lazId,
          donorName: data.donorName,
          donorEmail: data.donorEmail,
          donorPhone: data.donorPhone,
        },
      });

      // 2. Create Payment Stub (Gateway integration placeholder)
      const payment = await tx.payment.create({
        data: {
          donationId: donation.id,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          gatewayRef: `MOCK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          lazId: program.lazId,
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

  /**
   * Find a unique donation by ID including its associated payment record.
   */
  async getDonationWithPayment(id: string) {
    return prisma.donation.findUnique({
      where: { id },
      include: { payment: true },
    });
  },

  /**
   * Get a donation by ID for admin editing
   */
  async getDonationById(id: string) {
    return prisma.donation.findUnique({
      where: { id },
    });
  },

  /**
   * Create a manual offline donation by Admin
   */
  async createAdminDonation(data: {
    amount: number;
    message?: string;
    isAnonymous: boolean;
    userId?: string;
    donorName?: string;
    programId: string;
    status: import("@prisma/client").DonationStatus;
    adminLazId?: string; // Needed if admin creates it, but we can also get it from program
  }) {
    return prisma.$transaction(async (tx) => {
      const program = await tx.program.findUnique({
        where: { id: data.programId },
        select: { lazId: true },
      });
      if (!program) throw new Error("Program tidak ditemukan");

      const donation = await tx.donation.create({
        data: {
          amount: data.amount,
          message: data.message,
          isAnonymous: data.isAnonymous,
          userId: data.userId,
          donorName: data.donorName,
          programId: data.programId,
          lazId: program.lazId,
          status: data.status,
        },
      });

      // Also create a dummy payment record for offline
      await tx.payment.create({
        data: {
          donationId: donation.id,
          amount: data.amount,
          paymentMethod: "OFFLINE",
          status: data.status === "PAID" ? "SUCCESS" : "PENDING",
          gatewayRef: `MANUAL-${Date.now()}`,
          lazId: program.lazId,
        },
      });

      // Update program currentAmount if PAID
      if (data.status === "PAID") {
        await tx.program.update({
          where: { id: donation.programId },
          data: { currentAmount: { increment: data.amount } },
        });
      }

      return donation;
    });
  },

  /**
   * Update an existing manual donation
   */
  async updateAdminDonation(
    id: string,
    data: {
      amount: number;
      message?: string;
      isAnonymous: boolean;
      userId?: string;
      donorName?: string;
      programId: string;
      status: import("@prisma/client").DonationStatus;
    }
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.donation.findUnique({ where: { id } });
      if (!existing) throw new Error("Donasi tidak ditemukan");

      const isProgramChanged = existing.programId !== data.programId;
      
      // Calculate financial impacts on the Old Program
      if (existing.status === "PAID") {
        await tx.program.update({
          where: { id: existing.programId },
          data: { currentAmount: { decrement: existing.amount } },
        });
      }

      // Update the donation record
      const donation = await tx.donation.update({
        where: { id },
        data: {
          amount: data.amount,
          message: data.message,
          isAnonymous: data.isAnonymous,
          userId: data.userId,
          donorName: data.donorName,
          programId: data.programId,
          status: data.status,
          // If program changed, we need to update lazId to match new program
          ...(isProgramChanged ? {
            lazId: (await tx.program.findUniqueOrThrow({ where: { id: data.programId } })).lazId
          } : {})
        },
      });

      // Update payment status if exists
      const payment = await tx.payment.findUnique({ where: { donationId: id } });
      if (payment) {
        await tx.payment.update({
          where: { donationId: id },
          data: { 
            amount: data.amount,
            status: data.status === "PAID" ? "SUCCESS" : (data.status === "FAILED" ? "FAILED" : "PENDING"),
          },
        });
      }

      // Calculate financial impacts on the New/Current Program
      if (data.status === "PAID") {
        await tx.program.update({
          where: { id: data.programId },
          data: { currentAmount: { increment: data.amount } },
        });
      }

      return donation;
    });
  },
};
