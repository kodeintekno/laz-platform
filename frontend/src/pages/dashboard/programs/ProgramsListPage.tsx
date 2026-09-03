import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api-client";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@shared/constants/permissions";
import { ProgramTable } from "@/features/programs/components/ProgramTable";
import { PageHeader, Button, TableSkeleton } from "@/components/ui";
import { DataTableToolbar } from "@/components/ui/data-table";
import { UserLembagaFilter } from "@/features/users/components/UserLembagaFilter";
import { Link } from "react-router-dom";

const STATUS_TABS = [
  { value: undefined, label: "Semua" },
  { value: "PENDING_REVIEW", label: "Menunggu Review" },
  { value: "PUBLISHED", label: "Published" },
  { value: "DRAFT", label: "Draft" },
  { value: "REJECTED", label: "Ditolak" },
] as const;

export function ProgramsListPage() {
  const { can } = usePermission();
  const [searchParams, setSearchParams] = useSearchParams();
  const hasPlatformFinanceAccess = can(PERMISSIONS.PLATFORM_FINANCE_READ);
  const canApprovePrograms = can(PERMISSIONS.PROGRAMS_APPROVE);

  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 10);
  const search = searchParams.get("search") ?? undefined;
  const lembagaId = searchParams.get("lembagaId") ?? undefined;
  const status = searchParams.get("status") ?? undefined;

  const { data: result, isLoading } = useQuery({
    queryKey: ["programs", { page, limit, search, lembagaId, status }],
    queryFn: () => api.get<any[]>("/programs", { page, limit, search, lembagaId, status }),
  });

  const setStatusFilter = (value?: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set("status", value);
    else next.delete("status");
    next.delete("page");
    setSearchParams(next);
  };

  const { data: lembagasResult } = useQuery({
    queryKey: ["lembaga", "options"],
    queryFn: () => api.get<any>("/lembaga/options"),
    enabled: hasPlatformFinanceAccess,
  });

  const programs = (result?.data ?? []).map((p: any) => ({
    ...p,
    targetAmount: Number(p.targetAmount),
    currentAmount: Number(p.currentAmount),
    distributedAmount: Number(p.distributedAmount),
    amilPlatformPercentage: Number(p.amilPlatformPercentage),
    amilInstitutionPercentage: Number(p.amilInstitutionPercentage),
    amilMaxTotalPercentage: Number(p.amilMaxTotalPercentage),
    requestedAmilPlatformPercentage: p.requestedAmilPlatformPercentage == null
      ? null
      : Number(p.requestedAmilPlatformPercentage),
  }));

  const pagination = result?.meta
    ? { currentPage: result.meta.page, totalPages: result.meta.totalPages, totalCount: result.meta.total, pageSize: result.meta.limit }
    : { currentPage: 1, totalPages: 1, totalCount: 0, pageSize: limit };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Program Management"
        description="Kelola semua program kampanye zakat dan Infak/Sedekah."
        action={
          can(PERMISSIONS.PROGRAMS_CREATE) && !hasPlatformFinanceAccess ? (
            <Link to="/dashboard/programs/new">
              <Button intent="primary">Buat Program</Button>
            </Link>
          ) : undefined
        }
      />

      <div className="flex flex-wrap gap-2 border-b border-border/40 pb-3">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition ${
              status === tab.value
                ? "bg-brand-primary text-white"
                : "bg-surface-muted text-secondary hover:text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <DataTableToolbar
        searchValue={search}
        searchPlaceholder="Cari judul atau deskripsi..."
        filterSlot={
          hasPlatformFinanceAccess && lembagasResult?.data?.length ? (
            <UserLembagaFilter lembagas={lembagasResult.data} />
          ) : undefined
        }
      />

      {isLoading ? (
        <TableSkeleton
          headers={["Judul Program", "Kategori", "Terkumpul", canApprovePrograms ? "Perubahan % Amil Platform" : "Riwayat Pengajuan", "Status", "Aksi"]}
          rowCount={limit}
          columnTypes={["text", "text", "text", "text", "text", "action"]}
        />
      ) : (
        <ProgramTable programs={programs} pagination={pagination} />
      )}
    </div>
  );
}
