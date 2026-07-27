import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api-client";
import { useAuth } from "@/auth/AuthProvider";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@shared/constants/permissions";
import { DonationTable } from "@/features/donations/components/DonationTable";
import { PageHeader, Button, TableSkeleton } from "@/components/ui";
import { DataTableToolbar } from "@/components/ui/data-table";
import { UserLembagaFilter } from "@/features/users/components/UserLembagaFilter";
import { Link } from "react-router-dom";

export function DonationsListPage() {
  const { user } = useAuth();
  const { can } = usePermission();
  const [searchParams] = useSearchParams();
  const isSuperAdmin = user?.roleName === "SUPER_ADMIN";

  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 10);
  const search = searchParams.get("search") ?? undefined;
  const lembagaId = searchParams.get("lembagaId") ?? undefined;

  const { data: result, isLoading } = useQuery({
    queryKey: ["donations", { page, limit, search, lembagaId }],
    queryFn: () => api.get<any[]>("/donations", { page, limit, search, lembagaId }),
  });

  const { data: lembagasResult } = useQuery({
    queryKey: ["lembaga", "options"],
    queryFn: () => api.get<any>("/lembaga/options"),
    enabled: isSuperAdmin,
  });

  const donations = (result?.data ?? []).map((d: any) => ({
    ...d,
    amount: Number(d.amount),
    payment: d.payment ? { ...d.payment, amount: Number(d.payment.amount) } : null,
  }));

  const pagination = result?.meta
    ? { currentPage: result.meta.page, totalPages: result.meta.totalPages, totalCount: result.meta.total, pageSize: result.meta.limit }
    : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Donasi Masuk"
        description="Daftar semua transaksi donasi yang masuk ke platform."
        action={
          can(PERMISSIONS.DONATIONS_CREATE) ? (
            <Link to="/dashboard/donations/new">
              <Button intent="primary">Tambah Donasi</Button>
            </Link>
          ) : undefined
        }
      />

      <DataTableToolbar
        searchValue={search}
        searchPlaceholder="Cari donatur atau program..."
        filterSlot={
          isSuperAdmin && lembagasResult?.data?.length ? (
            <UserLembagaFilter lembagas={lembagasResult.data} />
          ) : undefined
        }
      />

      {isLoading ? (
        <TableSkeleton
          headers={["Donatur", "Program", "Nominal", "Status", "Tanggal", "Aksi"]}
          rowCount={limit}
          columnTypes={["avatar", "text", "text", "text", "text", "action"]}
        />
      ) : (
        <DonationTable donations={donations as any} pagination={pagination} />
      )}
    </div>
  );
}
