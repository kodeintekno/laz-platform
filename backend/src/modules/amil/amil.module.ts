import { Module } from "@nestjs/common";
import { AmilService } from "./amil.service";
import { AmilController } from "./amil.controller";

@Module({
  providers: [AmilService],
  controllers: [AmilController],
  exports: [AmilService],
})
export class AmilModule {}
