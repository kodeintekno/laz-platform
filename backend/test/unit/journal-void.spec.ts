import { describe, expect, it, vi } from "vitest";
import { JournalSourceType } from "@prisma/client";
import { voidJournalSchema } from "../../../shared/validations/journal.schema";
import { JournalController } from "../../src/modules/journal/journal.controller";
import { JournalRepository } from "../../src/modules/journal/journal.repository";
import { JournalService } from "../../src/modules/journal/journal.service";
import { AuditAction } from "../../src/modules/audit/audit.types";

const reason = { reason: "Koreksi jurnal manual" };
const user: any = { id: "staff", roleName: "LEMBAGA_ADMIN", lembagaId: "tenant", permissions: [] };
const automaticSources = Object.values(JournalSourceType).filter((source) => source !== "MANUAL");

function setup(sourceType: string, overrides: Record<string, unknown> = {}) {
  const row = {
    id: "journal", lembagaId: "tenant", accountingBookId: "book", status: "POSTED",
    sourceType, sourceId: "source", sourceEvent: "PRIMARY", postedById: "staff",
    postedAt: new Date("2026-10-07T00:00:00Z"),
    details: [{ accountId: "bank", debit: 100, credit: 0 }, { accountId: "revenue", debit: 0, credit: 100 }],
    ...overrides,
  };
  const prisma: any = {
    journal: {
      findFirst: vi.fn(async ({ where }: any) =>
        where.id === row.id && where.lembagaId === row.lembagaId ? { ...row } : null),
      update: vi.fn(async ({ data }: any) => Object.assign(row, data)),
    },
  };
  const audit = { log: vi.fn() };
  const service = new JournalService(new JournalRepository(prisma), prisma, audit as any, {} as any);
  return { row, prisma, audit, service, controller: new JournalController(service) };
}

describe("journal void source protection (ACCT-001)", () => {
  it.each(automaticSources)("rejects %s through the void endpoint before mutation or success audit", async (source) => {
    const ctx = setup(source);
    const before = structuredClone(ctx.row);
    await expect(ctx.controller.voidJournal("journal", reason, user))
      .rejects.toMatchObject({ code: "AUTOMATIC_JOURNAL_LOCKED", status: 400 });
    expect(ctx.prisma.journal.update).not.toHaveBeenCalled();
    expect(ctx.audit.log).not.toHaveBeenCalled();
    expect(ctx.row).toEqual(before);
  });

  it("rejects a direct service caller even when the automatic source link is absent", async () => {
    const ctx = setup("DONATION", { sourceId: null });
    await expect(ctx.service.voidJournal("journal", "tenant", reason, "staff"))
      .rejects.toMatchObject({ code: "AUTOMATIC_JOURNAL_LOCKED", status: 400 });
    expect(ctx.prisma.journal.update).not.toHaveBeenCalled();
    expect(ctx.audit.log).not.toHaveBeenCalled();
  });

  it("uses persisted source type despite a forged MANUAL source in the request", async () => {
    const ctx = setup("WITHDRAWAL");
    const body = voidJournalSchema.parse({ ...reason, sourceType: "MANUAL", sourceId: null });
    expect(body).toEqual(reason);
    await expect(ctx.controller.voidJournal("journal", body, user))
      .rejects.toMatchObject({ code: "AUTOMATIC_JOURNAL_LOCKED", status: 400 });
    expect(ctx.prisma.journal.update).not.toHaveBeenCalled();
  });

  it.each(["MANUAL", "PRIMARY"])("preserves void of manual journals with source event %s", async (sourceEvent) => {
    const ctx = setup("MANUAL", { sourceId: null, sourceEvent });
    const before = structuredClone(ctx.row);
    const result = await ctx.controller.voidJournal("journal", reason, user);
    expect(result.data).toEqual({ ...before, status: "VOID" });
    expect(ctx.prisma.journal.update).toHaveBeenCalledExactlyOnceWith({
      where: { id: "journal", lembagaId: "tenant" }, data: { status: "VOID" },
    });
    expect(ctx.audit.log).toHaveBeenCalledExactlyOnceWith({
      userId: "staff", action: AuditAction.DELETE, entity: "Journal", entityId: "journal",
      newData: { status: "VOID", reason: reason.reason },
    });
  });

  it.each(["DRAFT", "VOID"])("retains rejection of %s journals", async (status) => {
    const ctx = setup("MANUAL", { status });
    await expect(ctx.service.voidJournal("journal", "tenant", reason, "staff"))
      .rejects.toMatchObject({ code: "JOURNAL_NOT_POSTED", status: 400 });
    expect(ctx.prisma.journal.update).not.toHaveBeenCalled();
    expect(ctx.audit.log).not.toHaveBeenCalled();
  });

  it.each(["missing", "journal"])("retains not-found response for missing or other-Lembaga journal %s", async (id) => {
    const ctx = setup("MANUAL", { lembagaId: "other" });
    await expect(ctx.controller.voidJournal(id, reason, user, "other"))
      .rejects.toMatchObject({ status: 404 });
    expect(ctx.prisma.journal.findFirst.mock.calls[0][0].where).toEqual({ id, lembagaId: "tenant" });
    expect(ctx.prisma.journal.update).not.toHaveBeenCalled();
    expect(ctx.audit.log).not.toHaveBeenCalled();
  });
});
