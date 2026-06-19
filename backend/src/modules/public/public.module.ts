import { Module } from "@nestjs/common";
import { PublicController } from "./public.controller";
import { ProgramsModule } from "../programs/programs.module";
import { AnalyticsModule } from "../analytics/analytics.module";

@Module({
  imports: [ProgramsModule, AnalyticsModule],
  controllers: [PublicController],
})
export class PublicModule {}
