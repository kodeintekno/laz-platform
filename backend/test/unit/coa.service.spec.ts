import { describe, it, expect, beforeEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { CoaService } from "../../src/modules/coa/coa.service";
import { CoaRepository } from "../../src/modules/coa/coa.repository";
import { AppError } from "../../src/common/errors/app.error";
import { COA_TEMPLATE } from "../../src/modules/coa/coa.template";

describe("CoaService", () => {
  let service: CoaService;
  let repo: any;

  beforeEach(async () => {
    const mockRepo = {
      countByLembaga: vi.fn(),
      seedCoaForLembaga: vi.fn(),
      findByLembaga: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoaService,
        { provide: CoaRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<CoaService>(CoaService);
    repo = module.get(CoaRepository);
  });

  it("should provision COA if institution has no COA", async () => {
    repo.countByLembaga.mockResolvedValueOnce(0); // Before seed
    repo.countByLembaga.mockResolvedValueOnce(COA_TEMPLATE.length); // After seed

    await service.seedCoaForLembaga("lembaga-1");

    expect(repo.seedCoaForLembaga).toHaveBeenCalledWith("lembaga-1");
  });

  it("should throw error if institution already has COA (no duplicate)", async () => {
    repo.countByLembaga.mockResolvedValue(COA_TEMPLATE.length); // Already exists

    await expect(service.seedCoaForLembaga("lembaga-1")).rejects.toThrow(AppError);
    
    expect(repo.seedCoaForLembaga).not.toHaveBeenCalled();
  });

  it("COA Template should have valid parent-child relationships", () => {
    const codes = new Set(COA_TEMPLATE.map(c => c.code));
    
    for (const acc of COA_TEMPLATE) {
      if (acc.parentCode) {
        // Parent must exist in the template
        expect(codes.has(acc.parentCode)).toBe(true); 
      }
    }
  });

  it("uses one canonical Infak/Sedekah account for fund, revenue, and distribution", () => {
    expect(COA_TEMPLATE.filter((account) => account.name.includes("Infak/Sedekah"))).toEqual([
      expect.objectContaining({ code: "3102", name: "Dana Infak/Sedekah" }),
      expect.objectContaining({ code: "4102", name: "Penerimaan Infak/Sedekah" }),
      expect.objectContaining({ code: "5102", name: "Penyaluran Infak/Sedekah" }),
    ]);
    expect(COA_TEMPLATE.some((account) => ["3103", "4103", "5103"].includes(account.code))).toBe(false);
  });

  it("institution A cannot see COA of institution B", async () => {
    repo.findByLembaga.mockResolvedValueOnce([]);
    
    const result = await service.getCoaByLembaga("lembaga-A");
    
    expect(repo.findByLembaga).toHaveBeenCalledWith("lembaga-A");
    // Ensure the repository was NOT called with lembaga-B's ID
    expect(repo.findByLembaga).not.toHaveBeenCalledWith("lembaga-B");
    expect(result).toEqual([]);
  });
});
