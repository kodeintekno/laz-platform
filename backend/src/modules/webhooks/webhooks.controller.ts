import { Body, Controller, Post } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { Public } from "../../common/decorators/public.decorator";
import { WebhookService, type MidtransWebhookPayload } from "../payments/webhook.service";
import { Logger } from "@nestjs/common";

/**
 * Webhook Midtrans — server-to-server, tanpa session/CSRF (dikecualikan
 * di main.ts). Signature SHA512 + idempotency ditangani WebhookService.
 * Error → 400 agar Midtrans berhenti retry payload rusak.
 */
@Controller("api/webhooks")
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhookService: WebhookService) {}

  @Post("midtrans")
  @Public()
  @SkipThrottle()
  async midtrans(@Body() payload: MidtransWebhookPayload) {
    this.logger.log(
      { order_id: payload.order_id, status: payload.transaction_status },
      "Received Midtrans Webhook",
    );
    return { result: await this.webhookService.processMidtransWebhook(payload) };
  }
}
