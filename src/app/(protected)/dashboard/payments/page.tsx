import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { redirect } from "next/navigation";
import { paymentsService } from "@/features/payments/services/payments.service";
import { PaymentTable } from "@/features/payments/components/PaymentTable";
import { PageHeader, TableSkeleton } from "@/components/ui";
import { Suspense } from "react";

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
  const search = typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Pembayaran"
        description="Kelola transaksi pembayaran donasi, detail invoice, dan integrasi payment gateway."
      />

      <Suspense
        key={`${search}-${page}`}
        fallback={
          <TableSkeleton
            headers={["Invoice / Ref", "Program", "Donatur", "Nominal", "Metode", "Status", "Tanggal"]}
            rowCount={10}
            columnTypes={["text", "text", "avatar", "text", "text", "text", "text"]}
          />
        }
      >
        <PaymentsTableSection page={page} search={search} />
      </Suspense>
    </div>
  );
}

async function PaymentsTableSection({ page, search }: { page: number; search?: string }) {
  const { items: payments, metadata: paginatedMetadata } = await paymentsService.getPayments(page, 10, search);

  return (
    <PaymentTable
      payments={payments}
      search={search}
      pagination={{
        currentPage: page,
        totalPages: paginatedMetadata.totalPages,
        totalCount: paginatedMetadata.total,
        pageSize: 10,
      }}
    />
  );
}

