import { Global, Module } from "@nestjs/common";
import { AuditService } from "./audit.service";
import { AuditRepository } from "./audit.repository";
import { AuditController } from "./audit.controller";

/** Global: hampir semua modul menulis audit log. */
@Global()
@Module({
  controllers: [AuditController],
  providers: [AuditService, AuditRepository],
  exports: [AuditService],
})
export class AuditModule {}
