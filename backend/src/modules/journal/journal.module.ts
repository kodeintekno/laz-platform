import { Module } from "@nestjs/common";
import { JournalController } from "./journal.controller";
import { JournalService } from "./journal.service";
import { JournalRepository } from "./journal.repository";
import { AutoJournalService } from "./auto-journal.service";

@Module({
  controllers: [JournalController],
  providers: [JournalService, JournalRepository, AutoJournalService],
  exports: [JournalService, AutoJournalService],
})
export class JournalModule {}
