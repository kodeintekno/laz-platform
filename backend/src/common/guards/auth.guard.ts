import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { AuthService } from "../../modules/auth/auth.service";

/**
 * AuthGuard (global) — memuat user + role + permissions FRESH dari DB
 * tiap request berdasarkan session.userId, lalu menempelkannya ke req.user.
 * Perubahan role / revoke session langsung efektif.
 *
 * @Public() — request anonim diizinkan lewat, tapi req.user tetap diisi
 * jika ada session valid (dipakai POST /api/donations/public).
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const userId = req.session?.userId;
    if (userId) {
      const user = await this.authService.getUserById(userId);
      if (user) {
        req.user = user;
      } else if (!isPublic) {
        // Session menunjuk user yang sudah dihapus — revoke
        req.session.destroy(() => undefined);
        throw new UnauthorizedException("Sesi tidak valid atau telah berakhir");
      }
    }

    if (isPublic) return true;

    if (!req.user) {
      throw new UnauthorizedException("Sesi tidak valid atau telah berakhir");
    }

    return true;
  }
}
