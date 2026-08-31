import { Global, Module } from "@nestjs/common";
import { NotificationsController, VolunteerNotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { VolunteersModule } from "../volunteers/volunteers.module";

@Global()
@Module({
  imports: [VolunteersModule],
  controllers: [NotificationsController, VolunteerNotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
