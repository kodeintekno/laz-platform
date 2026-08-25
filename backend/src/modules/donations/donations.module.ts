import { Module } from "@nestjs/common";
import { DonationsController } from "./donations.controller";
import { DonationsService } from "./donations.service";
import { DonationsRepository } from "./donations.repository";
import { JournalModule } from "../journal/journal.module";
import { AuditModule } from "../audit/audit.module";
import { AmilModule } from "../amil/amil.module";

@Module({
  imports: [JournalModule, AuditModule, AmilModule],
  controllers: [DonationsController],
  providers: [DonationsService, DonationsRepository],
  exports: [DonationsService, DonationsRepository],
})
export class DonationsModule {}
