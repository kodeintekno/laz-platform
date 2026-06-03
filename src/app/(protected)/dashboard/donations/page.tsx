import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { donationsService } from "@/features/donations/services/donations.service";
import { lazService } from "@/features/laz/services/laz.service";
import { DonationTable } from "@/features/donations/components/DonationTable";
import { UserLazFilter } from "@/features/users/components/UserLazFilter";
import { redirect } from "next/navigation";
import { PageHeader, TableSkeleton, Button } from "@/components/ui";
import { DataTableToolbar } from "@/components/ui/data-table";
import { Suspense } from "react";
import Link from "next/link";

export const metadata = {
  title: "Donation Management",
};

export default async function DonationsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  
  if (!session?.user?.permissions.includes(PERMISSIONS.DONATIONS_READ)) {
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
        title="Data Donasi Masuk"
        description="Daftar semua transaksi donasi yang masuk ke platform."
        action={
          session.user.permissions.includes(PERMISSIONS.DONATIONS_CREATE) ? (
            <Link href="/dashboard/donations/new">
              <Button intent="primary">Tambah Donasi</Button>
            </Link>
          ) : undefined
        }
      />

      <Suspense fallback={<div className="h-10 w-full animate-pulse bg-surface-muted rounded-xl" />}>
        <DataTableToolbar
          searchValue={search}
          searchPlaceholder="Cari donatur atau program..."
          filterSlot={isSuperAdmin && allLazs.length > 0 ? <UserLazFilter lazs={allLazs} /> : undefined}
        />
      </Suspense>

      <Suspense
        key={`${search}-${page}-${limit}-${filterLazId}`}
        fallback={
          <TableSkeleton
            headers={["Donatur", "Program", "Nominal", "Status", "Tanggal", "Aksi"]}
            rowCount={limit}
            columnTypes={["avatar", "text", "text", "text", "text", "action"]}
          />
        }
      >
        <DonationsTableSection page={page} limit={limit} search={search} lazId={filterLazId} />
      </Suspense>
    </div>
  );
}

async function DonationsTableSection({ page, limit, search, lazId }: { page: number; limit: number; search?: string; lazId?: string }) {
  const { items: donations, metadata } = await donationsService.getDashboardDonations(page, limit, search, lazId);

  return (
    <DonationTable 
      donations={donations} 
      pagination={{
        currentPage: page,
        totalPages: metadata.totalPages,
        totalCount: metadata.total,
        pageSize: limit,
      }}
    />
  );
}

