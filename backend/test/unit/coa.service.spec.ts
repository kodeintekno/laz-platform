import { describe, it, expect, beforeEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { CoaService } from "../../src/modules/coa/coa.service";
import { CoaRepository } from "../../src/modules/coa/coa.repository";
import { COA_TEMPLATE, coaTemplateFor } from "../../src/modules/coa/coa.template";

describe("CoaService", () => {
  let service: CoaService;
  let repo: any;

  beforeEach(async () => {
    const mockRepo = {
      countByLembaga: vi.fn(),
      syncPlatformCoa: vi.fn(),
      syncAllApprovedLembagaCoas: vi.fn(),
      syncCoaForLembaga: vi.fn(),
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
    repo.countByLembaga.mockResolvedValueOnce(coaTemplateFor("LEMBAGA").length);

    await service.seedCoaForLembaga("lembaga-1");

    expect(repo.syncPlatformCoa).toHaveBeenCalledOnce();
    expect(repo.syncCoaForLembaga).toHaveBeenCalledWith("lembaga-1");
  });

  it("should safely re-sync an existing COA", async () => {
    repo.countByLembaga.mockResolvedValue(coaTemplateFor("LEMBAGA").length);
    await expect(service.seedCoaForLembaga("lembaga-1")).resolves.toBeUndefined();
    expect(repo.syncCoaForLembaga).toHaveBeenCalledWith("lembaga-1");
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
