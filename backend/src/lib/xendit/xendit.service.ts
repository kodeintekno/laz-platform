import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Xendit from "xendit-node";
import { AppError } from "../../common/errors/app.error";
import type { Env } from "../../config/env";

export type PaymentMethodChannel =
  | "QRIS"
  | "BCA_VIRTUAL_ACCOUNT"
  | "BRI_VIRTUAL_ACCOUNT"
  | "MANDIRI_VIRTUAL_ACCOUNT"
  | "BNI_VIRTUAL_ACCOUNT"
  | "PERMATA_VIRTUAL_ACCOUNT"
  | "BSI_VIRTUAL_ACCOUNT";

export interface CreatePaymentRequestParams {
  /** Our internal donation ID — used as Xendit reference_id for idempotency */
  referenceId: string;
  /** Amount in IDR (integer — no decimals) */
  amountIdr: number;
  /** Payment channel */
  channel: PaymentMethodChannel;
  /** Human-readable description shown on Xendit */
  description?: string;
  /** Donor name for traceability */
  donorName?: string;
}

export interface PaymentRequestResult {
  /** Xendit's pr-xxxx payment request ID */
  paymentRequestId: string;
  /** QRIS raw string — render as QR code image on frontend */
  qrString?: string;
  /** Virtual Account number to display to donor */
  vaNumber?: string;
  /** When this payment expires (stored in DB; shown as countdown in UI) */
  expiresAt: Date;
}

export interface CreatePayoutRequestParams {
  idempotencyKey: string;
  referenceId: string;
  amountIdr: number;
  channelCode: string;
  accountNumber: string;
  accountHolderName: string;
  description?: string;
}

export interface PayoutRequestResult {
  payoutId: string;
  status: string;
  estimatedArrivalTime?: Date;
}

/** Expiry durations */
const QRIS_EXPIRY_HOURS = 48; // Xendit default — QRIS does not support custom expires_at
const VA_EXPIRY_HOURS = 24;   // 24-hour expiry for Virtual Accounts

@Injectable()
export class XenditService {
  private readonly logger = new Logger(XenditService.name);
  private readonly xenditClient: Xendit;

  constructor(private readonly configService: ConfigService<Env>) {
    const secretKey = this.configService.get<string>("XENDIT_SECRET_KEY")!;
    this.xenditClient = new Xendit({ secretKey });
  }

  /**
   * Creates a Xendit Payment Request for QRIS or Virtual Account.
   *
   * Security:
   * - amountIdr comes from our DB (never from frontend)
   * - referenceId is our donationId (backend-controlled)
   * - Xendit credentials never leave this service
   */
  async createPaymentRequest(
    params: CreatePaymentRequestParams,
  ): Promise<PaymentRequestResult> {
    const { referenceId, amountIdr, channel, description, donorName } = params;

    this.logger.log(
      { referenceId, channel, amount: amountIdr },
      "Creating Xendit payment request",
    );

    try {
      if (channel === "QRIS") {
        return await this.createQrisPayment(referenceId, amountIdr, description);
      } else {
        return await this.createVirtualAccountPayment(
          referenceId,
          amountIdr,
          channel,
          description,
          donorName,
        );
      }
    } catch (err) {
      if (err instanceof AppError) throw err;

      // Xendit API errors
      this.logger.error(
        { referenceId, channel, error: err },
        "Xendit payment request failed",
      );
      throw new AppError(
        "PAYMENT_GATEWAY_ERROR",
        "Gagal membuat pembayaran. Silakan coba lagi.",
        502,
      );
    }
  }

  private async createQrisPayment(
    referenceId: string,
    amountIdr: number,
    description?: string,
  ): Promise<PaymentRequestResult> {
    const expiresAt = new Date(
      Date.now() + QRIS_EXPIRY_HOURS * 60 * 60 * 1000,
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pr = (this.xenditClient as any).PaymentRequest;
    const response = await pr.createPaymentRequest({
      data: {
        referenceId: referenceId,
        currency: "IDR",
        amount: amountIdr,
        paymentMethod: {
          type: "QR_CODE",
          reusability: "ONE_TIME_USE",
          qrCode: {
            channelCode: "QRIS",
          },
        },
        description: description ?? `Donasi #${referenceId}`,
      },
    });

    const paymentRequestId: string = response.id;

    // The QR string is returned inside paymentMethod
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const qrAction = (response.actions ?? []).find(
      (a: any) => a.actionType === "PRESENT_TO_CUSTOMER" || a.type === "PRESENT_TO_CUSTOMER",
    );
    const qrString: string | undefined = 
      qrAction?.url || 
      qrAction?.value ||
      response.paymentMethod?.qrCode?.channelProperties?.qrString;

    this.logger.log(
      { referenceId, paymentRequestId, hasQrString: !!qrString },
      "Xendit QRIS payment created",
    );

    return { paymentRequestId, qrString, expiresAt };
  }

  private async createVirtualAccountPayment(
    referenceId: string,
    amountIdr: number,
    channel: PaymentMethodChannel,
    description?: string,
    donorName?: string,
  ): Promise<PaymentRequestResult> {
    const expiresAt = new Date(
      Date.now() + VA_EXPIRY_HOURS * 60 * 60 * 1000,
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pr = (this.xenditClient as any).PaymentRequest;
    const response = await pr.createPaymentRequest({
      data: {
        referenceId: referenceId,
        currency: "IDR",
        amount: amountIdr,
        paymentMethod: {
          type: "VIRTUAL_ACCOUNT",
          reusability: "ONE_TIME_USE",
          virtualAccount: {
            channelCode: channel.replace("_VIRTUAL_ACCOUNT", ""),
            channelProperties: {
              customerName: donorName ?? "Donatur",
              expiresAt: expiresAt,
            },
          },
        },
        description: description ?? `Donasi #${referenceId}`,
      },
    });

    const paymentRequestId: string = response.id;

    // VA number is returned in actions[] as DISPLAY_TO_CUSTOMER or in paymentMethod
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vaAction = (response.actions ?? []).find(
      (a: any) => a.actionType === "DISPLAY_TO_CUSTOMER" || a.type === "DISPLAY_TO_CUSTOMER",
    );
    const vaNumber: string | undefined =
      vaAction?.url ||
      vaAction?.value ||
      response.paymentMethod?.virtualAccount?.channelProperties?.virtualAccountNumber;

    this.logger.log(
      { referenceId, paymentRequestId, channel, hasVaNumber: !!vaNumber },
      "Xendit Virtual Account payment created",
    );

    return { paymentRequestId, vaNumber, expiresAt };
  }

  /**
   * Creates a Xendit Payout for Institution Withdrawal.
   *
   * Security:
   * - Uses idempotencyKey to prevent double payouts.
   * - Amount and destination come from backend snapshot, never frontend.
   */
  async createPayout(
    params: CreatePayoutRequestParams,
  ): Promise<PayoutRequestResult> {
    const {
      idempotencyKey,
      referenceId,
      amountIdr,
      channelCode,
      accountNumber,
      accountHolderName,
      description,
    } = params;

    this.logger.log(
      { referenceId, channelCode, amount: amountIdr },
      "Creating Xendit payout request",
    );

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payoutApi = (this.xenditClient as any).Payout;
      
      const response = await payoutApi.createPayout({
        idempotencyKey,
        data: {
          referenceId,
          channelCode,
          channelProperties: {
            accountHolderName,
            accountNumber,
          },
          amount: amountIdr,
          description: description ?? `Pencairan #${referenceId}`,
          currency: "IDR",
        },
      });

      this.logger.log(
        { referenceId, payoutId: response.id, status: response.status },
        "Xendit payout created successfully",
      );

      return {
        payoutId: response.id,
        status: response.status,
        estimatedArrivalTime: response.estimatedArrivalTime ? new Date(response.estimatedArrivalTime) : undefined,
      };
    } catch (err) {
      this.logger.error(
        { referenceId, error: err },
        "Xendit payout request failed",
      );
      
      // If it's a known API error, throw it so the caller knows it failed
      throw new AppError(
        "PAYOUT_GATEWAY_ERROR",
        "Gagal memproses pencairan dana melalui payment gateway. Silakan coba lagi.",
        502,
      );
    }
  }
}
