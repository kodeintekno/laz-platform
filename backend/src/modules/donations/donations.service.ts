import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { DonationsRepository } from "./donations.repository";
import { XenditService } from "../../lib/xendit/xendit.service";
import type { PaymentMethodChannel } from "../../lib/xendit/xendit.service";
import type { DonationInput } from "../../../../shared/validations/donations.schema";

export interface CreateDonationResult {
  donationId: string;
  paymentId: string;
  paymentMethod: string;
  amount: number;
  /** QRIS raw string — frontend must render this as QR code */
  qrString?: string;
  /** Virtual Account number to display */
  vaNumber?: string;
  /** When this payment expires */
  expiresAt: Date;
}

@Injectable()
export class DonationsService {
  private readonly logger = new Logger(DonationsService.name);

  constructor(
    private readonly donationsRepository: DonationsRepository,
    private readonly xenditService: XenditService,
  ) {}

  async getDashboardDonations(page: number, limit: number, search?: string, lembagaId?: string) {
    return this.donationsRepository.findMany(page, limit, search, lembagaId);
  }

  /**
   * Creates a donation with a real Xendit payment request.
   *
   * Flow:
   * 1. Create Donation + Payment DB records (in transaction) — gatewayRef = donationId
   * 2. Call Xendit Payment Request API using donationId as reference_id
   * 3. Update Payment record with xenditPaymentRequestId + expiresAt
   * 4. Return payment instructions to controller
   *
   * Security:
   * - lembagaId derived from program DB record (never from request)
   * - amount comes from validated request body (min 10000, integer)
   * - platformFee and institutionAmount NOT calculated here (Phase 2 — Ledger)
   * - Xendit API called on backend only
   */
  async createDonation(data: DonationInput): Promise<CreateDonationResult> {
    // Step 1: Create DB records (validates program is PUBLISHED inside transaction)
    const { donation, payment } = await this.donationsRepository.createWithPayment({
      amount: data.amount,
      message: data.message,
      isAnonymous: data.isAnonymous,
      programId: data.programId,
      paymentMethod: data.paymentMethod,
      donorName: data.donorName,
      donorEmail: data.donorEmail,
      donorPhone: data.donorPhone,
    });

    // Step 2: Call Xendit Payment Request API
    // reference_id = donation.id (our primary key — idempotent)
    let xenditResult;
    try {
      xenditResult = await this.xenditService.createPaymentRequest({
        referenceId: donation.id,
        amountIdr: data.amount,           // Integer IDR — validated by Zod schema
        channel: data.paymentMethod as PaymentMethodChannel,
        description: `Donasi untuk program`,
        donorName: data.donorName,
      });
    } catch (err) {
      // Log but let error propagate — DB records remain PENDING
      // Frontend can retry or show error
      this.logger.error(
        { donationId: donation.id, error: err },
        "Xendit payment creation failed after DB write",
      );
      throw err;
    }

    // Step 3: Update Payment with Xendit reference + expiry
    await this.donationsRepository.updatePaymentXenditRef(payment.id, {
      xenditPaymentRequestId: xenditResult.paymentRequestId,
      expiresAt: xenditResult.expiresAt,
    });

    this.logger.log(
      {
        donationId: donation.id,
        paymentId: payment.id,
        xenditPaymentRequestId: xenditResult.paymentRequestId,
        channel: data.paymentMethod,
      },
      "Donation and Xendit payment created",
    );

    return {
      donationId: donation.id,
      paymentId: payment.id,
      paymentMethod: data.paymentMethod,
      amount: data.amount,
      qrString: xenditResult.qrString,
      vaNumber: xenditResult.vaNumber,
      expiresAt: xenditResult.expiresAt,
    };
  }

  async getDonationById(id: string) {
    return this.donationsRepository.getDonationById(id);
  }

  /** Public payment status polling — no auth required, returns safe subset */
  async getPublicDonationStatus(donationId: string) {
    return this.donationsRepository.getPublicDonationStatus(donationId);
  }

  /** Riwayat donasi publik berdasarkan nomor telepon — lintas-lembaga, tanpa auth. */
  async getDonationHistoryByPhone(phone: string, page: number, limit: number) {
    return this.donationsRepository.findByPhone(phone, page, limit);
  }

}
