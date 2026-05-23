import { prisma } from "@/lib/prisma";
import { PaymentStatus, DonationStatus } from "@prisma/client";

/**
 * Payments Repository — Phase 5.
 *
 * Encapsulates all Prisma database calls for the Payment model.
 * Direct access to the `prisma` client is forbidden outside repositories.
 */
export const paymentsRepository = {
  /**
   * Find a unique payment by its gateway reference key,
   * including the associated donation.
   */
  async findByGatewayRef(gatewayRef: string) {
    return prisma.payment.findUnique({
      where: { gatewayRef },
      include: { donation: true },
    });
  },

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
    return prisma.$transaction(async (tx) => {
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
  },
};
