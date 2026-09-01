import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AutoJournalService } from "../journal/auto-journal.service";
import { AmilService } from "../amil/amil.service";
import type { DonationStatus, PaymentStatus } from "@prisma/client";

/**
 * Payments Repository — encapsulates all Prisma database calls for Payment.
 */
@Injectable()
export class PaymentsRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly autoJournalService: AutoJournalService,
    private readonly amilService: AmilService,
  ) { }

  /**
   * Find a unique payment by its gateway reference key,
   * including the associated donation.
   */
  async findByGatewayRef(gatewayRef: string) {
    return this.prisma.payment.findUnique({
      where: { gatewayRef },
      include: { donation: true },
    });
  }

  /**
   * Atomically updates both Payment and Donation status,
   * and increments the Program funding if donation was PAID.
   */
  async updatePaymentAndDonationStatus(params: {
    paymentId: string;
    donationId: string;
    programId: string;
    amount: number;
    newPaymentStatus: PaymentStatus;
    newDonationStatus: DonationStatus;
    paidAt?: Date;
    metadata?: any;
    auditUserId?: string | null;
    xenditPaymentId?: string;
    xenditEvent?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Conditional update to prevent Race Conditions
      // We only update if the current status is PENDING.
      const paymentUpdate = await tx.payment.updateMany({
        where: { id: params.paymentId, status: "PENDING" },
        data: {
          status: params.newPaymentStatus,
          paidAt: params.paidAt ?? undefined,
          metadata: params.metadata ? (params.metadata as any) : undefined,
        },
      });

      if (paymentUpdate.count === 0) {
        // The payment was already processed by a concurrent webhook or is not PENDING
        return { success: false, reason: "ALREADY_PROCESSED" };
      }

      // We need program category and lembagaId for Amil split
      const program = await tx.program.findUniqueOrThrow({
        where: { id: params.programId },
        select: {
          id: true,
          lembagaId: true,
          category: true,
          amilPlatformPercentage: true,
          amilInstitutionPercentage: true,
        }
      });

      // 2. Hitung Revenue Split lebih dulu jika PAID (diperlukan untuk update donation)
      let platformPercentage = 0;
      let institutionPercentage = 0;
      let amilPlatformAmount = 0;
      let amilInstitutionAmount = 0;
      let netAmount = 0;
      let platformFee = 0; // Legacy
      let institutionAmount = 0; // Legacy

      if (params.newDonationStatus === "PAID") {
        const split = this.amilService.calculateSplitFromProgramSnapshot(
          Number(params.amount),
          Number(program.amilPlatformPercentage),
          Number(program.amilInstitutionPercentage),
        );
        platformPercentage = split.platformPercentage;
        institutionPercentage = split.institutionPercentage;
        amilPlatformAmount = split.amilPlatformAmount;
        amilInstitutionAmount = split.amilInstitutionAmount;
        netAmount = split.netAmount;
        
        platformFee = amilPlatformAmount;
        institutionAmount = amilInstitutionAmount + netAmount;
      }

      // 3. Update Donation Status + simpan platformFee & institutionAmount
      await tx.donation.update({
        where: { id: params.donationId },
        data: {
          status: params.newDonationStatus,
          ...(params.newDonationStatus === "PAID" && {
            platformFee,
            institutionAmount,
            platformPercentage,
            institutionPercentage,
            amilPlatformAmount,
            amilInstitutionAmount,
            netAmount,
          }),
        },
      });

      // 4. Atomically increment program current amount if the donation is paid
      if (params.newDonationStatus === "PAID") {
        await tx.program.update({
          where: { id: params.programId },
          data: {
            currentAmount: {
              increment: params.amount,
            },
            programFundAmount: {
              increment: netAmount,
            },
          },
        });

        // 5. Buat Auto Journal untuk Donasi
        await this.autoJournalService.createDonationJournal(
          tx,
          params.donationId,
          Number(params.amount),
          amilPlatformAmount,
          amilInstitutionAmount,
          netAmount,
          params.programId,
          program.lembagaId,
          program.category
        );

        // 6. Update Saldo Lembaga secara Atomic
        await tx.institutionBalance.upsert({
          where: { lembagaId: program.lembagaId },
          update: {
            balance: {
              increment: institutionAmount,
            },
            mustahiqBalance: {
              increment: netAmount,
            },
            amilBalance: {
              increment: amilInstitutionAmount,
            },
          },
          create: {
            lembagaId: program.lembagaId,
            balance: institutionAmount,
            mustahiqBalance: netAmount,
            amilBalance: amilInstitutionAmount,
          },
        });
      }

      // 7. Audit log inside transaction for atomicity
      if (params.xenditEvent) {
        await tx.auditLog.create({
          data: {
            userId: params.auditUserId || null,
            action: "PAYMENT_UPDATE",
            entity: "Payment",
            entityId: params.paymentId,
            oldData: { status: "PENDING" },
            newData: {
              status: params.newPaymentStatus,
              xenditPaymentId: params.xenditPaymentId,
              xenditEvent: params.xenditEvent,
            }
          }
        });
      }

      return { success: true };
    });
  }

  /**
   * Find paged and searchable payments.
   */
  async findManyPaged(page: number = 1, limit: number = 10, search?: string, lembagaId?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (lembagaId) {
      where.lembagaId = lembagaId;
    }
    if (search) {
      const isStatusEnum = [
        "PENDING", "SUCCESS", "FAILED", "CANCELLED", "EXPIRED",
      ].includes(search.toUpperCase());

      where.OR = [
        { gatewayRef: { contains: search, mode: "insensitive" } },
        { id: { contains: search, mode: "insensitive" } },
        { paymentMethod: { contains: search, mode: "insensitive" } },
        { donation: { program: { title: { contains: search, mode: "insensitive" } } } },
        { donation: { donorName: { contains: search, mode: "insensitive" } } },
        { donation: { donorPhone: { contains: search, mode: "insensitive" } } },
      ];

      if (isStatusEnum) {
        where.OR.push({ status: { equals: search.toUpperCase() as any } });
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          donation: {
            include: {
              program: {
                select: {
                  title: true,
                  slug: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.payment.count({ where }),
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
}
