import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api-client";
import { useAuth } from "@/auth/AuthProvider";
import { ReportSummaryCards } from "@/features/reports/components/ReportSummaryCards";
import { DonationTrendChart } from "@/features/reports/components/DonationTrendChart";
import { ProgramPerformanceList } from "@/features/reports/components/ProgramPerformanceList";
import { UserLazFilter } from "@/features/users/components/UserLazFilter";
import { PageHeader } from "@/components/ui";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function ReportsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const isSuperAdmin = user?.roleName === "SUPER_ADMIN";
  const lazId = searchParams.get("lazId") ?? undefined;

  const { data: lazsResult } = useQuery({
    queryKey: ["laz", "options"],
    queryFn: () => api.get<any>("/laz/options"),
    enabled: isSuperAdmin,
  });

  const { data: statsResult, isLoading: statsLoading } = useQuery({
    queryKey: ["reports", "summary", lazId],
    queryFn: () => api.get<any>("/reports/summary", { lazId }),
  });

  const { data: trendResult } = useQuery({
    queryKey: ["reports", "trend", lazId],
    queryFn: () => api.get<any>("/reports/donation-trend", { lazId }),
  });

  const { data: topResult } = useQuery({
    queryKey: ["reports", "top-programs", lazId],
    queryFn: () => api.get<any>("/reports/top-programs", { lazId, limit: 5 }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dasbor Analitik & Kinerja"
        description="Pantau tren donasi, penyaluran dana, dan performa program secara real-time."
        action={
          isSuperAdmin && lazsResult?.data?.length ? (
            <div className="w-64">
              <UserLazFilter lazs={lazsResult.data} />
            </div>
          ) : undefined
        }
      />

      {statsLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner /></div>
      ) : (
        <div className="space-y-6">
          <ReportSummaryCards stats={statsResult?.data ?? {}} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <DonationTrendChart data={trendResult?.data ?? []} />
            <ProgramPerformanceList programs={topResult?.data ?? []} />
          </div>
        </div>
      )}
    </div>
  );
}
