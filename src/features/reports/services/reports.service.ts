import { prisma } from "@/lib/prisma";

export const reportsService = {
  /**
   * Retrieves summary statistics for the dashboard.
   */
  async getSummaryStats(lazId?: string) {
    const whereClause = lazId ? { lazId } : {};

    const [
      totalDonationsAgg,
      totalDistributionsAgg,
      donorsCount,
      activeProgramsCount
    ] = await Promise.all([
      // Sum of all PAID donations
      prisma.donation.aggregate({
        _sum: { amount: true },
        where: { ...whereClause, status: "PAID" }
      }),
      // Sum of all COMPLETED distributions
      prisma.distribution.aggregate({
        _sum: { amount: true },
        where: { ...whereClause, status: "COMPLETED" }
      }),
      // Count unique donors
      prisma.user.count({
        where: {
          donations: {
            some: { ...whereClause, status: "PAID" }
          }
        }
      }),
      // Count active programs
      prisma.program.count({
        where: { ...whereClause, status: "PUBLISHED" }
      })
    ]);

    return {
      totalDonationsAmount: Number(totalDonationsAgg._sum.amount || 0),
      totalDistributionsAmount: Number(totalDistributionsAgg._sum.amount || 0),
      totalDonors: donorsCount,
      activePrograms: activeProgramsCount
    };
  },

  /**
   * Retrieves the trend of PAID donations over the last 30 days.
   */
  async getDonationTrend(lazId?: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const whereClause = lazId ? { lazId } : {};

    // For better performance, we should ideally group by DATE(createdAt) in SQL.
    // Since Prisma doesn't have a simple group by date function yet,
    // we will fetch the data and aggregate it in memory (assuming volume is manageable).
    const donations = await prisma.donation.findMany({
      where: {
        ...whereClause,
        status: "PAID",
        createdAt: { gte: thirtyDaysAgo }
      },
      select: {
        amount: true,
        createdAt: true
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    const dailyData: Record<string, number> = {};

    donations.forEach(d => {
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
      // Format date for display: "12 Oct"
      const displayDate = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
      
      result.push({
        date: dateStr,
        displayDate,
        amount: dailyData[dateStr] || 0
      });
    }

    return result;
  },

  /**
   * Retrieves programs sorted by highest funding progress.
   */
  async getTopPrograms(lazId?: string, limit: number = 5) {
    const whereClause = lazId ? { lazId } : {};

    const programs = await prisma.program.findMany({
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
        laz: {
          select: { name: true }
        }
      }
    });

    return programs.map(p => ({
      ...p,
      currentAmount: Number(p.currentAmount),
      targetAmount: Number(p.targetAmount),
      distributedAmount: Number(p.distributedAmount),
      progressPercentage: Number(p.targetAmount) > 0 
        ? Math.min(100, Math.round((Number(p.currentAmount) / Number(p.targetAmount)) * 100))
        : 0
    }));
  }
};
