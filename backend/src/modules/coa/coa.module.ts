import { Module } from "@nestjs/common";
import { CoaController } from "./coa.controller";
import { CoaService } from "./coa.service";
import { CoaRepository } from "./coa.repository";

@Module({
  controllers: [CoaController],
  providers: [CoaService, CoaRepository],
  exports: [CoaService],
})
export class CoaModule {}
