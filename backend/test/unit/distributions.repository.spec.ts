import { beforeEach, describe, expect, it, vi } from "vitest";
import { DistributionsRepository } from "../../src/modules/distributions/distributions.repository";
import { AppError } from "../../src/common/errors/app.error";

describe("DistributionsRepository", () => {
  let prisma: any;
  let autoJournalService: any;
  let repository: DistributionsRepository;

  const baseInput = {
    programId: "program-1",
    amount: 1000,
    title: "Penyaluran bantuan",
    description: "Rincian penyaluran bantuan",
    receiptImageUrl: "",
  };

  beforeEach(() => {
    prisma = {
      $transaction: vi.fn(async (callback) => callback(prisma)),
      $queryRaw: vi.fn(),
      $executeRaw: vi.fn(),
      program: {
        findUnique: vi.fn().mockResolvedValue({ lembagaId: "lembaga-1", category: "ZAKAT" }),
        update: vi.fn(),
      },
      donation: { aggregate: vi.fn() },
      distribution: {
        aggregate: vi.fn(),
        create: vi.fn().mockResolvedValue({ id: "distribution-1" }),
      },
    };
    autoJournalService = { createDistributionJournal: vi.fn() };
    repository = new DistributionsRepository(prisma, autoJournalService);
  });

  it("uses and records the selected mustahiq balance", async () => {
    prisma.$executeRaw.mockResolvedValue(1);

    await repository.create({ ...baseInput, fundSource: "MUSTAHIQ" }, "user-1");

    expect(prisma.$queryRaw).not.toHaveBeenCalled();
    expect(prisma.distribution.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ fundSource: "MUSTAHIQ" }),
    }));
    expect(autoJournalService.createDistributionJournal).toHaveBeenCalledWith(
      prisma, "distribution-1", 1000, "program-1", "lembaga-1", "ZAKAT", "MUSTAHIQ", "user-1",
    );
  });

  it("uses the institution amil balance without reducing the program mustahiq balance", async () => {
    prisma.$queryRaw.mockResolvedValue([{ id: "balance-1" }]);
    prisma.donation.aggregate.mockResolvedValue({ _sum: { amilInstitutionAmount: 5000 } });
    prisma.distribution.aggregate.mockResolvedValue({ _sum: { amount: 2000 } });

    await repository.create({ ...baseInput, fundSource: "AMIL" }, "user-1");

    expect(prisma.$executeRaw).not.toHaveBeenCalled();
    expect(prisma.program.update).toHaveBeenCalledWith({
      where: { id: "program-1" },
      data: {
        distributedAmount: { increment: 1000 },
        amilDistributedAmount: { increment: 1000 },
      },
    });
    expect(prisma.donation.aggregate).toHaveBeenCalled();
    expect(prisma.distribution.aggregate).toHaveBeenCalled();
  });

  it("rejects a distribution when the selected balance is insufficient", async () => {
    prisma.$queryRaw.mockResolvedValue([{ id: "balance-1" }]);
    prisma.donation.aggregate.mockResolvedValue({ _sum: { amilInstitutionAmount: 2500 } });
    prisma.distribution.aggregate.mockResolvedValue({ _sum: { amount: 2000 } });

    await expect(
      repository.create({ ...baseInput, fundSource: "AMIL" }, "user-1"),
    ).rejects.toThrow(AppError);

    expect(prisma.distribution.create).not.toHaveBeenCalled();
  });
});
