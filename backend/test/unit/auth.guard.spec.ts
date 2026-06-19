import { describe, it, expect, beforeEach, vi } from "vitest";
import { UnauthorizedException } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "../../src/common/guards/auth.guard";

function makeContext(opts: {
  userId?: string;
  isPublic?: boolean;
}): ExecutionContext {
  const destroy = vi.fn((cb?: () => void) => cb?.());
  const req: any = {
    session: { userId: opts.userId, destroy },
    user: undefined,
  };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => ({}),
    getClass: () => ({}),
    _req: req,
  } as any;
}

describe("AuthGuard", () => {
  let guard: AuthGuard;
  let reflector: Reflector;
  let authService: { getUserById: ReturnType<typeof vi.fn> };

  const SESSION_USER = {
    id: "user-1",
    email: "user@example.com",
    name: "User",
    roleName: "DONATUR",
    permissions: [],
    lazId: "laz-1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    reflector = new Reflector();
    authService = { getUserById: vi.fn() };
    guard = new AuthGuard(reflector, authService as any);
  });

  it("allows @Public() route with no session (unauthenticated)", async () => {
    vi.spyOn(reflector, "getAllAndOverride").mockReturnValue(true);
    const ctx = makeContext({});

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
  });

  it("throws UnauthorizedException for protected route with no session", async () => {
    vi.spyOn(reflector, "getAllAndOverride").mockReturnValue(false);
    const ctx = makeContext({});

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("attaches user to req and returns true for valid session on protected route", async () => {
    vi.spyOn(reflector, "getAllAndOverride").mockReturnValue(false);
    authService.getUserById.mockResolvedValue(SESSION_USER);
    const ctx = makeContext({ userId: "user-1" });

    const result = await guard.canActivate(ctx);
    const req = ctx.switchToHttp().getRequest();

    expect(result).toBe(true);
    expect(req.user).toEqual(SESSION_USER);
    expect(authService.getUserById).toHaveBeenCalledWith("user-1");
  });

  it("attaches user to req even on @Public() route when session is valid", async () => {
    vi.spyOn(reflector, "getAllAndOverride").mockReturnValue(true);
    authService.getUserById.mockResolvedValue(SESSION_USER);
    const ctx = makeContext({ userId: "user-1" });

    await guard.canActivate(ctx);
    const req = ctx.switchToHttp().getRequest();

    expect(req.user).toEqual(SESSION_USER);
  });

  it("destroys session and throws UnauthorizedException for stale session on protected route", async () => {
    vi.spyOn(reflector, "getAllAndOverride").mockReturnValue(false);
    authService.getUserById.mockResolvedValue(null); // user deleted
    const ctx = makeContext({ userId: "deleted-user" });
    const req = ctx.switchToHttp().getRequest();

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(req.session.destroy).toHaveBeenCalled();
  });

  it("allows @Public() route even when session user is not found (stale session)", async () => {
    vi.spyOn(reflector, "getAllAndOverride").mockReturnValue(true);
    authService.getUserById.mockResolvedValue(null);
    const ctx = makeContext({ userId: "deleted-user" });

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
  });
});
