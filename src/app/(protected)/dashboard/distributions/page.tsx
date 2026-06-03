import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { distributionsService } from "@/features/distributions/services/distributions.service";
import { DistributionTable } from "@/features/distributions/components/DistributionTable";
import { redirect } from "next/navigation";
import { PageHeader, TableSkeleton } from "@/components/ui";
import { Suspense } from "react";
import { lazService } from "@/features/laz/services/laz.service";
import { UserLazFilter } from "@/features/users/components/UserLazFilter";
import { DataTableToolbar } from "@/components/ui/data-table";

export const metadata = {
  title: "Penyaluran Dana",
};

export default async function DistributionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  
  if (!session?.user?.permissions.includes(PERMISSIONS.DISTRIBUTIONS_READ)) {
    redirect("/dashboard");
  }

  const resolvedSearchParams = await searchParams;
  const page = typeof resolvedSearchParams.page === "string" ? parseInt(resolvedSearchParams.page) : 1;
  const limit = typeof resolvedSearchParams.limit === "string" ? parseInt(resolvedSearchParams.limit) : 10;
  const search = typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : undefined;

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
        title="Manajemen Penyaluran Dana"
        description="Daftar pengajuan penyaluran dana dari berbagai program kampanye."
      />

      <Suspense fallback={<div className="h-10 w-full animate-pulse bg-surface-muted rounded-xl" />}>
        <DataTableToolbar
          searchValue={search}
          searchPlaceholder="Cari rincian penyaluran atau nama program..."
          filterSlot={isSuperAdmin && allLazs.length > 0 ? <UserLazFilter lazs={allLazs} /> : undefined}
        />
      </Suspense>

      <Suspense
        key={`${search}-${page}-${limit}-${filterLazId}`}
        fallback={
          <TableSkeleton
            headers={["Program", "Rincian Penyaluran", "Nominal", "Pemohon", "Status", "Aksi"]}
            rowCount={limit}
            columnTypes={["text", "text", "text", "text", "text", "action"]}
          />
        }
      >
        <DistributionsTableSection page={page} limit={limit} search={search} lazId={filterLazId} />
      </Suspense>
    </div>
  );
}

async function DistributionsTableSection({ page, limit, search, lazId }: { page: number; limit: number; search?: string; lazId?: string }) {
  const { items: distributions, metadata } = await distributionsService.getDashboardDistributions(page, limit, search, lazId);

  return (
    <DistributionTable 
      distributions={distributions} 
      pagination={{
        currentPage: page,
        totalPages: metadata.totalPages,
        totalCount: metadata.total,
        pageSize: limit,
      }}
    />
  );
}

