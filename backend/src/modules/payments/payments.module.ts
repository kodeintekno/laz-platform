import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { PaymentsRepository } from "./payments.repository";
import { WebhookService } from "./webhook.service";

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentsRepository, WebhookService],
  exports: [WebhookService],
})
export class PaymentsModule {}
