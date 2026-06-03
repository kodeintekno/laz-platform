import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { reportsService } from "@/features/reports/services/reports.service";
import { ReportSummaryCards } from "@/features/reports/components/ReportSummaryCards";
import { DonationTrendChart } from "@/features/reports/components/DonationTrendChart";
import { ProgramPerformanceList } from "@/features/reports/components/ProgramPerformanceList";
import { UserLazFilter } from "@/features/users/components/UserLazFilter";
import { lazService } from "@/features/laz/services/laz.service";
import { Suspense } from "react";

export const metadata = {
  title: "Reports",
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();

  if (!session?.user?.permissions.includes(PERMISSIONS.REPORTS_READ)) {
    redirect("/dashboard");
  }

  const resolvedSearchParams = await searchParams;
  const isSuperAdmin = session.user.roleName === "SUPER_ADMIN";
  const filterLazId = isSuperAdmin
    ? (typeof resolvedSearchParams.lazId === "string" ? resolvedSearchParams.lazId : undefined)
    : session.user.lazId;

  let allLazs: { id: string; name: string }[] = [];
  if (isSuperAdmin) {
    const { items } = await lazService.getLazs(1, 100);
    allLazs = items;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dasbor Analitik & Kinerja"
        description="Pantau tren donasi, penyaluran dana, dan performa program secara real-time."
        action={
          isSuperAdmin && allLazs.length > 0 ? (
            <div className="w-64">
              <UserLazFilter lazs={allLazs} />
            </div>
          ) : undefined
        }
      />

      <Suspense fallback={<div className="h-32 bg-surface-muted animate-pulse rounded-2xl" />}>
        <AnalyticsContent lazId={filterLazId} />
      </Suspense>
    </div>
  );
}

async function AnalyticsContent({ lazId }: { lazId?: string }) {
  const [stats, trend, topPrograms] = await Promise.all([
    reportsService.getSummaryStats(lazId),
    reportsService.getDonationTrend(lazId),
    reportsService.getTopPrograms(lazId, 5),
  ]);

  return (
    <div className="space-y-6">
      <ReportSummaryCards stats={stats} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DonationTrendChart data={trend} />
        <ProgramPerformanceList programs={topPrograms} />
      </div>
    </div>
  );
}
