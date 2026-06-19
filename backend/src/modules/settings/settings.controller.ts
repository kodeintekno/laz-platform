import { BadRequestException, Body, Controller, Patch, Post, Put, Req } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import { SettingsService } from "./settings.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import {
  changePasswordSchema,
  updateNotificationsSchema,
  updateProfileSchema,
  type ChangePasswordInput,
  type UpdateNotificationsInput,
  type UpdateProfileInput,
} from "../../../../shared/validations/settings.schema";
import type { RBACSessionUser } from "../../../../shared/types/rbac";

@Controller("api/settings")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Patch("profile")
  async updateProfile(
    @Body(new ZodValidationPipe(updateProfileSchema)) body: UpdateProfileInput,
    @CurrentUser() user: RBACSessionUser,
  ) {
    return this.settingsService.updateProfile(user.id, body);
  }

  @Post("password")
  @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } })
  async changePassword(
    @Body(new ZodValidationPipe(changePasswordSchema)) body: ChangePasswordInput,
    @CurrentUser() user: RBACSessionUser,
    @Req() req: Request,
  ) {
    return this.settingsService.changePassword(user.id, body, req.session.id);
  }

  @Patch("notifications")
  async updateNotifications(
    @Body(new ZodValidationPipe(updateNotificationsSchema)) body: UpdateNotificationsInput,
    @CurrentUser() user: RBACSessionUser,
  ) {
    return this.settingsService.updateNotifications(user.id, body);
  }

  @Put("avatar")
  async updateAvatar(
    @Body() body: { url?: string; publicId?: string },
    @CurrentUser() user: RBACSessionUser,
  ) {
    if (!body?.url || !body?.publicId) {
      throw new BadRequestException("URL atau publicId foto profil tidak ditemukan.");
    }
    return this.settingsService.updateAvatar(user.id, body.url, body.publicId);
  }
}
