import { prisma } from "@/lib/prisma";

export const analyticsRepository = {
  /**
   * Get high-level KPI aggregations for the dashboard.
   */
  async getDashboardMetrics(lazId?: string) {
    const whereLaz = lazId ? { lazId } : {};

    const [
      totalDonationsPaid,
      totalDistributionsCompleted,
      activeProgramsCount,
      totalUsersCount,
    ] = await Promise.all([
      prisma.donation.aggregate({
        where: { status: "PAID", ...whereLaz },
        _sum: { amount: true },
      }),
      prisma.distribution.aggregate({
        where: { status: "COMPLETED", ...whereLaz },
        _sum: { amount: true },
      }),
      prisma.program.count({
        where: { status: "PUBLISHED", ...whereLaz },
      }),
      prisma.user.count({
        where: { status: "ACTIVE", ...whereLaz },
      }),
    ]);

    return {
      totalDonations: Number(totalDonationsPaid._sum.amount || 0),
      totalDistributed: Number(totalDistributionsCompleted._sum.amount || 0),
      activePrograms: activeProgramsCount,
      activeUsers: totalUsersCount,
    };
  },

  /**
   * Get the 5 most recent PAID donations.
   */
  async getRecentDonations(lazId?: string) {
    return prisma.donation.findMany({
      where: { status: "PAID", ...(lazId ? { lazId } : {}) },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        program: { select: { title: true } },
        user: { select: { name: true } },
      },
    });
  },

  /**
   * Get the 5 most recent COMPLETED distributions.
   */
  async getRecentDistributions(lazId?: string) {
    return prisma.distribution.findMany({
      where: { status: "COMPLETED", ...(lazId ? { lazId } : {}) },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        program: { select: { title: true } },
      },
    });
  },
};
