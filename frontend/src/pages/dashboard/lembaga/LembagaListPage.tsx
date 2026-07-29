import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api-client";
import { LembagaTable } from "@/features/lembaga/components/LembagaTable";
import { PageHeader, Button, TableSkeleton } from "@/components/ui";
import { DataTableToolbar } from "@/components/ui/data-table";
import { Link } from "react-router-dom";

const STATUS_TABS = [
  { value: undefined, label: "Semua" },
  { value: "PENDING", label: "Menunggu Persetujuan" },
  { value: "APPROVED", label: "Disetujui" },
  { value: "REJECTED", label: "Ditolak" },
] as const;

export function LembagaListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 10);
  const search = searchParams.get("search") ?? undefined;
  const status = searchParams.get("status") ?? undefined;

  const { data: result, isLoading } = useQuery({
    queryKey: ["lembaga", { page, limit, search, status }],
    queryFn: () => api.get<any[]>("/lembaga", { page, limit, search, status }),
  });

  const pagination = result?.meta
    ? { currentPage: result.meta.page, totalPages: result.meta.totalPages, totalCount: result.meta.total, pageSize: result.meta.limit }
    : { currentPage: 1, totalPages: 1, totalCount: 0, pageSize: limit };

  const setStatusFilter = (value?: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set("status", value);
    else next.delete("status");
    next.delete("page");
    setSearchParams(next);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Lembaga"
        description="Kelola dan verifikasi pendaftaran lembaga/yayasan yang terdaftar di platform."
        action={
          <Link to="/dashboard/lembaga/new">
            <Button size="md">Tambah Lembaga</Button>
          </Link>
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

      <DataTableToolbar searchValue={search} searchPlaceholder="Cari nama lembaga atau slug..." />

      {isLoading ? (
        <TableSkeleton
          headers={["Logo", "Nama Lembaga", "Slug", "Status", "Tanggal Terdaftar", "Aksi"]}
          rowCount={limit}
          columnTypes={["image", "text", "text", "text", "text", "action"]}
        />
      ) : (
        <LembagaTable lembagas={result?.data ?? []} search={search} pagination={pagination} />
      )}
    </div>
  );
}
