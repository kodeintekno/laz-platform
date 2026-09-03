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
      mustahiqDistributedAgg,
      amilDistributedAgg,
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
        _sum: { institutionAmount: true, netAmount: true, amilInstitutionAmount: true },
      }),
      this.prisma.distribution.aggregate({
        where: { status: "COMPLETED", fundSource: "MUSTAHIQ", ...whereLembaga },
        _sum: { amount: true },
      }),
      this.prisma.distribution.aggregate({
        where: { status: "COMPLETED", fundSource: "AMIL", ...whereLembaga },
        _sum: { amount: true },
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
      // Saldo dana pelaporan tidak berubah saat withdrawal. Keduanya hanya
      // berkurang ketika distribution dengan sumber terkait dicatat.
      mustahiqBalance: Math.max(
        0,
        Number(totalReceivedAgg._sum.netAmount || 0) - Number(mustahiqDistributedAgg._sum.amount || 0),
      ),
      amilBalance: Math.max(
        0,
        Number(totalReceivedAgg._sum.amilInstitutionAmount || 0) - Number(amilDistributedAgg._sum.amount || 0),
      ),
      gatewayMustahiqBalance: lembagaBalance ? Number(lembagaBalance.mustahiqBalance || 0) : 0,
      gatewayAmilBalance: lembagaBalance ? Number(lembagaBalance.amilBalance || 0) : 0,
      reservedBalance: lembagaBalance ? Number(lembagaBalance.reservedBalance || 0) : 0,
      reservedMustahiqBalance: lembagaBalance ? Number(lembagaBalance.reservedMustahiqBalance || 0) : 0,
      reservedAmilBalance: lembagaBalance ? Number(lembagaBalance.reservedAmilBalance || 0) : 0,
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

  /** Statistik platform lintas-tenant untuk staf dengan akses keuangan platform. */
  async getPlatformOverview() {
    const [
      lembagaPending,
      lembagaApproved,
      lembagaRejected,
      totalPrograms,
      totalDonationsAgg,
      platformBalance,
      institutionBalanceAgg,
      totalVolunteers,
      pendingVolunteerApplications
    ] = await Promise.all([
      this.prisma.lembaga.count({ where: { status: "PENDING" } }),
      this.prisma.lembaga.count({ where: { status: "APPROVED" } }),
      this.prisma.lembaga.count({ where: { status: "REJECTED" } }),
      this.prisma.program.count(),
      this.prisma.donation.aggregate({ 
        where: { status: "PAID" }, 
        _sum: { amount: true },
        _count: { id: true }
      }),
      this.prisma.platformBalance.findUnique({ where: { id: "platform" } }),
      this.prisma.institutionBalance.aggregate({
        _sum: { balance: true, reservedBalance: true },
      }),
      this.prisma.volunteer.count(),
      this.prisma.volunteerApplication.count({ where: { status: "PENDING" } }),
    ]);

    const platformAvailableBalance = Number(platformBalance?.balance || 0);
    const platformReservedBalance = Number(platformBalance?.reservedBalance || 0);
    const institutionAvailableBalance = Number(institutionBalanceAgg._sum.balance || 0);
    const institutionReservedBalance = Number(institutionBalanceAgg._sum.reservedBalance || 0);
    const totalMoneyIn = Number(totalDonationsAgg._sum.amount || 0);

    return {
      lembaga: { pending: lembagaPending, approved: lembagaApproved, rejected: lembagaRejected },
      totalPrograms,
      // Nilai uang di ringkasan ini berasal langsung dari transaksi PAID dan
      // tabel saldo gateway, bukan dari persentase statis.
      totalMoneyIn,
      totalDonationsAmount: totalMoneyIn,
      platformBalance: {
        available: platformAvailableBalance,
        reserved: platformReservedBalance,
        total: platformAvailableBalance + platformReservedBalance,
      },
      institutionBalance: {
        available: institutionAvailableBalance,
        reserved: institutionReservedBalance,
        total: institutionAvailableBalance + institutionReservedBalance,
      },
      successfulPayments: totalDonationsAgg._count.id,
      totalVolunteers,
      pendingVolunteerApplications,
    };
  }
}
