import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { redirect } from "next/navigation";
import { paymentsService } from "@/features/payments/services/payments.service";
import { PaymentTable } from "@/features/payments/components/PaymentTable";
import { PageHeader, TableSkeleton } from "@/components/ui";
import { Suspense } from "react";
import { lazService } from "@/features/laz/services/laz.service";
import { UserLazFilter } from "@/features/users/components/UserLazFilter";
import { DataTableToolbar } from "@/components/ui/data-table";

export const metadata = {
  title: "Payments",
};

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();

  if (!session?.user?.permissions.includes(PERMISSIONS.PAYMENTS_READ)) {
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
        title="Manajemen Pembayaran"
        description="Kelola transaksi pembayaran donasi, detail invoice, dan integrasi payment gateway."
      />

      <Suspense fallback={<div className="h-10 w-full animate-pulse bg-surface-muted rounded-xl" />}>
        <DataTableToolbar
          searchValue={search}
          searchPlaceholder="Cari invoice, program, atau donatur..."
          filterSlot={isSuperAdmin && allLazs.length > 0 ? <UserLazFilter lazs={allLazs} /> : undefined}
        />
      </Suspense>

      <Suspense
        key={`${search}-${page}-${limit}-${filterLazId}`}
        fallback={
          <TableSkeleton
            headers={["Invoice / Ref", "Program", "Donatur", "Nominal", "Metode", "Status", "Tanggal"]}
            rowCount={limit}
            columnTypes={["text", "text", "avatar", "text", "text", "text", "text"]}
          />
        }
      >
        <PaymentsTableSection page={page} limit={limit} search={search} lazId={filterLazId} />
      </Suspense>
    </div>
  );
}

async function PaymentsTableSection({ page, limit, search, lazId }: { page: number; limit: number; search?: string; lazId?: string }) {
  const { items: rawPayments, metadata: paginatedMetadata } = await paymentsService.getPayments(page, limit, search, lazId);

  const payments = rawPayments.map(p => ({
    ...p,
    amount: Number(p.amount),
    donation: p.donation ? {
      ...p.donation,
      amount: Number(p.donation.amount)
    } : null
  }));

  return (
    <PaymentTable
      payments={payments as any}
      search={search}
      pagination={{
        currentPage: page,
        totalPages: paginatedMetadata.totalPages,
        totalCount: paginatedMetadata.total,
        pageSize: limit,
      }}
    />
  );
}

