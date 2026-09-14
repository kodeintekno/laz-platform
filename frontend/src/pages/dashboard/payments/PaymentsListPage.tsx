import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api-client";
import { PaymentTable } from "@/features/payments/components/PaymentTable";
import { PageHeader, TableSkeleton } from "@/components/ui";
import { DataTableToolbar } from "@/components/ui/data-table";
import { UserLembagaFilter } from "@/features/users/components/UserLembagaFilter";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@shared/constants/permissions";

export function PaymentsListPage() {
  const { can } = usePermission();
  const [searchParams] = useSearchParams();
  const hasPlatformFinanceAccess = can(PERMISSIONS.PLATFORM_FINANCE_READ);
  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 10);
  const search = searchParams.get("search") ?? undefined;
  const lembagaId = searchParams.get("lembagaId") ?? undefined;

  const { data: result, isLoading } = useQuery({
    queryKey: ["payments", { page, limit, search, lembagaId }],
    queryFn: () => api.get<any[]>("/payments", { page, limit, search, lembagaId }),
  });

  const { data: lembagasResult } = useQuery({
    queryKey: ["lembaga", "options"],
    queryFn: () => api.get<any>("/lembaga/options"),
    enabled: hasPlatformFinanceAccess,
  });

  const payments = (result?.data ?? []).map((p: any) => ({
    ...p,
    amount: Number(p.amount),
    donation: p.donation ? { ...p.donation, amount: Number(p.donation.amount) } : null,
  }));

  const pagination = result?.meta
    ? { currentPage: result.meta.page, totalPages: result.meta.totalPages, totalCount: result.meta.total, pageSize: result.meta.limit }
    : { currentPage: 1, totalPages: 1, totalCount: 0, pageSize: limit };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Pembayaran"
        description="Kelola transaksi pembayaran donasi, detail invoice, dan integrasi payment gateway."
      />

      <DataTableToolbar
        searchValue={search}
        searchPlaceholder="Cari invoice, program, atau donatur..."
        filterSlot={
          hasPlatformFinanceAccess && lembagasResult?.data?.length ? (
            <UserLembagaFilter lembagas={lembagasResult.data} />
          ) : undefined
        }
      />

      {isLoading ? (
        <TableSkeleton
          headers={["Invoice / Ref", "Program", "Donatur", "Nominal", "Metode", "Status", "Tanggal"]}
          rowCount={limit}
          columnTypes={["text", "text", "avatar", "text", "text", "text", "text"]}
        />
      ) : (
        <PaymentTable payments={payments as any} pagination={pagination} />
      )}
    </div>
  );
}
