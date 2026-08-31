import { describe, expect, it } from "vitest";
import { AmilService } from "../../src/modules/amil/amil.service";
import { ProgramCategory } from "@prisma/client";

describe("AmilService program snapshots", () => {
  const service = new AmilService({} as any, {} as any);

  it("calculates a donation from the program snapshot", () => {
    const result = service.calculateSplitFromProgramSnapshot(100_000, 5, 10);

    expect(result).toEqual({
      platformPercentage: 5,
      institutionPercentage: 10,
      amilPlatformAmount: 5_000,
      amilInstitutionAmount: 10_000,
      netAmount: 85_000,
    });
  });

  it("does not depend on an institution or category setting", () => {
    const oldProgram = service.calculateSplitFromProgramSnapshot(100_000, 5, 15);
    const newProgram = service.calculateSplitFromProgramSnapshot(100_000, 5, 10);

    expect(oldProgram.amilInstitutionAmount).toBe(15_000);
    expect(newProgram.amilInstitutionAmount).toBe(10_000);
  });

  it("rejects a snapshot whose total exceeds its recorded maximum", () => {
    expect(() => service.validateProgramAmilSnapshot(5, 10, 12.5)).toThrow(
      "melebihi batas maksimum",
    );
  });
});

describe("AmilService settings and platform requests", () => {
  it("rejects lowering a global maximum below an existing institution allocation", async () => {
    const prisma = {
      amilInstitutionSetting: {
        findMany: async () => [{ lembagaId: "lembaga-1", institutionPercentage: 15, platformPercentage: 5 }],
      },
      amilGlobalSetting: { upsert: async () => ({}) },
    };
    const service = new AmilService(prisma as any, {} as any);

    await expect(service.updateGlobalSetting(ProgramCategory.INFAK_SEDEKAH, 19, 5)).rejects.toThrow(
      "masih ada konfigurasi lembaga",
    );
  });

  it("accepts a valid global configuration with two decimal places", async () => {
    let saved: any;
    const prisma = {
      amilInstitutionSetting: { findMany: async () => [] },
      amilGlobalSetting: { upsert: async (input: any) => (saved = input) },
    };
    const service = new AmilService(prisma as any, {} as any);

    await service.updateGlobalSetting(ProgramCategory.INFAK_SEDEKAH, 20, 5.25);

    expect(saved.update).toEqual({ maxTotalPercentage: 20, defaultPlatformPercentage: 5.25 });
  });

  it("rejects platform requests with more than two decimal places before opening a transaction", async () => {
    const prisma = { $transaction: () => { throw new Error("transaction must not run"); } };
    const service = new AmilService(prisma as any, {} as any);

    await expect(
      service.createPlatformChangeRequest(
        "lembaga-1",
        "user-1",
        ProgramCategory.INFAK_SEDEKAH,
        5.555,
        "Alasan perubahan yang valid",
      ),
    ).rejects.toThrow("maksimal menggunakan 2 angka desimal");
  });
});
