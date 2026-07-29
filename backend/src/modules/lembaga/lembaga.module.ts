import { Module } from "@nestjs/common";
import { LembagaController } from "./lembaga.controller";
import { LembagaService } from "./lembaga.service";
import { LembagaRepository } from "./lembaga.repository";
import { UploadModule } from "../../lib/upload/upload.module";

@Module({
  imports: [UploadModule],
  controllers: [LembagaController],
  providers: [LembagaService, LembagaRepository],
  exports: [LembagaService],
})
export class LembagaModule {}
