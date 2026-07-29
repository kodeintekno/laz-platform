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
   * Retrieves the trend of PAID donations over the last 30 days.
   */
  async getDonationTrend(lembagaId?: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const whereClause = lembagaId ? { lembagaId } : {};

    // Fetch the data and aggregate it in memory (assuming volume is manageable).
    const donations = await this.prisma.donation.findMany({
      where: {
        ...whereClause,
        status: "PAID",
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        amount: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const dailyData: Record<string, number> = {};

    donations.forEach((d) => {
      // Format as YYYY-MM-DD
      const dateStr = d.createdAt.toISOString().split("T")[0];
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = 0;
      }
      dailyData[dateStr] += Number(d.amount);
    });

    // Create an array for the last 30 days including empty days
    const result = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      // Format date for display: "12 Okt"
      const displayDate = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });

      result.push({
        date: dateStr,
        displayDate,
        amount: dailyData[dateStr] || 0,
      });
    }

    return result;
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
