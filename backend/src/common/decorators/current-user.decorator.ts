import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import type { RBACSessionUser } from "../../../../shared/types/rbac";

/** Param decorator: user hasil AuthGuard. Undefined hanya pada route @Public(). */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RBACSessionUser | undefined => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return req.user;
  },
);
