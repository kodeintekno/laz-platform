import { Module } from "@nestjs/common";
import { DistributionsController } from "./distributions.controller";
import { DistributionsService } from "./distributions.service";
import { DistributionsRepository } from "./distributions.repository";
import { AuditModule } from "../audit/audit.module";
import { JournalModule } from "../journal/journal.module";

@Module({
  imports: [AuditModule, JournalModule],
  controllers: [DistributionsController],
  providers: [DistributionsService, DistributionsRepository],
  exports: [DistributionsService],
})
export class DistributionsModule {}
