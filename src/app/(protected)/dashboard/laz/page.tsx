import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { lazService } from "@/features/laz/services/laz.service";
import { LazTable } from "@/features/laz/components/LazTable";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button, PageHeader, TableSkeleton } from "@/components/ui";
import { logger } from "@/lib/logger";
import { Suspense } from "react";
import { DataTableToolbar, DataTableToolbarSkeleton } from "@/components/ui/data-table";

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
      <PageHeader
        title="LAZ Management"
        description="Kelola lembaga-lembaga amil zakat (LAZ) yang terdaftar."
        action={
          <Link href="/dashboard/laz/new">
            <Button size="md">Tambah LAZ</Button>
          </Link>
        }
      />

      <Suspense fallback={<DataTableToolbarSkeleton />}>
        <DataTableToolbar searchValue={search} searchPlaceholder="Cari nama organisasi atau slug..." />
      </Suspense>

      <Suspense
        key={`${search}-${page}-${limit}`}
        fallback={
          <TableSkeleton
            headers={["Logo", "Nama Organisasi", "Slug", "Status", "Tanggal Terdaftar", "Aksi"]}
            rowCount={limit}
            columnTypes={["image", "text", "text", "text", "text", "action"]}
          />
        }
      >
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

