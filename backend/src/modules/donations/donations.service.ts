import crypto from "crypto";
import { Injectable, NotFoundException } from "@nestjs/common";
import { DonationsRepository } from "./donations.repository";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "../audit/audit.types";
import { AppError } from "../../common/errors/app.error";
import type {
  AdminDonationInput,
  DonationInput,
} from "../../../../shared/validations/donations.schema";

@Injectable()
export class DonationsService {
  constructor(
    private readonly donationsRepository: DonationsRepository,
    private readonly auditService: AuditService,
  ) {}

  async getDashboardDonations(page: number, limit: number, search?: string, lazId?: string) {
    return this.donationsRepository.findMany(page, limit, search, lazId);
  }

  async createDonation(data: DonationInput, userId?: string) {
    return this.donationsRepository.createWithPayment({
      amount: data.amount,
      message: data.message,
      isAnonymous: data.isAnonymous,
      userId,
      programId: data.programId,
      paymentMethod: data.paymentMethod,
      donorName: data.donorName,
      donorEmail: data.donorEmail,
      donorPhone: data.donorPhone,
    });
  }

  async getDonationById(id: string) {
    return this.donationsRepository.getDonationById(id);
  }

  async createAdminDonation(data: AdminDonationInput, adminUserId: string) {
    const result = await this.donationsRepository.createAdminDonation(data);

    await this.auditService.log({
      userId: adminUserId,
      action: AuditAction.CREATE,
      entity: "Donation",
      entityId: result.id,
      newData: result as any,
    });

    return result;
  }

  async updateAdminDonation(id: string, data: AdminDonationInput, adminUserId: string) {
    const result = await this.donationsRepository.updateAdminDonation(id, data);

    await this.auditService.log({
      userId: adminUserId,
      action: AuditAction.UPDATE,
      entity: "Donation",
      entityId: id,
      newData: result as any,
    });

    return result;
  }

  /**
   * Bangun payload mock-webhook Midtrans (settlement) untuk simulasi
   * pembayaran dari dashboard admin.
   */
  async generateMockWebhookPayload(donationId: string) {
    const donation = await this.donationsRepository.getDonationWithPayment(donationId);

    if (!donation || !donation.payment) {
      throw new NotFoundException("Donation atau Payment tidak ditemukan");
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      throw new AppError("CONFIG_ERROR", "MIDTRANS_SERVER_KEY belum diatur di .env", 500);
    }

    const payload = {
      order_id: donation.payment.gatewayRef,
      status_code: "200",
      gross_amount: donation.payment.amount.toString(),
      transaction_status: "settlement",
      payment_type: donation.payment.paymentMethod || "bank_transfer",
      transaction_time: new Date().toISOString(),
      transaction_id: `mock-tx-${Date.now()}`,
      signature_key: "",
    };

    const payloadString = `${payload.order_id}${payload.status_code}${payload.gross_amount}${serverKey}`;
    payload.signature_key = crypto.createHash("sha512").update(payloadString).digest("hex");

    return payload;
  }
}
