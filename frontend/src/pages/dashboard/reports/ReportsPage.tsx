import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api-client";
import { useAuth } from "@/auth/AuthProvider";
import { ReportSummaryCards } from "@/features/reports/components/ReportSummaryCards";
import { DonationTrendChart } from "@/features/reports/components/DonationTrendChart";
import { ProgramPerformanceList } from "@/features/reports/components/ProgramPerformanceList";
import { UserLembagaFilter } from "@/features/users/components/UserLembagaFilter";
import { PageHeader } from "@/components/ui";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function ReportsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const isSuperAdmin = user?.roleName === "SUPER_ADMIN";
  const lembagaId = searchParams.get("lembagaId") ?? undefined;

  const { data: lembagasResult } = useQuery({
    queryKey: ["lembaga", "options"],
    queryFn: () => api.get<any>("/lembaga/options"),
    enabled: isSuperAdmin,
  });

  const { data: statsResult, isLoading: statsLoading } = useQuery({
    queryKey: ["reports", "summary", lembagaId],
    queryFn: () => api.get<any>("/reports/summary", { lembagaId }),
  });

  const { data: trendResult } = useQuery({
    queryKey: ["reports", "trend", lembagaId],
    queryFn: () => api.get<any>("/reports/donation-trend", { lembagaId }),
  });

  const { data: topResult } = useQuery({
    queryKey: ["reports", "top-programs", lembagaId],
    queryFn: () => api.get<any>("/reports/top-programs", { lembagaId, limit: 5 }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dasbor Analitik & Kinerja"
        description="Pantau tren donasi, penyaluran dana, dan performa program secara real-time."
        action={
          isSuperAdmin && lembagasResult?.data?.length ? (
            <div className="w-64">
              <UserLembagaFilter lembagas={lembagasResult.data} />
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
