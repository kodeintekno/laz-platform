import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import { Throttle, SkipThrottle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "../audit/audit.types";
import { Public } from "../../common/decorators/public.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from "../../../../shared/validations/auth.schema";
import type { RBACSessionUser } from "../../../../shared/types/rbac";
import { getCsrf } from "../../config/csrf";

/** Rate limit ketat: 5 request / 15 menit / IP untuk login & register. */
const STRICT_THROTTLE = { default: { limit: 5, ttl: 15 * 60 * 1000 } };

@Controller("api/auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly auditService: AuditService,
  ) {}

  @Post("login")
  @Public()
  @Throttle(STRICT_THROTTLE)
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginInput,
    @Req() req: Request,
  ): Promise<RBACSessionUser> {
    const user = await this.authService.signIn(body);
    if (!user) {
      throw new UnauthorizedException("Email atau password salah");
    }

    await this.establishSession(req, user.id);

    await this.auditService.log({
      userId: user.id,
      action: AuditAction.LOGIN,
      entity: "User",
      entityId: user.id,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return user;
  }

  @Post("register")
  @Public()
  @Throttle(STRICT_THROTTLE)
  async register(
    @Body(new ZodValidationPipe(registerSchema)) body: RegisterInput,
    @Req() req: Request,
  ): Promise<RBACSessionUser> {
    await this.authService.register(body);

    // Auto login after successful registration (perilaku lama dipertahankan)
    const user = await this.authService.signIn({
      email: body.email,
      password: body.password,
    });
    if (!user) {
      throw new UnauthorizedException("Email atau password salah");
    }
    await this.establishSession(req, user.id);
    return user;
  }

  @Post("logout")
  async logout(
    @CurrentUser() user: RBACSessionUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auditService.log({
      userId: user.id,
      action: AuditAction.LOGOUT,
      entity: "User",
      entityId: user.id,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    await new Promise<void>((resolve, reject) =>
      req.session.destroy((err) => (err ? reject(err) : resolve())),
    );
    res.clearCookie("laz.sid");
    return { loggedOut: true };
  }

  @Get("me")
  me(@CurrentUser() user: RBACSessionUser): RBACSessionUser {
    return user;
  }

  @Get("csrf")
  @Public()
  @SkipThrottle()
  csrf(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { generateCsrfToken } = getCsrf();
    return { token: generateCsrfToken(req, res) };
  }

  /**
   * Regenerate session (anti session-fixation) lalu simpan userId.
   */
  private establishSession(req: Request, userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      req.session.regenerate((err) => {
        if (err) return reject(err);
        req.session.userId = userId;
        req.session.save((saveErr) => (saveErr ? reject(saveErr) : resolve()));
      });
    });
  }
}
