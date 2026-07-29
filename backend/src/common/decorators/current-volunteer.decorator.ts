import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import type { VolunteerSessionUser } from "../../../../shared/types/volunteer";

/** Param decorator: volunteer hasil VolunteerAuthGuard. */
export const CurrentVolunteer = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): VolunteerSessionUser | undefined => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return req.volunteer;
  },
);
