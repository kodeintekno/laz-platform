import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { DonationStatus, PaymentStatus } from "@prisma/client";

/**
 * Payments Repository — encapsulates all Prisma database calls for Payment.
 */
@Injectable()
export class PaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}

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
    metadata?: any;
  }) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Update Payment Status
      await tx.payment.update({
        where: { id: params.paymentId },
        data: {
          status: params.newPaymentStatus,
          metadata: params.metadata ? (params.metadata as any) : undefined,
        },
      });

      // 2. Update Donation Status
      await tx.donation.update({
        where: { id: params.donationId },
        data: {
          status: params.newDonationStatus,
        },
      });

      // 3. Atomically increment program current amount if the donation is paid
      if (params.newDonationStatus === "PAID") {
        await tx.program.update({
          where: { id: params.programId },
          data: {
            currentAmount: {
              increment: params.amount,
            },
          },
        });
      }
    });
  }

  /**
   * Find paged and searchable payments.
   */
  async findManyPaged(page: number = 1, limit: number = 10, search?: string, lazId?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (lazId) {
      where.lazId = lazId;
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
        { donation: { user: { name: { contains: search, mode: "insensitive" } } } },
        { donation: { user: { email: { contains: search, mode: "insensitive" } } } },
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
              user: {
                select: {
                  name: true,
                  email: true,
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
