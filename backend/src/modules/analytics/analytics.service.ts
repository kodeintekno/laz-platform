import { Injectable } from "@nestjs/common";
import { AnalyticsRepository } from "./analytics.repository";

@Injectable()
export class AnalyticsService {
  constructor(private readonly analyticsRepository: AnalyticsRepository) {}

  async getDashboardOverview(lembagaId?: string) {
    const [metrics, recentDonations, recentDistributions] = await Promise.all([
      this.analyticsRepository.getDashboardMetrics(lembagaId),
      this.analyticsRepository.getRecentDonations(lembagaId),
      this.analyticsRepository.getRecentDistributions(lembagaId),
    ]);

    return {
      metrics,
      recentDonations,
      recentDistributions,
    };
  }

  async getDashboardMetrics(lembagaId?: string) {
    return this.analyticsRepository.getDashboardMetrics(lembagaId);
  }

  /** Statistik platform lintas-tenant — hanya untuk SUPER_ADMIN. */
  async getPlatformOverview() {
    return this.analyticsRepository.getPlatformOverview();
  }
}
