import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api-client";
import { useAuth } from "@/auth/AuthProvider";
import { PaymentTable } from "@/features/payments/components/PaymentTable";
import { PageHeader, TableSkeleton } from "@/components/ui";
import { DataTableToolbar } from "@/components/ui/data-table";
import { UserLazFilter } from "@/features/users/components/UserLazFilter";

export function PaymentsListPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const isSuperAdmin = user?.roleName === "SUPER_ADMIN";

  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 10);
  const search = searchParams.get("search") ?? undefined;
  const lazId = searchParams.get("lazId") ?? undefined;

  const { data: result, isLoading } = useQuery({
    queryKey: ["payments", { page, limit, search, lazId }],
    queryFn: () => api.get<any[]>("/payments", { page, limit, search, lazId }),
  });

  const { data: lazsResult } = useQuery({
    queryKey: ["laz", "options"],
    queryFn: () => api.get<any>("/laz/options"),
    enabled: isSuperAdmin,
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
          isSuperAdmin && lazsResult?.data?.length ? (
            <UserLazFilter lazs={lazsResult.data} />
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
