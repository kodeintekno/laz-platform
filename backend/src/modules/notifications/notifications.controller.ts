import { Controller, Get, Param, Patch, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import type { RBACSessionUser } from "../../../../shared/types/rbac";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { VolunteerAuthGuard } from "../volunteers/volunteer-auth.guard";
import { NotificationsService } from "./notifications.service";

@Controller("api/notifications")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: RBACSessionUser, @Query("limit") limit?: string) {
    return this.notifications.list({ userId: user.id }, Number(limit) || 20);
  }

  @Patch("read-all")
  markAllRead(@CurrentUser() user: RBACSessionUser) {
    return this.notifications.markAllRead({ userId: user.id });
  }

  @Patch(":id/read")
  markRead(@Param("id") id: string, @CurrentUser() user: RBACSessionUser) {
    return this.notifications.markRead(id, { userId: user.id });
  }
}

@Public()
@UseGuards(VolunteerAuthGuard)
@Controller("api/volunteers/notifications")
export class VolunteerNotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@Req() req: Request, @Query("limit") limit?: string) {
    return this.notifications.list({ volunteerId: req.volunteer!.id }, Number(limit) || 20);
  }

  @Patch("read-all")
  markAllRead(@Req() req: Request) {
    return this.notifications.markAllRead({ volunteerId: req.volunteer!.id });
  }

  @Patch(":id/read")
  markRead(@Param("id") id: string, @Req() req: Request) {
    return this.notifications.markRead(id, { volunteerId: req.volunteer!.id });
  }
}
