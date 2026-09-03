import { describe, expect, it, vi } from "vitest";
import { AnalyticsRepository } from "../../src/modules/analytics/analytics.repository";

describe("AnalyticsRepository platform finance overview", () => {
  it("uses paid donations and persisted gateway balances without recalculating percentages", async () => {
    const prisma: any = {
      lembaga: {
        count: vi.fn()
          .mockResolvedValueOnce(1)
          .mockResolvedValueOnce(2)
          .mockResolvedValueOnce(3),
      },
      program: { count: vi.fn().mockResolvedValue(4) },
      donation: {
        aggregate: vi.fn().mockResolvedValue({
          _sum: { amount: 1_000_000 },
          _count: { id: 5 },
        }),
      },
      platformBalance: {
        findUnique: vi.fn().mockResolvedValue({
          balance: 100_000,
          reservedBalance: 25_000,
        }),
      },
      institutionBalance: {
        aggregate: vi.fn().mockResolvedValue({
          _sum: { balance: 750_000, reservedBalance: 125_000 },
        }),
      },
      volunteer: { count: vi.fn().mockResolvedValue(6) },
      volunteerApplication: { count: vi.fn().mockResolvedValue(7) },
    };

    const result = await new AnalyticsRepository(prisma).getPlatformOverview();

    expect(prisma.donation.aggregate).toHaveBeenCalledWith({
      where: { status: "PAID" },
      _sum: { amount: true },
      _count: { id: true },
    });
    expect(prisma.platformBalance.findUnique).toHaveBeenCalledWith({
      where: { id: "platform" },
    });
    expect(prisma.institutionBalance.aggregate).toHaveBeenCalledWith({
      _sum: { balance: true, reservedBalance: true },
    });
    expect(result).toMatchObject({
      totalMoneyIn: 1_000_000,
      successfulPayments: 5,
      platformBalance: {
        available: 100_000,
        reserved: 25_000,
        total: 125_000,
      },
      institutionBalance: {
        available: 750_000,
        reserved: 125_000,
        total: 875_000,
      },
    });
  });
});
