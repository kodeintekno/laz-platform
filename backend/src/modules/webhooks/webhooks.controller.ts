import { Body, Controller, Headers, HttpCode, Post, Param } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { Public } from "../../common/decorators/public.decorator";
import {
  WebhookService,
  type XenditPaymentWebhookPayload,
} from "../payments/webhook.service";
import { Logger } from "@nestjs/common";

/**
 * Xendit Webhooks — server-to-server, stateless (excluded from session/CSRF in main.ts).
 *
 * Authentication: x-callback-token header verified inside WebhookService.
 * Idempotency: WebhookService checks current payment state before updating.
 *
 * Returns 200 on success or known-error so Xendit stops retrying.
 * Returns 401 on invalid token (Xendit will retry — intentional, forces fix).
 */
@Controller("api/webhooks")
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhookService: WebhookService) {}

  @Post("xendit/payment")
  @Public()
  @SkipThrottle()
  @HttpCode(200)
  async xenditPayment(
    @Headers("x-callback-token") callbackToken: string,
    @Body() payload: XenditPaymentWebhookPayload,
  ) {
    this.logger.log(
      {
        event: payload?.event,
        referenceId: payload?.data?.reference_id,
        status: payload?.data?.status,
      },
      "Received Xendit payment webhook",
    );

    const result = await this.webhookService.processXenditPaymentWebhook(
      callbackToken ?? "",
      payload,
    );

    return { result };
  }

  @Post("xendit/payout")
  @Public()
  @SkipThrottle()
  @HttpCode(200)
  async xenditPayout(
    @Headers("x-callback-token") callbackToken: string,
    @Body() payload: any,
  ) {
    this.logger.log(
      {
        event: payload?.event,
        referenceId: payload?.data?.reference_id,
        status: payload?.data?.status,
      },
      "Received Xendit payout webhook",
    );

    const result = await this.webhookService.processXenditPayoutWebhook(
      callbackToken ?? "",
      payload,
    );

    return { result };
  }

  @Post("dev/simulate/:type")
  @Public()
  @SkipThrottle()
  async simulateXenditWebhook(@Param("type") type: string) {
    if (process.env.NODE_ENV === "production") {
      return { success: false, message: "Only available in development" };
    }

    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);

    try {
      let command = "npx ts-node simulate-xendit.ts payment";
      if (type === "payout") {
        command = "npx ts-node simulate-xendit.ts payout SUCCEEDED";
      }
      
      const { stdout, stderr } = await execAsync(command, { cwd: process.cwd() });
      this.logger.log(`Simulate Xendit executed: ${stdout}`);
      if (stderr) this.logger.warn(`Simulate Xendit stderr: ${stderr}`);
      
      return { success: true, stdout, stderr };
    } catch (error: any) {
      this.logger.error(`Simulate Xendit failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}
