import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { redirect } from "next/navigation";
import { paymentsService } from "@/features/payments/services/payments.service";
import { PaymentTable } from "@/features/payments/components/PaymentTable";

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

  const { items: payments, metadata: paginatedMetadata } = await paymentsService.getPayments(page, 10, search);

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-primary">Manajemen Pembayaran</h1>
          <p className="mt-2 text-sm text-secondary">
            Kelola transaksi pembayaran donasi, detail invoice, dan integrasi payment gateway.
          </p>
        </div>
      </div>

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
    </div>
  );
}
