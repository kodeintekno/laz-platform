import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves summary statistics for the dashboard.
   */
  async getSummaryStats(lembagaId?: string) {
    const whereClause = lembagaId ? { lembagaId } : {};

    const [
      totalDonationsAgg,
      totalDistributionsAgg,
      distinctDonorPhones,
      activeProgramsCount,
    ] = await Promise.all([
      // Sum of all PAID donations
      this.prisma.donation.aggregate({
        _sum: { amount: true },
        where: { ...whereClause, status: "PAID" },
      }),
      // Sum of all COMPLETED distributions
      this.prisma.distribution.aggregate({
        _sum: { amount: true },
        where: { ...whereClause, status: "COMPLETED" },
      }),
      // Count unique donors (by phone — donors have no account)
      this.prisma.donation.findMany({
        where: { ...whereClause, status: "PAID", donorPhone: { not: null } },
        distinct: ["donorPhone"],
        select: { donorPhone: true },
      }),
      // Count active programs
      this.prisma.program.count({
        where: { ...whereClause, status: "PUBLISHED" },
      }),
    ]);

    return {
      totalDonationsAmount: Number(totalDonationsAgg._sum.amount || 0),
      totalDistributionsAmount: Number(totalDistributionsAgg._sum.amount || 0),
      totalDonors: distinctDonorPhones.length,
      activePrograms: activeProgramsCount,
    };
  }

  /**
   * Retrieves the donation trend aggregated by period (monthly or yearly),
   * optionally filtered by programId.
   *
   * - monthly: last 12 months, grouped by YYYY-MM
   * - yearly:  last 6 years, grouped by YYYY
   */
  async getDonationTrend(
    lembagaId?: string,
    period: "monthly" | "yearly" = "monthly",
    programId?: string,
  ) {
    const whereClause: Record<string, unknown> = {
      status: "PAID",
    };

    if (lembagaId) {
      whereClause.lembagaId = lembagaId;
    }

    if (programId) {
      whereClause.programId = programId;
    }

    // Determine date range based on period
    const now = new Date();
    let startDate: Date;

    if (period === "yearly") {
      // Go back 6 years from start of current year
      startDate = new Date(now.getFullYear() - 5, 0, 1);
    } else {
      // Go back 12 months from start of current month
      startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    }

    whereClause.createdAt = { gte: startDate };

    // Fetch the data and aggregate it in memory (assuming volume is manageable).
    const donations = await this.prisma.donation.findMany({
      where: whereClause as any,
      select: {
        amount: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (period === "yearly") {
      // Group by year
      const yearlyData: Record<string, number> = {};

      donations.forEach((d) => {
        const year = d.createdAt.getFullYear().toString();
        yearlyData[year] = (yearlyData[year] ?? 0) + Number(d.amount);
      });

      // Build result for last 6 years
      const result = [];
      for (let i = 5; i >= 0; i--) {
        const year = (now.getFullYear() - i).toString();
        result.push({
          date: year,
          displayDate: year,
          amount: yearlyData[year] ?? 0,
        });
      }

      return result;
    } else {
      // Group by month (YYYY-MM)
      const monthlyData: Record<string, number> = {};

      donations.forEach((d) => {
        const month = `${d.createdAt.getFullYear()}-${String(d.createdAt.getMonth() + 1).padStart(2, "0")}`;
        monthlyData[month] = (monthlyData[month] ?? 0) + Number(d.amount);
      });

      // Build result for last 12 months
      const result = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const displayDate = d.toLocaleDateString("id-ID", {
          month: "short",
          year: "2-digit",
        });
        result.push({
          date: monthKey,
          displayDate,
          amount: monthlyData[monthKey] ?? 0,
        });
      }

      return result;
    }
  }

  /**
   * Retrieves programs sorted by highest funding progress.
   */
  async getTopPrograms(lembagaId?: string, limit: number = 5) {
    const whereClause = lembagaId ? { lembagaId } : {};

    const programs = await this.prisma.program.findMany({
      where: { ...whereClause },
      orderBy: { currentAmount: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        currentAmount: true,
        targetAmount: true,
        distributedAmount: true,
        status: true,
        lembaga: {
          select: { name: true },
        },
      },
    });

    return programs.map((p) => ({
      ...p,
      currentAmount: Number(p.currentAmount),
      targetAmount: Number(p.targetAmount),
      distributedAmount: Number(p.distributedAmount),
      progressPercentage:
        Number(p.targetAmount) > 0
          ? Math.min(100, Math.round((Number(p.currentAmount) / Number(p.targetAmount)) * 100))
          : 0,
    }));
  }
}
