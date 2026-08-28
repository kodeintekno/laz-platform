import { Module } from "@nestjs/common";
import { AmilService } from "./amil.service";
import { AmilController } from "./amil.controller";
import { AuditModule } from "../audit/audit.module";

@Module({
  imports: [AuditModule],
  providers: [AmilService],
  controllers: [AmilController],
  exports: [AmilService],
})
export class AmilModule {}
