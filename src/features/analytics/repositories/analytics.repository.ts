import { prisma } from "@/lib/prisma";

export const analyticsRepository = {
  /**
   * Get high-level KPI aggregations for the dashboard.
   */
  async getDashboardMetrics() {
    const [
      totalDonationsPaid,
      totalDistributionsCompleted,
      activeProgramsCount,
      totalUsersCount,
    ] = await Promise.all([
      prisma.donation.aggregate({
        where: { status: "PAID" },
        _sum: { amount: true },
      }),
      prisma.distribution.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amount: true },
      }),
      prisma.program.count({
        where: { status: "PUBLISHED" },
      }),
      prisma.user.count({
        where: { status: "ACTIVE" },
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
  async getRecentDonations() {
    return prisma.donation.findMany({
      where: { status: "PAID" },
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
  async getRecentDistributions() {
    return prisma.distribution.findMany({
      where: { status: "COMPLETED" },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        program: { select: { title: true } },
      },
    });
  },
};
