import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api-client";
import { LazTable } from "@/features/laz/components/LazTable";
import { PageHeader, Button, TableSkeleton } from "@/components/ui";
import { DataTableToolbar } from "@/components/ui/data-table";
import { Link } from "react-router-dom";

export function LazListPage() {
  const [searchParams] = useSearchParams();

  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 10);
  const search = searchParams.get("search") ?? undefined;

  const { data: result, isLoading } = useQuery({
    queryKey: ["laz", { page, limit, search }],
    queryFn: () => api.get<any[]>("/laz", { page, limit, search }),
  });

  const pagination = result?.meta
    ? { currentPage: result.meta.page, totalPages: result.meta.totalPages, totalCount: result.meta.total, pageSize: result.meta.limit }
    : { currentPage: 1, totalPages: 1, totalCount: 0, pageSize: limit };

  return (
    <div className="space-y-6">
      <PageHeader
        title="LAZ Management"
        description="Kelola lembaga-lembaga amil zakat (LAZ) yang terdaftar."
        action={
          <Link to="/dashboard/laz/new">
            <Button size="md">Tambah LAZ</Button>
          </Link>
        }
      />

      <DataTableToolbar searchValue={search} searchPlaceholder="Cari nama organisasi atau slug..." />

      {isLoading ? (
        <TableSkeleton
          headers={["Logo", "Nama Organisasi", "Slug", "Status", "Tanggal Terdaftar", "Aksi"]}
          rowCount={limit}
          columnTypes={["image", "text", "text", "text", "text", "action"]}
        />
      ) : (
        <LazTable lazs={result?.data ?? []} search={search} pagination={pagination} />
      )}
    </div>
  );
}
