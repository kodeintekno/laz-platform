import { describe, expect, it, vi } from "vitest";
import { PERMISSIONS } from "../../../shared/constants/permissions";
import type { RBACSessionUser } from "../../../shared/types/rbac";
import { JournalController } from "../../src/modules/journal/journal.controller";
import { JournalRepository } from "../../src/modules/journal/journal.repository";
import { JournalService } from "../../src/modules/journal/journal.service";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "../../src/common/guards/auth.guard";
import { PermissionsGuard } from "../../src/common/guards/permissions.guard";
import { journalSchema } from "../../../shared/validations/journal.schema";

const input = {
  journalDate: "2026-10-08", description: "Manual journal",
  details: [
    { accountId: "bank", debit: 100, credit: 0 },
    { accountId: "revenue", debit: 0, credit: 100 },
  ],
};
const actor = (permissions: RBACSessionUser["permissions"]): RBACSessionUser => ({
  id: "staff", email: "staff@example.com", roleName: "LEMBAGA_ADMIN", lembagaId: "tenant", permissions,
});

function setup() {
  const prisma: any = {
    chartOfAccount: { findMany: vi.fn(async () => input.details.map(({ accountId }) => ({
      id: accountId, code: accountId, lembagaId: "tenant", isActive: true, isHeader: false,
    }))) },
    accountingBook: { findUnique: vi.fn(async () => ({ id: "book" })) },
    journal: { create: vi.fn(async ({ data }: any) => ({ id: "journal", ...data })) },
    $transaction: vi.fn(async (work: any) => work(prisma)),
  };
  const audit = { log: vi.fn() };
  const generateJournalNo = vi.fn(async () => "JU-202610-000001");
  const service = new JournalService(new JournalRepository(prisma), prisma, audit as any, {
    generateJournalNo,
  } as any);
  return { prisma, audit, generateJournalNo, service, controller: new JournalController(service) };
}

describe("manual journal posting permission (FR-01)", () => {
  it("rejects a create-only account before any posting or success audit", async () => {
    const ctx = setup();
    await expect(ctx.controller.createJournal(input, actor([PERMISSIONS.JOURNAL_CREATE])))
      .rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });
    expect(ctx.prisma.journal.create).not.toHaveBeenCalled();
    expect(ctx.audit.log).not.toHaveBeenCalled();
    expect(ctx.prisma.chartOfAccount.findMany).not.toHaveBeenCalled();
    expect(ctx.generateJournalNo).not.toHaveBeenCalled();
  });

  it.each([
    actor([PERMISSIONS.JOURNAL_CREATE]),
    actor([PERMISSIONS.JOURNAL_POST]),
    actor([]),
    undefined,
    "staff",
  ])("rejects direct service callers without both permissions: %j", async (caller) => {
    const ctx = setup();
    await expect(ctx.service.createJournal("tenant", input, caller as RBACSessionUser))
      .rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });
    expect(ctx.prisma.chartOfAccount.findMany).not.toHaveBeenCalled();
    expect(ctx.generateJournalNo).not.toHaveBeenCalled();
    expect(ctx.prisma.journal.create).not.toHaveBeenCalled();
    expect(ctx.audit.log).not.toHaveBeenCalled();
  });

  it("honors posting permission revocation on the next request in the same session", async () => {
    const ctx = setup();
    let currentUser = actor([PERMISSIONS.JOURNAL_CREATE, PERMISSIONS.JOURNAL_POST]);
    const auth = { getUserById: vi.fn(async () => currentUser) };
    const reflector = new Reflector();
    const authGuard = new AuthGuard(reflector, auth as any);
    const permissionsGuard = new PermissionsGuard(reflector);
    const req: any = { session: { userId: "staff" } };
    const executionContext: any = {
      getHandler: () => JournalController.prototype.createJournal,
      getClass: () => JournalController,
      switchToHttp: () => ({ getRequest: () => req }),
    };
    const request = async () => {
      await authGuard.canActivate(executionContext);
      permissionsGuard.canActivate(executionContext);
      return ctx.controller.createJournal(input, req.user);
    };
    await expect(request()).resolves.toMatchObject({ data: { status: "POSTED" } });
    currentUser = actor([PERMISSIONS.JOURNAL_CREATE]);
    await expect(request()).rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });
    expect(auth.getUserById).toHaveBeenCalledTimes(2);
    expect(ctx.prisma.journal.create).toHaveBeenCalledTimes(1);
    expect(ctx.generateJournalNo).toHaveBeenCalledTimes(1);
    expect(ctx.audit.log).toHaveBeenCalledTimes(1);
  });

  it("does not accept posting authority from request fields", async () => {
    const ctx = setup();
    const parsed = journalSchema.parse({
      ...input, status: "POSTED", permissions: [PERMISSIONS.JOURNAL_POST], postedById: "admin",
    });
    await expect(ctx.controller.createJournal(parsed, actor([PERMISSIONS.JOURNAL_CREATE])))
      .rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });
    expect(ctx.prisma.journal.create).not.toHaveBeenCalled();
  });

  it("preserves immediate posting for an account with creation and posting authority", async () => {
    const ctx = setup();
    const result = await ctx.controller.createJournal(input, actor([PERMISSIONS.JOURNAL_CREATE, PERMISSIONS.JOURNAL_POST]));
    expect(result.data).toMatchObject({ status: "POSTED", lembagaId: "tenant", createdById: "staff", postedById: "staff" });
    expect(ctx.prisma.journal.create).toHaveBeenCalledTimes(1);
    expect(ctx.audit.log).toHaveBeenCalledTimes(1);
    expect(ctx.audit.log).toHaveBeenCalledWith(expect.objectContaining({ userId: "staff", newData: expect.objectContaining({ status: "POSTED" }) }));
  });

  it("preserves SUPER_ADMIN posting with an explicit institution", async () => {
    const ctx = setup();
    const admin: RBACSessionUser = { ...actor([]), id: "admin", roleName: "SUPER_ADMIN", lembagaId: null };
    await expect(ctx.controller.createJournal(input, admin, "tenant"))
      .resolves.toMatchObject({ data: { status: "POSTED", lembagaId: "tenant", postedById: "admin" } });
  });

  it("preserves institution scoping when an authorized staff member supplies another institution", async () => {
    const ctx = setup();
    await expect(ctx.controller.createJournal(input, actor([PERMISSIONS.JOURNAL_CREATE, PERMISSIONS.JOURNAL_POST]), "other"))
      .resolves.toMatchObject({ data: { lembagaId: "tenant" } });
    expect(ctx.prisma.accountingBook.findUnique).toHaveBeenCalledWith({ where: { lembagaId: "tenant" } });
  });
});
