import { Injectable } from "@nestjs/common";
import { AnalyticsRepository } from "./analytics.repository";

@Injectable()
export class AnalyticsService {
  constructor(private readonly analyticsRepository: AnalyticsRepository) {}

  async getDashboardOverview(lazId?: string) {
    const [metrics, recentDonations, recentDistributions] = await Promise.all([
      this.analyticsRepository.getDashboardMetrics(lazId),
      this.analyticsRepository.getRecentDonations(lazId),
      this.analyticsRepository.getRecentDistributions(lazId),
    ]);

    return {
      metrics,
      recentDonations,
      recentDistributions,
    };
  }

  async getDashboardMetrics(lazId?: string) {
    return this.analyticsRepository.getDashboardMetrics(lazId);
  }
}
