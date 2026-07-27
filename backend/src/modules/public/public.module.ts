import { Module } from "@nestjs/common";
import { PublicController } from "./public.controller";
import { ProgramsModule } from "../programs/programs.module";
import { AnalyticsModule } from "../analytics/analytics.module";
import { LembagaModule } from "../lembaga/lembaga.module";

@Module({
  imports: [ProgramsModule, AnalyticsModule, LembagaModule],
  controllers: [PublicController],
})
export class PublicModule {}
