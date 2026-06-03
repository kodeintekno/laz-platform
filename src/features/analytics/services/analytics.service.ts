import { analyticsRepository } from "../repositories/analytics.repository";

export const analyticsService = {
  async getDashboardOverview(lazId?: string) {
    const [metrics, recentDonations, recentDistributions] = await Promise.all([
      analyticsRepository.getDashboardMetrics(lazId),
      analyticsRepository.getRecentDonations(lazId),
      analyticsRepository.getRecentDistributions(lazId),
    ]);

    return {
      metrics,
      recentDonations,
      recentDistributions,
    };
  },
};
