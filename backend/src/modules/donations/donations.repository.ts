import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { DonationStatus, Prisma } from "@prisma/client";
import { AppError } from "../../common/errors/app.error";

@Injectable()
export class DonationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetch all donations for the admin dashboard.
   */
  async findMany(page = 1, limit = 10, search?: string, lembagaId?: string) {
    const skip = (page - 1) * limit;

    const where: Prisma.DonationWhereInput = {
      ...(lembagaId && { lembagaId }),
      ...(search && {
        OR: [
          { id: { contains: search, mode: "insensitive" } },
          { donorName: { contains: search, mode: "insensitive" } },
          { donorPhone: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.donation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          program: { select: { title: true } },
          payment: true,
        },
      }),
      this.prisma.donation.count({ where }),
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
   * Riwayat donasi berdasarkan nomor telepon — lintas-lembaga (donor-facing,
   * bukan admin-facing, sehingga TIDAK melalui resolveLembagaScope).
   */
  async findByPhone(donorPhone: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const where: Prisma.DonationWhereInput = { donorPhone };

    const [items, total] = await Promise.all([
      this.prisma.donation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          program: { select: { title: true, slug: true } },
          lembaga: { select: { name: true, slug: true } },
        },
      }),
      this.prisma.donation.count({ where }),
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

  /**
   * Create a donation and payment record in a transaction.
   */
  async createWithPayment(data: {
    amount: number;
    message?: string;
    isAnonymous: boolean;
    programId: string;
    paymentMethod: string;
    donorName?: string;
    donorEmail?: string;
    donorPhone?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      // 0. Fetch parent program's lembagaId
      const program = await tx.program.findUnique({
        where: { id: data.programId },
        select: { lembagaId: true },
      });
      if (!program) {
        throw new AppError("PROGRAM_NOT_FOUND", "Program tidak ditemukan", 404);
      }

      // 1. Create Donation (status PENDING by default)
      const donation = await tx.donation.create({
        data: {
          amount: data.amount,
          message: data.message,
          isAnonymous: data.isAnonymous,
          programId: data.programId,
          lembagaId: program.lembagaId,
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
          lembagaId: program.lembagaId,
        },
      });

      return { donation, payment };
    });
  }

  /**
   * Find a unique donation by ID including its associated payment record.
   */
  async getDonationWithPayment(id: string) {
    return this.prisma.donation.findUnique({
      where: { id },
      include: { payment: true },
    });
  }

  /**
   * Get a donation by ID for admin editing
   */
  async getDonationById(id: string) {
    return this.prisma.donation.findUnique({
      where: { id },
    });
  }

  /**
   * Create a manual offline donation by Admin
   */
  async createAdminDonation(data: {
    amount: number;
    message?: string;
    isAnonymous: boolean;
    donorName?: string;
    programId: string;
    status: DonationStatus;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const program = await tx.program.findUnique({
        where: { id: data.programId },
        select: { lembagaId: true },
      });
      if (!program) throw new AppError("PROGRAM_NOT_FOUND", "Program tidak ditemukan", 404);

      const donation = await tx.donation.create({
        data: {
          amount: data.amount,
          message: data.message,
          isAnonymous: data.isAnonymous,
          donorName: data.donorName,
          programId: data.programId,
          lembagaId: program.lembagaId,
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
          lembagaId: program.lembagaId,
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
  }

  /**
   * Update an existing manual donation
   */
  async updateAdminDonation(
    id: string,
    data: {
      amount: number;
      message?: string;
      isAnonymous: boolean;
      donorName?: string;
      programId: string;
      status: DonationStatus;
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.donation.findUnique({ where: { id } });
      if (!existing) throw new AppError("DONATION_NOT_FOUND", "Donasi tidak ditemukan", 404);

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
          donorName: data.donorName,
          programId: data.programId,
          status: data.status,
          // If program changed, we need to update lembagaId to match new program
          ...(isProgramChanged
            ? {
                lembagaId: (
                  await tx.program.findUniqueOrThrow({ where: { id: data.programId } })
                ).lembagaId,
              }
            : {}),
        },
      });

      // Update payment status if exists
      const payment = await tx.payment.findUnique({ where: { donationId: id } });
      if (payment) {
        await tx.payment.update({
          where: { donationId: id },
          data: {
            amount: data.amount,
            status:
              data.status === "PAID"
                ? "SUCCESS"
                : data.status === "FAILED"
                  ? "FAILED"
                  : "PENDING",
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
  }
}
