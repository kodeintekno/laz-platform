import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { PaymentsRepository } from "./payments.repository";
import { WebhookService } from "./webhook.service";
import { AuditModule } from "../audit/audit.module";
import { JournalModule } from "../journal/journal.module";

import { WithdrawalsModule } from "../withdrawals/withdrawals.module";

@Module({
  imports: [AuditModule, JournalModule, WithdrawalsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentsRepository, WebhookService],
  exports: [WebhookService],
})
export class PaymentsModule {}
