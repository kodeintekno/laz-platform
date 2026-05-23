import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { redirect } from "next/navigation";
import { paymentsService } from "@/features/payments/services/payments.service";
import { Badge, Input, Button, Pagination, EmptyState } from "@/components/ui";
import Link from "next/link";

export const metadata = {
  title: "Payments | LAZ Platform",
};

function getStatusIntent(status: string): "success" | "warning" | "destructive" | "info" | "muted" {
  switch (status) {
    case "SUCCESS":
      return "success";
    case "PENDING":
      return "warning";
    case "FAILED":
    case "CANCELLED":
      return "destructive";
    case "EXPIRED":
    default:
      return "muted";
  }
}

const formatRupiah = (amount: number | string) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(amount));
};

const formatDate = (date: Date | string) => {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
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

  const { items: payments, metadata } = await paymentsService.getPayments(page, 10, search);

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">Manajemen Pembayaran</h1>
          <p className="mt-2 text-sm text-gray-700">
            Kelola transaksi pembayaran donasi, detail invoice, dan integrasi payment gateway.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <form method="GET" className="flex items-center gap-2 max-w-md">
        <Input
          name="search"
          defaultValue={search || ""}
          placeholder="Cari invoice, program, atau donatur..."
          className="w-full bg-white"
        />
        <Button type="submit">Cari</Button>
        {search && (
          <Link href="?">
            <Button type="button" intent="outline">Reset</Button>
          </Link>
        )}
      </form>

      {payments.length === 0 ? (
        <EmptyState
          title="Tidak ada transaksi pembayaran"
          description="Daftar pembayaran kosong atau tidak ada catatan yang sesuai dengan pencarian Anda."
        />
      ) : (
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300 bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                  Invoice / Ref
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Program
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Donatur
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Nominal
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Metode
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Status
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Tanggal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {payments.map((payment: any) => (
                <tr key={payment.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-mono text-gray-900 sm:pl-6 select-all">
                    {payment.gatewayRef || payment.id}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500 max-w-[200px] truncate" title={payment.donation.program.title}>
                    {payment.donation.program.title}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <div className="font-medium text-gray-900">
                      {payment.donation.isAnonymous ? "Hamba Allah" : payment.donation.user?.name || "Hamba Allah"}
                      {payment.donation.isAnonymous && payment.donation.user && (
                        <span className="ml-2 text-xs text-gray-400 font-normal">(Asli: {payment.donation.user.name})</span>
                      )}
                    </div>
                    {payment.donation.user?.email && (
                      <div className="text-xs text-gray-400 mt-0.5">{payment.donation.user.email}</div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm font-semibold text-gray-900">
                    {formatRupiah(payment.amount)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 font-medium">
                    {payment.paymentMethod ? payment.paymentMethod.replace("_", " ") : "-"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <Badge intent={getStatusIntent(payment.status)}>
                      {payment.status}
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {formatDate(payment.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination controls */}
      {metadata.totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={metadata.totalPages}
          totalCount={metadata.total}
          pageSize={10}
        />
      )}
    </div>
  );
}
