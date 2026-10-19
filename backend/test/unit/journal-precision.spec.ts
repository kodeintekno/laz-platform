import { describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { journalSchema } from "../../../shared/validations/journal.schema";
import { ZodValidationPipe } from "../../src/common/pipes/zod-validation.pipe";
import { JournalService } from "../../src/modules/journal/journal.service";
import { JournalRepository } from "../../src/modules/journal/journal.repository";
import { PERMISSIONS } from "../../../shared/constants/permissions";
import type { RBACSessionUser } from "../../../shared/types/rbac";

const staff: RBACSessionUser = {
  id: "staff", email: "staff@example.com", roleName: "LEMBAGA_ADMIN", lembagaId: "tenant",
  permissions: [PERMISSIONS.JOURNAL_CREATE, PERMISSIONS.JOURNAL_POST],
};

const maximum = 9_999_999_999_999.99;
const input = (debits: any[], credits: any[]) => ({
  journalDate: "2026-10-06", description: "Precision regression", programId: "program",
  details: [
    ...debits.map((debit) => ({ accountId: "debit-account", debit, credit: 0, description: "Debit" })),
    ...credits.map((credit) => ({ accountId: "credit-account", debit: 0, credit, description: "Credit" })),
  ],
});

function setup() {
  const persisted: any[] = [];
  const create = vi.fn(async ({ data }: any) => {
    // Model the declared Decimal(15,2) storage, not a live PostgreSQL insert.
    const details = data.details.create.map((line: any) => ({
      ...line,
      debit: new Prisma.Decimal(line.debit).toDecimalPlaces(2),
      credit: new Prisma.Decimal(line.credit).toDecimalPlaces(2),
    }));
    const row = { ...data, id: "journal", details };
    persisted.push(row);
    return row;
  });
  const prisma: any = {
    chartOfAccount: { findMany: vi.fn(async ({ where }: any) => where.id.in.map((id: string) => ({
      id, code: id, lembagaId: "tenant", isHeader: false, isActive: true,
    }))) },
    program: { findUnique: vi.fn(async () => ({ id: "program", lembagaId: "tenant" })) },
    accountingBook: { findUnique: vi.fn(async () => ({ id: "book" })) },
    journal: { create },
    $transaction: vi.fn(async (work: any) => work(prisma)),
  };
  const generateJournalNo = vi.fn(async () => "JU-202610-000001");
  const audit = { log: vi.fn() };
  const service = new JournalService(new JournalRepository(prisma), prisma, audit as any, { generateJournalNo } as any);
  return { service, prisma, create, generateJournalNo, audit, persisted };
}

function expectStoredBalance(row: any) {
  const debit = row.details.reduce((sum: Prisma.Decimal, line: any) => sum.plus(line.debit), new Prisma.Decimal(0));
  const credit = row.details.reduce((sum: Prisma.Decimal, line: any) => sum.plus(line.credit), new Prisma.Decimal(0));
  expect(debit.equals(credit)).toBe(true);
}

describe("manual journal precision (BAL-003)", () => {
  it("rejects the split-rounding exploit at the request schema", () => {
    expect(journalSchema.safeParse(input([50.004, 50.004], [100.008])).success).toBe(false);
  });

  it("rejects the split-rounding exploit through direct service invocation before posting", async () => {
    const ctx = setup();
    await expect(ctx.service.createJournal("tenant", input([50.004, 50.004], [100.008]), staff))
      .rejects.toMatchObject({ code: "INVALID_JOURNAL_AMOUNT", status: 400 });
    expect(ctx.create).not.toHaveBeenCalled();
    expect(ctx.generateJournalNo).not.toHaveBeenCalled();
    expect(ctx.audit.log).not.toHaveBeenCalled();
  });

  it.each([1.004, 1.005, 1.006, 0.001, 0.0000001, 9_999_999_999_999.994])(
    "rejects fractional precision %s even when raw totals are equal", async (amount) => {
      const ctx = setup();
      const data = input([amount], [amount]);
      expect(journalSchema.safeParse(data).success).toBe(false);
      await expect(ctx.service.createJournal("tenant", data, staff)).rejects.toMatchObject({ code: "INVALID_JOURNAL_AMOUNT", status: 400 });
      expect(ctx.create).not.toHaveBeenCalled();
    },
  );

  it.each(["50.004", "5.0004e1", " 50.004 "])("rejects fractional numeric string %j in the request pipe", (amount) => {
    const pipe = new ZodValidationPipe(journalSchema);
    expect(() => pipe.transform(input([amount], [amount]))).toThrow();
  });

  it("rejects accumulated fractional lines without posting", async () => {
    const ctx = setup();
    const data = input(Array(100).fill(1.004), [100.4]);
    expect(journalSchema.safeParse(data).success).toBe(false);
    await expect(ctx.service.createJournal("tenant", data, staff)).rejects.toMatchObject({ code: "INVALID_JOURNAL_AMOUNT", status: 400 });
    expect(ctx.create).not.toHaveBeenCalled();
  });

  it("rejects a one-cent imbalance masked by large floating point totals", async () => {
    const ctx = setup();
    const debits = Array(32).fill(maximum);
    const credits = [...debits];
    credits[31] = maximum - 0.01;
    const data = input(debits, credits);
    expect(journalSchema.safeParse(data).success).toBe(false);
    await expect(ctx.service.createJournal("tenant", data, staff))
      .rejects.toMatchObject({ code: "UNBALANCED_JOURNAL", status: 400 });
    expect(ctx.create).not.toHaveBeenCalled();
  });

  it.each([
    [[0.1, 0.2], [0.3]],
    [[0.29], [0.29]],
    [[50.01, 49.99], [100]],
    [[0.01], [0.01]],
    [[maximum], [maximum]],
    [Array(32).fill(maximum), Array(32).fill(maximum)],
  ])("preserves valid stored-precision journals %j against %j", async (debits, credits) => {
    const ctx = setup();
    const parsed = journalSchema.parse(input(debits, credits));
    const row = await ctx.service.createJournal("tenant", parsed, staff);
    expectStoredBalance(row);
    expect(row).toMatchObject({ status: "POSTED", lembagaId: "tenant", programId: "program", createdById: "staff" });
    expect(ctx.create.mock.calls[0][0].data.details.create).toEqual(parsed.details);
    expect(ctx.audit.log).toHaveBeenCalled();
  });

  it.each(["50.000", "5e1", " 50.00 "])("preserves equivalent numeric coercion %j and number output", async (amount) => {
    const ctx = setup();
    const parsed = journalSchema.parse(input([amount], [50]));
    expect(parsed.details[0].debit).toBe(50);
    expect(typeof parsed.details[0].debit).toBe("number");
    expectStoredBalance(await ctx.service.createJournal("tenant", parsed, staff));
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, 10_000_000_000_000])(
    "rejects amounts outside finite nonnegative Decimal(15,2) range: %s", async (amount) => {
      const ctx = setup();
      const data = input([amount], [amount]);
      expect(journalSchema.safeParse(data).success).toBe(false);
      await expect(ctx.service.createJournal("tenant", data, staff)).rejects.toMatchObject({ code: "INVALID_JOURNAL_AMOUNT", status: 400 });
      expect(ctx.create).not.toHaveBeenCalled();
    },
  );

  it("retains the service error for ordinary unbalanced two-decimal inputs", async () => {
    const ctx = setup();
    await expect(ctx.service.createJournal("tenant", input([1], [1.01]), staff))
      .rejects.toMatchObject({ code: "UNBALANCED_JOURNAL", status: 400 });
    expect(ctx.create).not.toHaveBeenCalled();
  });

  it("retains account and program ownership checks", async () => {
    const ctx = setup();
    ctx.prisma.chartOfAccount.findMany.mockResolvedValueOnce([
      { id: "debit-account", code: "A", lembagaId: "other", isActive: true },
      { id: "credit-account", code: "B", lembagaId: "tenant", isActive: true },
    ]);
    await expect(ctx.service.createJournal("tenant", input([10], [10]), staff))
      .rejects.toMatchObject({ code: "INVALID_ACCOUNT_TENANT", status: 403 });
    ctx.prisma.program.findUnique.mockResolvedValueOnce({ lembagaId: "other" });
    await expect(ctx.service.createJournal("tenant", input([10], [10]), staff))
      .rejects.toMatchObject({ code: "INVALID_PROGRAM", status: 400 });
    expect(ctx.create).not.toHaveBeenCalled();
  });
});
