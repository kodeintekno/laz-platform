import { describe, expect, it, vi } from "vitest";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { AuthService } from "../../src/modules/auth/auth.service";
import { AuthGuard } from "../../src/common/guards/auth.guard";

vi.mock("bcryptjs", () => ({ default: { compare: vi.fn(async () => true) } }));

function setup(roleName = "LEMBAGA_ADMIN") {
  const user: any = {
    id: "staff", email: "staff@example.test", name: "Staff", password: "hash", status: "ACTIVE",
    lembagaId: "tenant", lembaga: { name: "Tenant", status: "APPROVED", rejectionReason: null },
    role: { name: roleName, rolePermissions: [{ permission: { key: "programs.update" } }] },
  };
  const repository = {
    findById: vi.fn(async () => user), findByEmail: vi.fn(async () => user),
    updateLastLogin: vi.fn(async () => undefined),
  };
  const service = new AuthService(repository as any, new ConfigService());
  const reflector = new Reflector();
  const isPublic = vi.spyOn(reflector, "getAllAndOverride").mockReturnValue(false);
  const guard = new AuthGuard(reflector, service);
  function request(session: any = { userId: user.id, destroy: vi.fn() }) {
    const req: any = { session };
    const context: any = {
      getHandler: () => function handler() {}, getClass: () => AuthGuard,
      switchToHttp: () => ({ getRequest: () => req }),
    };
    return { req, context };
  }
  return { user, repository, service, guard, isPublic, request };
}

describe("Lembaga approval eligibility for staff sessions", () => {
  it.each(["PENDING", "REJECTED"])("blocks an existing session on its next request after becoming %s", async (status) => {
    const h = setup();
    const first = h.request();
    await expect(h.guard.canActivate(first.context)).resolves.toBe(true);
    expect(first.req.user.id).toBe("staff");
    h.user.lembaga.status = status;
    const next = h.request(first.req.session);
    const protectedWrite = vi.fn();
    await expect((async () => {
      await h.guard.canActivate(next.context);
      protectedWrite();
    })()).rejects.toMatchObject({ status: 401 });
    expect(next.req.user).toBeUndefined();
    expect(next.req.session.destroy).toHaveBeenCalledOnce();
    expect(protectedWrite).not.toHaveBeenCalled();
    expect(h.repository.findById).toHaveBeenCalledTimes(2);
  });

  it.each(["LEMBAGA_ADMIN", "CUSTOM_STAFF", "SUPER_ADMIN"])("gates tenant-bound %s in both login and session resolution", async (roleName) => {
    const h = setup(roleName);
    for (const status of ["PENDING", "REJECTED"]) {
      h.user.lembaga.status = status;
      await expect(h.service.getUserById("staff")).resolves.toBeNull();
      await expect(h.service.signIn({ email: h.user.email, password: "valid-password" }))
        .rejects.toMatchObject({ code: `LEMBAGA_${status}`, status: 403 });
    }
    expect(h.repository.updateLastLogin).not.toHaveBeenCalled();
  });

  it("fails closed for a tenant ID whose relation is missing", async () => {
    const h = setup();
    h.user.lembaga = null;
    await expect(h.service.getUserById("staff")).resolves.toBeNull();
    await expect(h.service.signIn({ email: h.user.email, password: "valid-password" }))
      .rejects.toMatchObject({ status: 403 });
  });

  it.each(["SUPER_ADMIN", "FINANCE_PLATFORM"])("preserves platform %s without a Lembaga", async (roleName) => {
    const h = setup(roleName);
    h.user.lembagaId = null;
    h.user.lembaga = null;
    await expect(h.service.getUserById("staff")).resolves.toMatchObject({ roleName });
    await expect(h.service.signIn({ email: h.user.email, password: "valid-password" })).resolves.toMatchObject({ roleName });
  });

  it("allows approved custom staff and a fresh login after reapproval", async () => {
    const h = setup("CUSTOM_STAFF");
    await expect(h.service.getUserById("staff")).resolves.toMatchObject({ permissions: ["programs.update"] });
    h.user.lembaga.status = "REJECTED";
    await expect(h.service.getUserById("staff")).resolves.toBeNull();
    h.user.lembaga.status = "APPROVED";
    await expect(h.service.signIn({ email: h.user.email, password: "valid-password" })).resolves.toMatchObject({ id: "staff" });
  });

  it("keeps public access anonymous without disrupting a volunteer session", async () => {
    const h = setup();
    h.user.lembaga.status = "REJECTED";
    h.isPublic.mockReturnValue(true);
    const session = { userId: "staff", volunteerId: "volunteer", destroy: vi.fn() };
    const { req, context } = h.request(session);
    await expect(h.guard.canActivate(context)).resolves.toBe(true);
    expect(req.user).toBeUndefined();
    expect(req.session.volunteerId).toBe("volunteer");
    expect(session.destroy).not.toHaveBeenCalled();
  });
});
