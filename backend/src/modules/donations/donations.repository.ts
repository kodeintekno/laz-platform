import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { DonationStatus, Prisma } from "@prisma/client";
import { AppError } from "../../common/errors/app.error";
import { AutoJournalService } from "../journal/auto-journal.service";

@Injectable()
export class DonationsRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly autoJournalService: AutoJournalService
  ) {}

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
   * Riwayat donasi berdasarkan nomor telepon — lintas-lembaga.
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
   * Create a donation and payment record in a single transaction.
   * Validates that the program exists and is PUBLISHED.
   *
   * Security: lembagaId is derived from the program — never trusted from caller.
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
    /** Xendit payment_request_id — stored after Xendit API call */
    xenditPaymentRequestId?: string;
    expiresAt?: Date;
  }) {
    return this.prisma.$transaction(async (tx) => {
      // 0. Fetch parent program's lembagaId + validate status
      const program = await tx.program.findUnique({
        where: { id: data.programId },
        select: { lembagaId: true, status: true },
      });
      if (!program) {
        throw new AppError("PROGRAM_NOT_FOUND", "Program tidak ditemukan", 404);
      }
      if (program.status !== "PUBLISHED") {
        throw new AppError(
          "PROGRAM_NOT_ACTIVE",
          "Program tidak tersedia untuk donasi saat ini",
          400,
        );
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

      // 2. Create Payment record — gatewayRef = donationId (used as Xendit reference_id)
      const payment = await tx.payment.create({
        data: {
          donationId: donation.id,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          gatewayRef: donation.id, // We use donationId as Xendit reference_id
          xenditPaymentRequestId: data.xenditPaymentRequestId,
          expiresAt: data.expiresAt,
          lembagaId: program.lembagaId,
        },
      });

      return { donation, payment };
    });
  }

  /**
   * Update the Xendit payment request fields after the Xendit API call succeeds.
   * Called when the payment request creation happens after the initial DB creation.
   */
  async updatePaymentXenditRef(paymentId: string, data: {
    xenditPaymentRequestId: string;
    expiresAt: Date;
  }) {
    return this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        xenditPaymentRequestId: data.xenditPaymentRequestId,
        expiresAt: data.expiresAt,
      },
    });
  }

  /**
   * Public polling endpoint — returns only safe, non-sensitive status info.
   * Used by the frontend to poll payment status without requiring authentication.
   */
  async getPublicDonationStatus(donationId: string) {
    const donation = await this.prisma.donation.findUnique({
      where: { id: donationId },
      select: {
        id: true,
        status: true,
        amount: true,
        payment: {
          select: {
            status: true,
            paymentMethod: true,
            expiresAt: true,
            paidAt: true,
          },
        },
      },
    });

    if (!donation) {
      throw new AppError("DONATION_NOT_FOUND", "Donasi tidak ditemukan", 404);
    }

    return {
      donationId: donation.id,
      donationStatus: donation.status,
      amount: Number(donation.amount),
      paymentStatus: donation.payment?.status ?? null,
      paymentMethod: donation.payment?.paymentMethod ?? null,
      expiresAt: donation.payment?.expiresAt ?? null,
      paidAt: donation.payment?.paidAt ?? null,
    };
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
        select: { lembagaId: true, status: true, category: true },
      });
      if (!program) throw new AppError("PROGRAM_NOT_FOUND", "Program tidak ditemukan", 404);
      if (program.status === "PENDING_REVIEW") {
        throw new AppError(
          "PROGRAM_PENDING_REVIEW",
          "Program masih menunggu persetujuan, donasi manual belum bisa ditambahkan",
          400,
        );
      }

      // Hitung Revenue Split jika PAID sebelum membuat donation record
      const platformFee = data.status === "PAID" ? Math.floor(data.amount * 0.125) : 0;
      const institutionAmount = data.status === "PAID" ? data.amount - platformFee : 0;

      const donation = await tx.donation.create({
        data: {
          amount: data.amount,
          message: data.message,
          isAnonymous: data.isAnonymous,
          donorName: data.donorName,
          programId: data.programId,
          lembagaId: program.lembagaId,
          status: data.status,
          platformFee,
          institutionAmount,
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

        // Buat Auto Journal untuk Donasi
        await this.autoJournalService.createDonationJournal(
          tx,
          donation.id,
          data.amount,
          platformFee,
          institutionAmount,
          donation.programId,
          program.lembagaId,
          program.category
        );

        // Update Saldo Lembaga secara Atomic
        await tx.institutionBalance.upsert({
          where: { lembagaId: program.lembagaId },
          update: {
            balance: {
              increment: institutionAmount,
            },
          },
          create: {
            lembagaId: program.lembagaId,
            balance: institutionAmount,
          },
        });
      }

      return donation;
    });
  }

}
