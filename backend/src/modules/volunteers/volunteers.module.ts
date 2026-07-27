import { Module } from "@nestjs/common";
import { VolunteersController } from "./volunteers.controller";
import { VolunteerApplicationsController } from "./volunteer-applications.controller";
import { VolunteerActivitiesController } from "./volunteer-activities.controller";
import { VolunteersService } from "./volunteers.service";
import { VolunteerApplicationsService } from "./volunteer-applications.service";
import { VolunteerActivitiesService } from "./volunteer-activities.service";
import { VolunteersRepository } from "./volunteers.repository";
import { VolunteerApplicationsRepository } from "./volunteer-applications.repository";
import { VolunteerActivitiesRepository } from "./volunteer-activities.repository";
import { VolunteerAuthGuard } from "./volunteer-auth.guard";

@Module({
  controllers: [VolunteersController, VolunteerApplicationsController, VolunteerActivitiesController],
  providers: [
    VolunteersService,
    VolunteerApplicationsService,
    VolunteerActivitiesService,
    VolunteersRepository,
    VolunteerApplicationsRepository,
    VolunteerActivitiesRepository,
    VolunteerAuthGuard,
  ],
  exports: [VolunteersService],
})
export class VolunteersModule {}
