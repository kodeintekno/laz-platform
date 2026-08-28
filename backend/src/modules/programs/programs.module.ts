import { Module } from "@nestjs/common";
import { ProgramsController } from "./programs.controller";
import { ProgramsService } from "./programs.service";
import { ProgramsRepository } from "./programs.repository";
import { AmilModule } from "../amil/amil.module";

@Module({
  imports: [AmilModule],
  controllers: [ProgramsController],
  providers: [ProgramsService, ProgramsRepository],
  exports: [ProgramsService],
})
export class ProgramsModule {}
