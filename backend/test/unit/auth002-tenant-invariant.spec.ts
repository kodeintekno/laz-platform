import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "../../src/common/guards/auth.guard";
import { resolveLembagaScope } from "../../src/common/utils/lembaga-scope";
import { AuthService } from "../../src/modules/auth/auth.service";
import { UserRepository } from "../../src/modules/auth/user.repository";
import { UsersController } from "../../src/modules/users/users.controller";
import { UsersRepository } from "../../src/modules/users/users.repository";
import { UsersService } from "../../src/modules/users/users.service";
import { DonationsController } from "../../src/modules/donations/donations.controller";
import { PaymentsController } from "../../src/modules/payments/payments.controller";
import { ReportsController } from "../../src/modules/reports/reports.controller";
import { AnalyticsController } from "../../src/modules/analytics/analytics.controller";
import { ProgramsService } from "../../src/modules/programs/programs.service";
import { AmilService } from "../../src/modules/amil/amil.service";
import { WithdrawalsController } from "../../src/modules/withdrawals/withdrawals.controller";
import { WithdrawalsService } from "../../src/modules/withdrawals/withdrawals.service";
import { WithdrawalsRepository } from "../../src/modules/withdrawals/withdrawals.repository";
import { revokeUserSessions } from "../../src/config/session";

vi.mock("bcryptjs", () => ({ default: {
  hash: vi.fn(async () => "test-hash"), compare: vi.fn(async () => true),
} }));
vi.mock("../../src/config/session", () => ({ revokeUserSessions: vi.fn(async () => undefined) }));

const superAdmin: any = { id: "super", roleName: "SUPER_ADMIN", lembagaId: null, permissions: [] };
const staff: any = { id: "staff", roleName: "LEMBAGA_ADMIN", lembagaId: "tenant-a", permissions: [] };
const orphan: any = { ...staff, lembagaId: null };
const userInput: any = {
  name: "Staff", email: "staff@example.test", password: "known-password", confirmPassword: "known-password",
  roleId: "tenant-role", status: "ACTIVE",
};

function project(row: any, select: any): any {
  if (!row || !select) return row;
  return Object.fromEntries(Object.entries(select).map(([key, value]: any) =>
    [key, value === true ? row[key] : project(row[key], value.select)]));
}

// Real management/authentication repositories over synthetic persisted state.
function usersHarness(roleName = "FINANCE_PLATFORM", lembagaId: string | null = null) {
  const roles: any = {
    "finance-role": { id: "finance-role", name: "FINANCE_PLATFORM", rolePermissions: [] },
    "tenant-role": { id: "tenant-role", name: "LEMBAGA_ADMIN", rolePermissions: [] },
    "custom-role": { id: "custom-role", name: "CUSTOM_STAFF", rolePermissions: [] },
  };
  const initialRole = Object.values(roles).find((role: any) => role.name === roleName) as any;
  const rows: any = { target: {
    id: "target", name: "Staff", email: userInput.email, password: "test-hash", status: "ACTIVE",
    roleId: initialRole.id, role: initialRole, lembagaId,
    lembaga: lembagaId ? { status: "APPROVED" } : null, withdrawalApprovalLimit: 100000,
  } };
  const mutate = vi.fn(async ({ where, data, select }: any) => {
    const id = where?.id ?? "new-staff";
    rows[id] = { ...rows[id], id, ...data, role: roles[data.roleId],
      lembaga: data.lembagaId ? { status: "APPROVED" } : null };
    return project(rows[id], select);
  });
  const prisma: any = {
    user: {
      findUnique: vi.fn(async ({ where, select }: any) => project(
        where.id ? rows[where.id] : Object.values(rows).find((row: any) => row.email === where.email), select)),
      create: mutate, update: mutate, count: vi.fn(async () => 2),
    },
    role: { findUnique: vi.fn(async ({ where }: any) => roles[where.id]) },
  };
  const audit = { log: vi.fn(async () => undefined) };
  const service = new UsersService(new UsersRepository(prisma), audit as any);
  const controller = new UsersController(service);
  const auth = new AuthService(new UserRepository(prisma), new ConfigService());
  return { rows, prisma, audit, service, controller, auth };
}

function guardedRequest(auth: AuthService, userId: string) {
  const req: any = { session: { userId, destroy: vi.fn() } };
  const context: any = {
    getHandler: () => function protectedFinancialAction() {}, getClass: () => UsersController,
    switchToHttp: () => ({ getRequest: () => req }),
  };
  return { req, context, guard: new AuthGuard(new Reflector(), auth) };
}

beforeEach(() => vi.clearAllMocks());

describe("AUTH-002 role and tenant lifecycle", () => {
  it("rejects role-only platform demotion before persistence, audit or session side effects", async () => {
    const h = usersHarness();
    await expect(h.controller.changeRole("target", { roleId: "tenant-role" }, superAdmin))
      .rejects.toMatchObject({ code: "LEMBAGA_REQUIRED", status: 422 });
    expect(h.rows.target).toMatchObject({ roleId: "finance-role", lembagaId: null });
    expect(h.prisma.user.update).not.toHaveBeenCalled();
    expect(h.audit.log).not.toHaveBeenCalled();
    expect(revokeUserSessions).not.toHaveBeenCalled();
  });

  it.each([undefined, null, "", "   "])("rejects full platform demotion with missing/invalid tenant %s", async (lembagaId) => {
    const h = usersHarness();
    await expect(h.controller.update("target", { ...userInput, password: "", lembagaId }, superAdmin))
      .rejects.toMatchObject({ code: "LEMBAGA_REQUIRED" });
    expect(h.prisma.user.update).not.toHaveBeenCalled();
    expect(h.rows.target).toMatchObject({ roleId: "finance-role", lembagaId: null });
  });

  it("atomically demotes with an explicit tenant and preserves scoped fresh authentication", async () => {
    const h = usersHarness();
    await h.controller.update("target", { ...userInput, password: "", lembagaId: "tenant-a" }, superAdmin);
    expect(h.prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ roleId: "tenant-role", lembagaId: "tenant-a", withdrawalApprovalLimit: 0 }),
    }));
    expect(revokeUserSessions).toHaveBeenCalledWith("target");
    const principal = await h.auth.signIn({ email: userInput.email, password: "known-password" });
    expect(principal).toMatchObject({ roleName: "LEMBAGA_ADMIN", lembagaId: "tenant-a" });
    expect(resolveLembagaScope(principal!, "tenant-b")).toBe("tenant-a");
  });

  it.each(["role-only", "full"])("%s promotion clears tenant in the same role write", async (api) => {
    const h = usersHarness("LEMBAGA_ADMIN", "tenant-a");
    if (api === "role-only") await h.controller.changeRole("target", { roleId: "finance-role" }, superAdmin);
    else await h.controller.update("target", { ...userInput, password: "", roleId: "finance-role" }, superAdmin);
    expect(h.prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ roleId: "finance-role", lembagaId: null, withdrawalApprovalLimit: 0 }),
    }));
    expect(await h.auth.getUserById("target")).toMatchObject({ roleName: "FINANCE_PLATFORM", lembagaId: null });
  });

  it("retains tenant for a legitimate tenant-role change", async () => {
    const h = usersHarness("LEMBAGA_ADMIN", "tenant-a");
    await h.controller.changeRole("target", { roleId: "custom-role" }, staff);
    expect(h.rows.target).toMatchObject({ roleId: "custom-role", lembagaId: "tenant-a" });
    expect(await h.auth.getUserById("target")).toMatchObject({ lembagaId: "tenant-a" });
  });

  it("rejects an unchanged orphaned tenant role rather than treating it as valid", async () => {
    const h = usersHarness("LEMBAGA_ADMIN");
    await expect(h.controller.changeRole("target", { roleId: "tenant-role" }, superAdmin))
      .rejects.toMatchObject({ code: "LEMBAGA_REQUIRED" });
    expect(h.prisma.user.update).not.toHaveBeenCalled();
  });

  it("revokes sessions when Super Admin changes only the assigned tenant", async () => {
    const h = usersHarness("LEMBAGA_ADMIN", "tenant-a");
    await h.controller.update("target", { ...userInput, password: "", lembagaId: "tenant-b" }, superAdmin);
    expect(h.rows.target.lembagaId).toBe("tenant-b");
    expect(revokeUserSessions).toHaveBeenCalledWith("target");
  });
});

describe("AUTH-002 malformed principals and financial reads", () => {
  it.each(["LEMBAGA_ADMIN", "CUSTOM_STAFF"])("rejects tenantless %s at login and fresh session lookup", async (roleName) => {
    const h = usersHarness(roleName);
    await expect(h.auth.signIn({ email: userInput.email, password: "known-password" }))
      .rejects.toMatchObject({ code: "LEMBAGA_UNAVAILABLE", status: 403 });
    expect(await h.auth.getUserById("target")).toBeNull();
  });

  it("rejects a tenantless account without a role", async () => {
    const h = usersHarness();
    h.rows.target.role = null;
    expect(await h.auth.getUserById("target")).toBeNull();
    await expect(h.auth.signIn({ email: userInput.email, password: "known-password" })).rejects.toMatchObject({ status: 403 });
  });

  it("destroys an existing finance session when its fresh role becomes tenantless staff", async () => {
    const h = usersHarness();
    const first = guardedRequest(h.auth, "target");
    await expect(first.guard.canActivate(first.context)).resolves.toBe(true);
    h.rows.target.role = { name: "LEMBAGA_ADMIN", rolePermissions: [] };
    h.rows.target.roleId = "tenant-role";
    const next = guardedRequest(h.auth, "target");
    await expect(next.guard.canActivate(next.context)).rejects.toMatchObject({ status: 401 });
    expect(next.req.user).toBeUndefined();
    expect(next.req.session.destroy).toHaveBeenCalledOnce();
  });

  it.each([null, undefined, "", "   "])("fails closed for missing scope %s even with a foreign query or platform-read grant", (lembagaId) => {
    for (const permissions of [[], ["platform_finance.read"]]) {
      expect(() => resolveLembagaScope({ ...orphan, lembagaId, permissions }, "tenant-b"))
        .toThrow("Lembaga pengguna tidak ditemukan");
    }
  });

  it("blocks financial controller calls before any unscoped service query", async () => {
    const services: any = {
      getDashboardDonations: vi.fn(), getPayments: vi.fn(), getSummaryStats: vi.fn(),
      getDonationTrend: vi.fn(), getTopPrograms: vi.fn(), getDashboardOverview: vi.fn(),
    };
    const reports = new ReportsController(services);
    for (const call of [
      () => new DonationsController(services).list(orphan, undefined, undefined, undefined, "tenant-b"),
      () => new PaymentsController(services).list(orphan, undefined, undefined, undefined, "tenant-b"),
      () => reports.summary(orphan, "tenant-b"),
      () => reports.donationTrend(orphan, "tenant-b", "monthly", "program-b"),
      () => reports.topPrograms(orphan, "tenant-b"),
      () => new AnalyticsController(services).overview(orphan, "tenant-b"),
    ]) await expect(call()).rejects.toMatchObject({ status: 403 });
    Object.values(services).forEach((query) => expect(query).not.toHaveBeenCalled());
  });

  it("preserves scoped tenant reports and explicitly authorized platform reads", async () => {
    const service: any = { getSummaryStats: vi.fn(async () => ({})) };
    const controller = new ReportsController(service);
    await controller.summary(staff, "tenant-b");
    expect(service.getSummaryStats).toHaveBeenLastCalledWith("tenant-a");
    await controller.summary({ ...superAdmin, roleName: "FINANCE_PLATFORM", permissions: ["platform_finance.read"] });
    expect(service.getSummaryStats).toHaveBeenLastCalledWith(undefined);
    await controller.summary(superAdmin, "tenant-b");
    expect(service.getSummaryStats).toHaveBeenLastCalledWith("tenant-b");
    // Custom tenant-bound roles may still have an explicit platform-read grant.
    expect(resolveLembagaScope({ ...staff, roleName: "CUSTOM_STAFF", permissions: ["platform_finance.read"] }, "tenant-b"))
      .toBe("tenant-b");
  });
});

describe("AUTH-002 staff provisioning and financial mutation", () => {
  it("ignores a tenant admin's foreign body tenant during legitimate staff creation", async () => {
    const h = usersHarness();
    await h.controller.create({ ...userInput, email: "new@example.test", lembagaId: "tenant-b" }, staff);
    expect(h.rows["new-staff"].lembagaId).toBe("tenant-a");
  });

  it("prevents orphaned staff provisioning and the downstream foreign balance reservation", async () => {
    const h = usersHarness("LEMBAGA_ADMIN");
    await expect(h.controller.create({ ...userInput, email: "new@example.test", lembagaId: "tenant-b" }, orphan))
      .rejects.toMatchObject({ code: "LEMBAGA_REQUIRED" });
    expect(h.prisma.user.create).not.toHaveBeenCalled();
    expect(h.rows["new-staff"]).toBeUndefined();

    const tx: any = {
      programBalance: { update: vi.fn() }, institutionBalance: { update: vi.fn() }, withdrawal: { create: vi.fn() },
    };
    const db: any = { $transaction: vi.fn(async (run: any) => run(tx)) };
    const withdrawals = new WithdrawalsController(new WithdrawalsService(
      db, new WithdrawalsRepository(db, {} as any), {} as any,
    ));
    const request = guardedRequest(h.auth, "new-staff");
    await expect((async () => {
      await request.guard.canActivate(request.context);
      return withdrawals.createWithdrawal(request.req, { amount: 50000, programId: "program-b" });
    })()).rejects.toMatchObject({ status: 401 });
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(tx.programBalance.update).not.toHaveBeenCalled();
    expect(tx.institutionBalance.update).not.toHaveBeenCalled();
    expect(tx.withdrawal.create).not.toHaveBeenCalled();
  });

  it.each(["update", "delete"])("denies orphaned or foreign program %s without financial writes", async (operation) => {
    const row: any = { id: "program-b", lembagaId: "tenant-b", status: "DRAFT", amilInstitutionPercentage: 5 };
    const repository: any = { findById: vi.fn(async () => row), delete: vi.fn() };
    const prisma: any = {
      user: { findUnique: vi.fn(async () => ({ lembagaId: null })) },
      program: { findUnique: vi.fn(async () => row) }, $transaction: vi.fn(),
    };
    const service = new ProgramsService(repository, { log: vi.fn() } as any, prisma, {} as any);
    for (const actor of [orphan, staff]) {
      const result = operation === "update"
        ? service.updateProgram(row.id, { status: "DRAFT", institutionPercentage: 10 } as any, actor)
        : service.deleteProgram(row.id, actor);
      await expect(result).rejects.toMatchObject({ code: "FORBIDDEN_PROGRAM", status: 403 });
    }
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(repository.delete).not.toHaveBeenCalled();
    expect(row.amilInstitutionPercentage).toBe(5);
  });

  it.each([staff, superAdmin])("preserves program updates for an owner or explicitly authorized platform admin", async (actor) => {
    const row: any = {
      id: "program-a", lembagaId: "tenant-a", status: "DRAFT", category: "ZAKAT", imageUrl: null,
      amilPlatformPercentage: 5, amilInstitutionPercentage: 5, amilMaxTotalPercentage: 12.5,
      amilLockedAt: null, requestedAmilPlatformPercentage: null,
    };
    const tx: any = { program: {
      updateMany: vi.fn(async ({ data }: any) => { Object.assign(row, data); return { count: 1 }; }),
      findUniqueOrThrow: vi.fn(async () => row),
    } };
    const prisma: any = {
      user: { findUnique: vi.fn(async () => ({ lembagaId: actor.lembagaId })) },
      program: { findUnique: vi.fn(async () => ({ ...row })) }, $transaction: vi.fn(async (run: any) => run(tx)),
    };
    const service = new ProgramsService({} as any, { log: vi.fn() } as any, prisma, Object.create(AmilService.prototype));
    await service.updateProgram(row.id, { title: "Updated", status: "DRAFT", category: "ZAKAT", institutionPercentage: 7 } as any, actor);
    expect(row.amilInstitutionPercentage).toBe(7);
    expect(tx.program.updateMany).toHaveBeenCalledOnce();
  });
});
