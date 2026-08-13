import { useQuery } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "@/lib/api-client";
import { useAuth } from "@/auth/AuthProvider";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@shared/constants/permissions";
import { JournalTable } from "@/features/journal/components/JournalTable";
import { PageHeader, Button, TableSkeleton } from "@/components/ui";
import { DataTableToolbar } from "@/components/ui/data-table";
import { UserLembagaFilter } from "@/features/users/components/UserLembagaFilter";
import { Plus } from "lucide-react";

export function JournalListPage() {
  const { user } = useAuth();
  const { can } = usePermission();
  const [searchParams] = useSearchParams();
  const isSuperAdmin = user?.roleName === "SUPER_ADMIN";

  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 10);
  const search = searchParams.get("search") ?? undefined;
  const lembagaId = searchParams.get("lembagaId") ?? undefined;

  const params = isSuperAdmin && lembagaId ? { page, limit, search, lembagaId } : { page, limit, search };
  const enabled = isSuperAdmin ? !!lembagaId : true;

  const { data: result, isLoading } = useQuery({
    queryKey: ["journal", { page, limit, search, lembagaId }],
    queryFn: () => api.get<any[]>("/journal", params),
    enabled,
  });

  const { data: lembagasResult } = useQuery({
    queryKey: ["lembaga", "options"],
    queryFn: () => api.get<any>("/lembaga/options"),
    enabled: isSuperAdmin,
  });

  const pagination = result?.meta
    ? { currentPage: result.meta.page, totalPages: result.meta.totalPages, totalCount: result.meta.total, pageSize: result.meta.limit }
    : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jurnal Umum"
        description="Pencatatan transaksi akuntansi double-entry."
        action={
          can(PERMISSIONS.JOURNAL_CREATE) && (!isSuperAdmin || lembagaId) ? (
            <Link to={isSuperAdmin ? `/dashboard/journal/new?lembagaId=${lembagaId}` : "/dashboard/journal/new"}>
              <Button intent="primary">
                <Plus className="w-4 h-4 mr-2" />
                Buat Draft Jurnal
              </Button>
            </Link>
          ) : undefined
        }
      />

      <DataTableToolbar
        searchValue={search}
        searchPlaceholder="Cari nomor jurnal atau deskripsi..."
        filterSlot={
          isSuperAdmin && lembagasResult?.data?.length ? (
            <UserLembagaFilter lembagas={lembagasResult.data} />
          ) : undefined
        }
      />

      {isSuperAdmin && !lembagaId ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-border rounded-xl bg-surface">
          <p className="text-secondary">Pilih lembaga di atas untuk melihat daftar Jurnal Umum.</p>
        </div>
      ) : isLoading ? (
        <TableSkeleton
          headers={["No. Jurnal & Tanggal", "Deskripsi", "Total (Rp)", "Status", "Aksi"]}
          rowCount={limit}
          columnTypes={["text", "text", "text", "text", "action"]}
        />
      ) : (
        <JournalTable journals={result?.data ?? []} pagination={pagination} />
      )}
    </div>
  );
}
