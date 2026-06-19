import { Module } from "@nestjs/common";
import { LazController } from "./laz.controller";
import { LazService } from "./laz.service";
import { LazRepository } from "./laz.repository";

@Module({
  controllers: [LazController],
  providers: [LazService, LazRepository],
  exports: [LazService],
})
export class LazModule {}
