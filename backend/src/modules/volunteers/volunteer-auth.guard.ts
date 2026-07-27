import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { VolunteersService } from "./volunteers.service";

/**
 * VolunteerAuthGuard — principal terpisah dari AuthGuard/User. Dipasang
 * manual per-route via @UseGuards(), TIDAK sebagai APP_GUARD global, supaya
 * seluruh alur staff (User/RBAC) sama sekali tidak tersentuh.
 */
@Injectable()
export class VolunteerAuthGuard implements CanActivate {
  constructor(private readonly volunteersService: VolunteersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const volunteerId = req.session?.volunteerId;

    if (!volunteerId) {
      throw new UnauthorizedException("Sesi relawan tidak valid atau telah berakhir");
    }

    const volunteer = await this.volunteersService.getById(volunteerId);
    if (!volunteer) {
      req.session.destroy(() => undefined);
      throw new UnauthorizedException("Sesi relawan tidak valid atau telah berakhir");
    }

    req.volunteer = volunteer;
    return true;
  }
}
