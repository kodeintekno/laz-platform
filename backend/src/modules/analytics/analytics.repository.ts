import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get high-level KPI aggregations for the dashboard.
   */
  async getDashboardMetrics(lembagaId?: string) {
    const whereLembaga = lembagaId ? { lembagaId } : {};

    const [
      totalDonationsPaid,
      totalDistributionsCompleted,
      activeProgramsCount,
      totalUsersCount,
      totalReceivedAgg,
      totalWithdrawnAgg,
      lembagaBalance
    ] = await Promise.all([
      this.prisma.donation.aggregate({
        where: { status: "PAID", ...whereLembaga },
        _sum: { amount: true },
      }),
      this.prisma.distribution.aggregate({
        where: { status: "COMPLETED", ...whereLembaga },
        _sum: { amount: true },
      }),
      this.prisma.program.count({
        where: { status: "PUBLISHED", ...whereLembaga },
      }),
      this.prisma.user.count({
        where: { status: "ACTIVE", ...whereLembaga },
      }),
      this.prisma.donation.aggregate({
        where: { status: "PAID", ...whereLembaga },
        _sum: { institutionAmount: true },
      }),
      this.prisma.withdrawal.aggregate({
        where: { status: "COMPLETED", ...whereLembaga },
        _sum: { amount: true },
      }),
      lembagaId 
        ? this.prisma.institutionBalance.findUnique({ where: { lembagaId } })
        : Promise.resolve(null)
    ]);

    return {
      totalDonations: Number(totalDonationsPaid._sum.amount || 0),
      totalDistributed: Number(totalDistributionsCompleted._sum.amount || 0),
      activePrograms: activeProgramsCount,
      activeUsers: totalUsersCount,
      totalReceived: Number(totalReceivedAgg._sum.institutionAmount || 0),
      totalWithdrawn: Number(totalWithdrawnAgg._sum.amount || 0),
      availableBalance: lembagaBalance ? Number(lembagaBalance.balance || 0) : 0,
      reservedBalance: lembagaBalance ? Number(lembagaBalance.reservedBalance || 0) : 0,
    };
  }

  /**
   * Get the 5 most recent PAID donations.
   */
  async getRecentDonations(lembagaId?: string) {
    return this.prisma.donation.findMany({
      where: { status: "PAID", ...(lembagaId ? { lembagaId } : {}) },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        program: { select: { title: true } },
      },
    });
  }

  /**
   * Get the 5 most recent COMPLETED distributions.
   */
  async getRecentDistributions(lembagaId?: string) {
    return this.prisma.distribution.findMany({
      where: { status: "COMPLETED", ...(lembagaId ? { lembagaId } : {}) },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        program: { select: { title: true } },
      },
    });
  }

  /** Statistik platform lintas-tenant — SUPER_ADMIN only. */
  async getPlatformOverview() {
    const [
      lembagaPending,
      lembagaApproved,
      lembagaRejected,
      totalPrograms,
      totalDonationsAgg,
      totalVolunteers,
      pendingVolunteerApplications,
      pendingWithdrawalsAgg,
      processingPayoutsAgg
    ] = await Promise.all([
      this.prisma.lembaga.count({ where: { status: "PENDING" } }),
      this.prisma.lembaga.count({ where: { status: "APPROVED" } }),
      this.prisma.lembaga.count({ where: { status: "REJECTED" } }),
      this.prisma.program.count(),
      this.prisma.donation.aggregate({ 
        where: { status: "PAID" }, 
        _sum: { amount: true, platformFee: true, institutionAmount: true },
        _count: { id: true }
      }),
      this.prisma.volunteer.count(),
      this.prisma.volunteerApplication.count({ where: { status: "PENDING" } }),
      this.prisma.withdrawal.aggregate({ where: { status: "PENDING" }, _sum: { amount: true } }),
      this.prisma.payout.aggregate({ where: { status: { in: ["REQUESTED", "ACCEPTED", "PROCESSING"] } }, _sum: { amount: true } }),
    ]);

    return {
      lembaga: { pending: lembagaPending, approved: lembagaApproved, rejected: lembagaRejected },
      totalPrograms,
      totalDonationsAmount: Number(totalDonationsAgg._sum.amount || 0),
      platformRevenue: Number(totalDonationsAgg._sum.platformFee || 0),
      institutionShare: Number(totalDonationsAgg._sum.institutionAmount || 0),
      successfulPayments: totalDonationsAgg._count.id,
      pendingWithdrawalsAmount: Number(pendingWithdrawalsAgg._sum.amount || 0),
      processingPayoutsAmount: Number(processingPayoutsAgg._sum.amount || 0),
      totalVolunteers,
      pendingVolunteerApplications,
    };
  }
}
