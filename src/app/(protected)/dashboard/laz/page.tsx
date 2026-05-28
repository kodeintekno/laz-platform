import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { lazService } from "@/features/laz/services/laz.service";
import { LazTable } from "@/features/laz/components/LazTable";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui";
import { logger } from "@/lib/logger";
import { Suspense } from "react";
import { DataTableToolbar, DataTableToolbarSkeleton } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/Skeleton";

export const metadata = {
  title: "LAZ Management",
};

export const dynamic = "force-dynamic";

export default async function LazsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();

  if (!session?.user?.permissions.includes(PERMISSIONS.LAZ_MANAGE)) {
    redirect("/dashboard");
  }

  const resolvedSearchParams = await searchParams;

  logger.info({ resolvedSearchParams }, "LAZ Page search params resolved");
  const page = typeof resolvedSearchParams.page === "string" ? parseInt(resolvedSearchParams.page) : 1;
  const limit = typeof resolvedSearchParams.limit === "string" ? parseInt(resolvedSearchParams.limit) : 10;
  const search = typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : undefined;

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-primary">LAZ Management</h1>
          <p className="mt-2 text-sm text-secondary">
            Kelola lembaga-lembaga amil zakat (LAZ) yang terdaftar di platform multi-tenant.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Link href="/dashboard/laz/new">
            <Button size="md">Tambah LAZ</Button>
          </Link>
        </div>
      </div>

      <Suspense fallback={<DataTableToolbarSkeleton />}>
        <DataTableToolbar searchValue={search} searchPlaceholder="Cari nama organisasi atau slug..." />
      </Suspense>

      <Suspense key={`${search}-${page}-${limit}`} fallback={<TableSkeleton limit={limit} />}>
        <LazTableSection page={page} limit={limit} search={search} />
      </Suspense>
    </div>
  );
}

async function LazTableSection({ page, limit, search }: { page: number; limit: number; search?: string }) {
  const { items: lazs, total, totalPages } = await lazService.getLazs(page, limit, search);

  return (
    <LazTable
      lazs={lazs}
      search={search}
      pagination={{
        currentPage: page,
        totalPages,
        totalCount: total,
        pageSize: limit,
      }}
    />
  );
}

function TableSkeleton({ limit = 3 }: { limit?: number }) {
  const skeletonCount = Math.min(limit, 3);
  return (
    <div className="space-y-4 w-full">
      <div className="overflow-hidden rounded-2xl bg-surface shadow-sm w-full">
        <table className="min-w-full divide-y divide-border/40 align-middle">
          <thead className="bg-surface-soft">
            <tr>
              <th scope="col" className="px-3 py-3.5 text-sm font-semibold text-primary text-left">Logo</th>
              <th scope="col" className="px-3 py-3.5 text-sm font-semibold text-primary text-left">Nama Organisasi</th>
              <th scope="col" className="px-3 py-3.5 text-sm font-semibold text-primary text-left">Slug</th>
              <th scope="col" className="px-3 py-3.5 text-sm font-semibold text-primary text-left">Status</th>
              <th scope="col" className="px-3 py-3.5 text-sm font-semibold text-primary text-left">Tanggal Terdaftar</th>
              <th scope="col" className="px-3 py-3.5 text-sm font-semibold text-primary text-right font-mono">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 bg-surface">
            {Array.from({ length: skeletonCount }).map((_, rIdx) => (
              <tr key={rIdx}>
                <td className="px-3 py-4"><Skeleton className="h-10 w-10 rounded-lg" /></td>
                <td className="px-3 py-4"><Skeleton className="h-5 w-48" /></td>
                <td className="px-3 py-4"><Skeleton className="h-5 w-24" /></td>
                <td className="px-3 py-4"><Skeleton className="h-5 w-16" /></td>
                <td className="px-3 py-4"><Skeleton className="h-5 w-28" /></td>
                <td className="px-3 py-4 text-right"><Skeleton className="h-5 w-8 ml-auto" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
