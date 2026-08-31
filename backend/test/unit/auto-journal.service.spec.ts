import { describe, expect, it } from "vitest";
import { AutoJournalService } from "../../src/modules/journal/auto-journal.service";

describe("AutoJournalService category mapping", () => {
  const service = new AutoJournalService() as any;

  it("maps Infak/Sedekah donations to the combined revenue account", () => {
    expect(service.getDonationCreditCode("INFAK_SEDEKAH")).toBe("4102");
  });

  it("maps Infak/Sedekah distributions to the combined expense account", () => {
    expect(service.getDistributionDebitCode("INFAK_SEDEKAH")).toBe("5102");
  });
});
