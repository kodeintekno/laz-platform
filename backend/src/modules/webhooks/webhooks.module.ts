import { Module } from "@nestjs/common";
import { WebhooksController } from "./webhooks.controller";
import { PaymentsModule } from "../payments/payments.module";

@Module({
  imports: [PaymentsModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
