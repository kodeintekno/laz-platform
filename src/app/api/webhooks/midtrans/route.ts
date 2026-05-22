import { NextResponse } from "next/server";
import { webhookService } from "@/features/payments/services/webhook.service";
import { logger } from "@/lib/logger";

/**
 * Handle incoming POST requests from Midtrans Webhook.
 * 
 * Must return 200 OK so Midtrans knows it was received, even if the processing
 * fails due to idempotency or invalid signatures (so they stop retrying).
 */
export async function POST(req: Request) {
  try {
    const payload = await req.json();
    logger.info({ order_id: payload.order_id, status: payload.transaction_status }, "Received Midtrans Webhook");

    const result = await webhookService.processMidtransWebhook(payload);

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    logger.error({ error: error.message }, "Midtrans Webhook Error");
    
    // Return 200 even on error to stop Midtrans from retrying indefinitely on bad payloads
    // Alternatively, you could return 400 for bad signatures if you want to be strict.
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
