import { Module } from "@nestjs/common";
import { DistributionsController } from "./distributions.controller";
import { DistributionsService } from "./distributions.service";
import { DistributionsRepository } from "./distributions.repository";

@Module({
  controllers: [DistributionsController],
  providers: [DistributionsService, DistributionsRepository],
  exports: [DistributionsService],
})
export class DistributionsModule {}
