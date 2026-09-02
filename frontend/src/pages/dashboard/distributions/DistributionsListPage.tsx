import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api-client";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@shared/constants/permissions";
import { DistributionTable } from "@/features/distributions/components/DistributionTable";
import { SelectProgramForDistributionModal } from "@/features/distributions/components/SelectProgramForDistributionModal";
import { PageHeader, Button, TableSkeleton } from "@/components/ui";
import { DataTableToolbar } from "@/components/ui/data-table";
import { UserLembagaFilter } from "@/features/users/components/UserLembagaFilter";
import { HandCoins, CircleDollarSign } from "lucide-react";

export function DistributionsListPage() {
  const { can } = usePermission();
  const [searchParams] = useSearchParams();
  const hasPlatformFinanceAccess = can(PERMISSIONS.PLATFORM_FINANCE_READ);
  const [isSelectProgramModalOpen, setIsSelectProgramModalOpen] = useState(false);

  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 10);
  const search = searchParams.get("search") ?? undefined;
  const lembagaId = searchParams.get("lembagaId") ?? undefined;

  const { data: result, isLoading } = useQuery({
    queryKey: ["distributions", { page, limit, search, lembagaId }],
    queryFn: () => api.get<any[]>("/distributions", { page, limit, search, lembagaId }),
  });

  const { data: lembagasResult } = useQuery({
    queryKey: ["lembaga", "options"],
    queryFn: () => api.get<any>("/lembaga/options"),
    enabled: hasPlatformFinanceAccess,
  });

  const { data: overviewResult, isLoading: isBalanceLoading } = useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: () => api.get<any>("/dashboard/overview"),
    enabled: !hasPlatformFinanceAccess,
  });

  const metrics = overviewResult?.data?.metrics;
  const formatBalance = (value: number) => new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);

  const pagination = result?.meta
    ? { currentPage: result.meta.page, totalPages: result.meta.totalPages, totalCount: result.meta.total, pageSize: result.meta.limit }
    : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Penyaluran Dana"
        description="Daftar pengajuan penyaluran dana dari berbagai program kampanye."
        action={
          can(PERMISSIONS.DISTRIBUTIONS_MANAGE) && !hasPlatformFinanceAccess ? (
            <Button
              intent="primary"
              onClick={() => setIsSelectProgramModalOpen(true)}
            >
              Tambah Penyaluran Dana
            </Button>
          ) : undefined
        }
      />

      {!hasPlatformFinanceAccess && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            {
              label: "Saldo Utama / Mustahiq",
              value: metrics?.mustahiqBalance,
              description: "Dana utama lembaga yang tersedia untuk penyaluran program",
              Icon: HandCoins,
              colorClass: "bg-success/10 text-success",
            },
            {
              label: "Saldo Amil Lembaga",
              value: metrics?.amilBalance,
              description: "Dana operasional amil lembaga yang tersedia",
              Icon: CircleDollarSign,
              colorClass: "bg-brand-primary/10 text-brand-primary",
            },
          ].map(({ label, value, description, Icon, colorClass }) => (
            <div key={label} className="rounded-2xl border border-border/40 bg-surface p-5">
              <div className="flex items-start gap-4">
                <div className={`rounded-xl p-3 ${colorClass}`}><Icon className="h-6 w-6" /></div>
                <div>
                  <p className="text-sm font-medium text-secondary">{label}</p>
                  <p className="mt-1 text-2xl font-semibold text-primary">
                    {isBalanceLoading || value === undefined ? "—" : formatBalance(value)}
                  </p>
                  <p className="mt-1 text-xs text-secondary">{description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <DataTableToolbar
        searchValue={search}
        searchPlaceholder="Cari rincian penyaluran atau nama program..."
        filterSlot={
          hasPlatformFinanceAccess && lembagasResult?.data?.length ? (
            <UserLembagaFilter lembagas={lembagasResult.data} />
          ) : undefined
        }
      />

      {isLoading ? (
        <TableSkeleton
          headers={["Program", "Rincian Penyaluran", "Nominal", "Sumber Dana", "Dicatat Oleh", "Status"]}
          rowCount={limit}
          columnTypes={["text", "text", "text", "text", "text", "text"]}
        />
      ) : (
        <DistributionTable distributions={result?.data ?? []} pagination={pagination} />
      )}

      <SelectProgramForDistributionModal
        isOpen={isSelectProgramModalOpen}
        onClose={() => setIsSelectProgramModalOpen(false)}
      />
    </div>
  );
}
