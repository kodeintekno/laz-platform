import { describe, expect, it } from "vitest";
import { AmilService } from "../../src/modules/amil/amil.service";

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
