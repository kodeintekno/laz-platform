import { Module } from "@nestjs/common";
import { LembagaController } from "./lembaga.controller";
import { LembagaService } from "./lembaga.service";
import { LembagaRepository } from "./lembaga.repository";
import { UploadModule } from "../../lib/upload/upload.module";
import { CoaModule } from "../coa/coa.module";

@Module({
  imports: [UploadModule, CoaModule],
  controllers: [LembagaController],
  providers: [LembagaService, LembagaRepository],
  exports: [LembagaService],
})
export class LembagaModule {}
