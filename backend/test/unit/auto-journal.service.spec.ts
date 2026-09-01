import { describe, expect, it, vi } from "vitest";
import { AutoJournalService } from "../../src/modules/journal/auto-journal.service";
import { COA_KEYS } from "../../src/modules/coa/coa.template";

describe("AutoJournalService category mapping", () => {
  const service = new AutoJournalService() as any;

  it("maps Infak/Sedekah donations to the combined revenue account", () => {
    expect(service.getDonationRevenueKey("INFAK_SEDEKAH")).toBe(COA_KEYS.INFAK_SEDEKAH_REVENUE);
  });

  it("maps Infak/Sedekah distributions to the combined expense account", () => {
    expect(service.getDistributionKey("INFAK_SEDEKAH")).toBe(COA_KEYS.INFAK_SEDEKAH_DISTRIBUTION);
  });

  it("posts balanced gross donation journals to Lembaga and Platform books", async () => {
    const created: any[] = [];
    const tx: any = {
      accountingBook: {
        findFirst: vi.fn(({ where }) => Promise.resolve({ id: where.ownerType === "PLATFORM" ? "book-platform" : "book-lembaga" })),
      },
      chartOfAccount: {
        findMany: vi.fn(({ where }) => Promise.resolve(where.key.in.map((key: string) => ({ id: `account-${key}`, key })))),
      },
      lembagaBankAccount: { findFirst: vi.fn().mockResolvedValue(null) },
      journal: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn(({ data }) => { created.push(data); return Promise.resolve(data); }),
      },
      platformBalance: { upsert: vi.fn().mockResolvedValue({}) },
    };

    await service.createDonationJournal(tx, "donation-1", 100_000, 5_000, 10_000, 85_000,
      "program-1", "lembaga-1", "ZAKAT");

    expect(created).toHaveLength(2);
    const lembagaLines = created[0].details.create;
    expect(lembagaLines.reduce((sum: number, line: any) => sum + line.debit, 0)).toBe(100_000);
    expect(lembagaLines.reduce((sum: number, line: any) => sum + line.credit, 0)).toBe(100_000);
    expect(created[0]).toMatchObject({ accountingBookId: "book-lembaga", lembagaId: "lembaga-1", sourceEvent: "PAYMENT_SUCCEEDED" });

    const platformLines = created[1].details.create;
    expect(platformLines.reduce((sum: number, line: any) => sum + line.debit, 0)).toBe(100_000);
    expect(platformLines.reduce((sum: number, line: any) => sum + line.credit, 0)).toBe(100_000);
    expect(created[1]).toMatchObject({ accountingBookId: "book-platform", lembagaId: null, sourceEvent: "PAYMENT_SUCCEEDED" });
  });

  it("posts a mustahiq distribution in the Lembaga book without touching the gateway", async () => {
    const created: any[] = [];
    const tx: any = {
      accountingBook: { findFirst: vi.fn().mockResolvedValue({ id: "book-lembaga" }) },
      chartOfAccount: {
        findMany: vi.fn(({ where }) => Promise.resolve(where.key.in.map((key: string) => ({ id: `account-${key}`, key })))),
      },
      lembagaBankAccount: { findFirst: vi.fn().mockResolvedValue(null) },
      journal: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn(({ data }) => { created.push(data); return Promise.resolve(data); }),
      },
    };

    await service.createDistributionJournal(tx, "distribution-1", 85_000,
      "program-1", "lembaga-1", "ZAKAT", "MUSTAHIQ", "user-1");

    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({ sourceEvent: "DISTRIBUTION_COMPLETED" });
    expect(created[0].details.create).toEqual([
      expect.objectContaining({ accountId: `account-${COA_KEYS.ZAKAT_DISTRIBUTION}`, debit: 85_000, credit: 0 }),
      expect.objectContaining({ accountId: `account-${COA_KEYS.BANK}`, debit: 0, credit: 85_000 }),
    ]);
  });

  it("posts an amil distribution as an operating expense", async () => {
    const created: any[] = [];
    const tx: any = {
      accountingBook: {
        findFirst: vi.fn().mockResolvedValue({ id: "book-lembaga" }),
      },
      chartOfAccount: {
        findMany: vi.fn(({ where }) => Promise.resolve(where.key.in.map((key: string) => ({ id: `account-${key}`, key })))),
      },
      lembagaBankAccount: { findFirst: vi.fn().mockResolvedValue(null) },
      journal: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn(({ data }) => { created.push(data); return Promise.resolve(data); }),
      },
    };

    await service.createDistributionJournal(tx, "distribution-2", 25_000,
      "program-1", "lembaga-1", "ZAKAT", "AMIL", "user-1");

    expect(created[0].details.create[0]).toEqual(
      expect.objectContaining({ accountId: `account-${COA_KEYS.OTHER_OPERATING_EXPENSE}`, debit: 25_000 }),
    );
  });

  it("posts successful Lembaga payout in both accounting books", async () => {
    const created: any[] = [];
    const tx: any = {
      accountingBook: {
        findFirst: vi.fn(({ where }) => Promise.resolve({ id: where.ownerType === "PLATFORM" ? "book-platform" : "book-lembaga" })),
      },
      chartOfAccount: {
        findMany: vi.fn(({ where }) => Promise.resolve(where.key.in.map((key: string) => ({ id: `account-${key}`, key })))),
        count: vi.fn().mockResolvedValue(1),
      },
      journal: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn(({ data }) => { created.push(data); return Promise.resolve(data); }),
      },
    };

    await service.createWithdrawalCompletionJournal(
      tx, "withdrawal-1", 95_000, "lembaga-1", null, "coa-bank-mandiri",
    );

    expect(created).toHaveLength(2);
    expect(created[0].details.create).toEqual([
      expect.objectContaining({ accountId: "coa-bank-mandiri", debit: 95_000, credit: 0 }),
      expect.objectContaining({ accountId: `account-${COA_KEYS.PAYMENT_GATEWAY_RECEIVABLE}`, debit: 0, credit: 95_000 }),
    ]);
    expect(created[1].details.create).toEqual([
      expect.objectContaining({ accountId: `account-${COA_KEYS.INSTITUTION_FUNDS_PAYABLE}`, debit: 95_000, credit: 0 }),
      expect.objectContaining({ accountId: `account-${COA_KEYS.PAYMENT_GATEWAY_RECEIVABLE}`, debit: 0, credit: 95_000 }),
    ]);
  });

  it("posts successful Platform payout from payment gateway to Bank", async () => {
    const created: any[] = [];
    const tx: any = {
      accountingBook: { findFirst: vi.fn().mockResolvedValue({ id: "book-platform" }) },
      chartOfAccount: {
        findMany: vi.fn(({ where }) => Promise.resolve(where.key.in.map((key: string) => ({ id: `account-${key}`, key })))),
      },
      journal: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn(({ data }) => { created.push(data); return Promise.resolve(data); }),
      },
    };

    await service.createPlatformWithdrawalCompletionJournal(tx, "withdrawal-platform-1", 5_000, null);

    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({ accountingBookId: "book-platform", sourceEvent: "PLATFORM_PAYOUT_SUCCEEDED" });
    expect(created[0].details.create).toEqual([
      expect.objectContaining({ accountId: `account-${COA_KEYS.BANK}`, debit: 5_000, credit: 0 }),
      expect.objectContaining({ accountId: `account-${COA_KEYS.PAYMENT_GATEWAY_RECEIVABLE}`, debit: 0, credit: 5_000 }),
    ]);
  });
});
