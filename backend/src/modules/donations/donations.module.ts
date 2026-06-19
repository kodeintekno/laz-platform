import { Module } from "@nestjs/common";
import { DonationsController } from "./donations.controller";
import { DonationsService } from "./donations.service";
import { DonationsRepository } from "./donations.repository";

@Module({
  controllers: [DonationsController],
  providers: [DonationsService, DonationsRepository],
  exports: [DonationsService, DonationsRepository],
})
export class DonationsModule {}
