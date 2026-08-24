import { Module } from "@nestjs/common";
import { DonationsController } from "./donations.controller";
import { DonationsService } from "./donations.service";
import { DonationsRepository } from "./donations.repository";
import { JournalModule } from "../journal/journal.module";
import { AuditModule } from "../audit/audit.module";

@Module({
  imports: [JournalModule, AuditModule],
  controllers: [DonationsController],
  providers: [DonationsService, DonationsRepository],
  exports: [DonationsService, DonationsRepository],
})
export class DonationsModule {}
