import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { programsService } from "@/features/programs/services/programs.service";
import { ProgramTable } from "@/features/programs/components/ProgramTable";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button, Pagination, PageHeader, TableSkeleton } from "@/components/ui";
import { Suspense } from "react";
import { lazService } from "@/features/laz/services/laz.service";
import { UserLazFilter } from "@/features/users/components/UserLazFilter";
import { DataTableToolbar, DataTableToolbarSkeleton } from "@/components/ui/data-table";

export const metadata = {
  title: "Program Management",
};

export default async function ProgramsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  
  if (!session?.user?.permissions.includes(PERMISSIONS.PROGRAMS_READ)) {
    redirect("/dashboard");
  }

  const resolvedSearchParams = await searchParams;
  const page = typeof resolvedSearchParams.page === "string" ? parseInt(resolvedSearchParams.page) : 1;
  const limit = typeof resolvedSearchParams.limit === "string" ? parseInt(resolvedSearchParams.limit) : 10;
  const search = typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : undefined;

  const canCreate = session.user.permissions.includes(PERMISSIONS.PROGRAMS_CREATE);
  const isSuperAdmin = session.user.roleName === "SUPER_ADMIN";
  
  // If not super admin, strictly enforce lazId to their own lazId
  // If super admin, allow them to filter by lazId from query params
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
        title="Program Management"
        description="Kelola semua program kampanye zakat, infak, dan sedekah."
        action={
          canCreate ? (
            <Link href="/dashboard/programs/new">
              <Button size="sm">Buat Program</Button>
            </Link>
          ) : undefined
        }
      />

      <Suspense fallback={<DataTableToolbarSkeleton showFilter={isSuperAdmin} />}>
        <DataTableToolbar
          searchValue={search}
          searchPlaceholder="Cari judul atau deskripsi..."
          filterSlot={isSuperAdmin && allLazs.length > 0 ? <UserLazFilter lazs={allLazs} /> : undefined}
        />
      </Suspense>

      <Suspense
        key={`${search}-${page}-${limit}-${filterLazId}`}
        fallback={
          <TableSkeleton
            headers={["Judul Program", "Kategori", "Terkumpul", "Status", "Aksi"]}
            rowCount={limit}
            columnTypes={["text", "text", "text", "text", "action"]}
          />
        }
      >
        <ProgramsTableSection page={page} limit={limit} search={search} lazId={filterLazId} />
      </Suspense>
    </div>
  );
}

async function ProgramsTableSection({ page, limit, search, lazId }: { page: number; limit: number; search?: string; lazId?: string }) {
  const { items: programs, metadata } = await programsService.getDashboardPrograms(page, limit, search, lazId);

  const serializedPrograms = programs.map((p) => ({
    ...p,
    targetAmount: p.targetAmount.toNumber(),
    currentAmount: p.currentAmount.toNumber(),
    distributedAmount: p.distributedAmount.toNumber(),
  }));

  return (
    <ProgramTable 
      programs={serializedPrograms} 
      pagination={{
        currentPage: page,
        totalPages: metadata.totalPages,
        totalCount: metadata.total,
        pageSize: limit,
      }}
    />
  );
}

