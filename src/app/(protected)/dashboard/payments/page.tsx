import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { redirect } from "next/navigation";
import { CreditCard } from "lucide-react";

export const metadata = {
  title: "Payments | LAZ Platform",
};

export default async function PaymentsPage() {
  const session = await auth();

  if (!session?.user?.permissions.includes(PERMISSIONS.PAYMENTS_READ)) {
    redirect("/dashboard");
  }

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

      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 mb-4">
          <CreditCard className="h-6 w-6 text-indigo-600" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">Fitur Manajemen Pembayaran</h3>
        <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
          Halaman ini sedang dalam pengembangan. Di masa mendatang, Anda dapat melihat riwayat invoice dan status transfer gateway di sini.
        </p>
      </div>
    </div>
  );
}
