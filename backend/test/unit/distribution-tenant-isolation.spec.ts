import { beforeEach, describe, expect, it, vi } from "vitest";
import { DistributionsController } from "../../src/modules/distributions/distributions.controller";
import { DistributionsService } from "../../src/modules/distributions/distributions.service";
import { DistributionsRepository } from "../../src/modules/distributions/distributions.repository";
import { PERMISSIONS } from "../../../shared/constants/permissions";
import { distributionSchema } from "../../../shared/validations/distributions.schema";

const staff = { id: "staff-a", lembagaId: "tenant-a", permissions: [PERMISSIONS.DISTRIBUTIONS_MANAGE] };
const input = { programId: "program-b", amount: 1000, title: "Penyaluran bantuan", description: "Rincian bantuan penerima" };

describe("distribution mutation tenant boundary", () => {
  let tx: any;
  let journal: any;
  let audit: any;
  let controller: DistributionsController;
  let repository: DistributionsRepository;

  beforeEach(() => {
    tx = {
      program: {
        findUnique: vi.fn().mockResolvedValue({ lembagaId: "tenant-b", category: "ZAKAT" }),
        update: vi.fn().mockResolvedValue({}),
      },
      $executeRaw: vi.fn().mockResolvedValue(1),
      $queryRaw: vi.fn().mockResolvedValue([{ id: "balance-b" }]),
      donation: { aggregate: vi.fn().mockResolvedValue({ _sum: { amilInstitutionAmount: 10000 } }) },
      distribution: {
        aggregate: vi.fn().mockResolvedValue({ _sum: { amount: 0 } }),
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "distribution-1", ...data })),
      },
    };
    journal = { createDistributionJournal: vi.fn() };
    audit = { log: vi.fn() };
    repository = new DistributionsRepository({ $transaction: vi.fn((run) => run(tx)) } as any, journal);
    controller = new DistributionsController(new DistributionsService(repository, audit));
  });

  function noEffects() {
    expect(tx.$executeRaw).not.toHaveBeenCalled();
    expect(tx.$queryRaw).not.toHaveBeenCalled();
    expect(tx.program.update).not.toHaveBeenCalled();
    expect(tx.donation.aggregate).not.toHaveBeenCalled();
    expect(tx.distribution.aggregate).not.toHaveBeenCalled();
    expect(tx.distribution.create).not.toHaveBeenCalled();
    expect(journal.createDistributionJournal).not.toHaveBeenCalled();
    expect(audit.log).not.toHaveBeenCalled();
  }

  it.each(["MUSTAHIQ", "AMIL"] as const)("blocks foreign-tenant %s before financial or audit effects", async (fundSource) => {
    await expect(controller.create({ ...input, fundSource }, staff)).rejects.toMatchObject({ code: "FORBIDDEN_DISTRIBUTION" });
    noEffects();
  });

  it("does not widen a tenant actor's write scope when they also have platform read permission", async () => {
    await expect(controller.create({ ...input, fundSource: "AMIL" }, {
      ...staff, permissions: [...staff.permissions, PERMISSIONS.PLATFORM_FINANCE_READ],
    })).rejects.toMatchObject({ code: "FORBIDDEN_DISTRIBUTION" });
    noEffects();
  });

  it.each([null, undefined, ""])("rejects missing tenant scope %j for ordinary staff", async (lembagaId) => {
    await expect(controller.create({ ...input, fundSource: "MUSTAHIQ" }, { ...staff, lembagaId }))
      .rejects.toMatchObject({ code: "FORBIDDEN_DISTRIBUTION" });
    noEffects();
  });

  it("does not grant a read-only platform finance actor mutation access through the repository", async () => {
    await expect((repository.create as any)({ ...input, fundSource: "AMIL" }, {
      id: "finance", lembagaId: null, roleName: "FINANCE_PLATFORM", permissions: [PERMISSIONS.PLATFORM_FINANCE_READ],
    })).rejects.toMatchObject({ code: "FORBIDDEN_DISTRIBUTION" });
    noEffects();
  });

  it("ignores forged body ownership and actor fields", async () => {
    const body = distributionSchema.parse({ ...input, fundSource: "MUSTAHIQ", lembagaId: "tenant-b", userId: "victim", roleName: "SUPER_ADMIN" });
    await expect(controller.create(body, staff)).rejects.toMatchObject({ code: "FORBIDDEN_DISTRIBUTION" });
    noEffects();
  });

  it.each(["MUSTAHIQ", "AMIL"] as const)("preserves own-tenant %s balances, attribution and journaling", async (fundSource) => {
    tx.program.findUnique.mockResolvedValue({ lembagaId: staff.lembagaId, category: "ZAKAT" });
    await expect(controller.create({ ...input, fundSource }, staff)).resolves.toEqual({ distributionId: "distribution-1" });
    expect(tx.distribution.create).toHaveBeenCalledWith({ data: expect.objectContaining({
      lembagaId: "tenant-a", createdById: "staff-a", status: "COMPLETED", fundSource, amount: 1000,
    }) });
    expect(journal.createDistributionJournal).toHaveBeenCalledWith(tx, "distribution-1", 1000, input.programId, "tenant-a", "ZAKAT", fundSource, "staff-a");
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ userId: "staff-a", entityId: "distribution-1" }));
    if (fundSource === "MUSTAHIQ") {
      const [sql, ...values] = tx.$executeRaw.mock.calls[0];
      expect(sql.join("?")).toContain('AND "lembagaId" = ?');
      expect(values).toContain("tenant-a");
      expect(tx.program.update).not.toHaveBeenCalled();
    } else {
      expect(tx.program.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: input.programId, lembagaId: "tenant-a" } }));
      expect(tx.$executeRaw).not.toHaveBeenCalled();
    }
  });

  it("preserves explicitly authorized platform administration", async () => {
    await expect(controller.create({ ...input, fundSource: "MUSTAHIQ" }, {
      id: "super-admin", lembagaId: null, roleName: "SUPER_ADMIN", permissions: [],
    })).resolves.toEqual({ distributionId: "distribution-1" });
    expect(tx.distribution.create).toHaveBeenCalledWith({ data: expect.objectContaining({ lembagaId: "tenant-b", createdById: "super-admin" }) });
  });

  it("preserves missing-program 404 without side effects", async () => {
    tx.program.findUnique.mockResolvedValue(null);
    await expect(controller.create({ ...input, fundSource: "MUSTAHIQ" }, staff)).rejects.toMatchObject({ code: "PROGRAM_NOT_FOUND" });
    noEffects();
  });

  it.each(["MUSTAHIQ", "AMIL"] as const)("does not create a distribution or journal when the %s ownership-constrained update fails", async (fundSource) => {
    tx.program.findUnique.mockResolvedValue({ lembagaId: "tenant-a", category: "ZAKAT" });
    if (fundSource === "MUSTAHIQ") tx.$executeRaw.mockResolvedValue(0);
    else tx.program.update.mockRejectedValue(new Error("No record matches the verified tenant"));
    await expect(controller.create({ ...input, fundSource }, staff)).rejects.toBeDefined();
    expect(tx.distribution.create).not.toHaveBeenCalled();
    expect(journal.createDistributionJournal).not.toHaveBeenCalled();
    expect(audit.log).not.toHaveBeenCalled();
  });

  it("requires write permission even for a same-tenant actor", async () => {
    tx.program.findUnique.mockResolvedValue({ lembagaId: "tenant-a", category: "ZAKAT" });
    await expect(controller.create({ ...input, fundSource: "MUSTAHIQ" }, { ...staff, permissions: [] }))
      .rejects.toMatchObject({ code: "FORBIDDEN_DISTRIBUTION" });
    noEffects();
  });
});
