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
    ]);

    return {
      totalDonations: Number(totalDonationsPaid._sum.amount || 0),
      totalDistributed: Number(totalDistributionsCompleted._sum.amount || 0),
      activePrograms: activeProgramsCount,
      activeUsers: totalUsersCount,
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
    ] = await Promise.all([
      this.prisma.lembaga.count({ where: { status: "PENDING" } }),
      this.prisma.lembaga.count({ where: { status: "APPROVED" } }),
      this.prisma.lembaga.count({ where: { status: "REJECTED" } }),
      this.prisma.program.count(),
      this.prisma.donation.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
      this.prisma.volunteer.count(),
      this.prisma.volunteerApplication.count({ where: { status: "PENDING" } }),
    ]);

    return {
      lembaga: { pending: lembagaPending, approved: lembagaApproved, rejected: lembagaRejected },
      totalPrograms,
      totalDonationsAmount: Number(totalDonationsAgg._sum.amount || 0),
      totalVolunteers,
      pendingVolunteerApplications,
    };
  }
}
