import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { donationsService } from "@/features/donations/services/donations.service";
import { DonationTable } from "@/features/donations/components/DonationTable";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Donation Management | LAZ Platform",
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
  const search = typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : undefined;

  const { items: donations, metadata } = await donationsService.getDashboardDonations(page, 10, search);

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">Data Donasi Masuk</h1>
          <p className="mt-2 text-sm text-gray-700">
            Daftar semua transaksi donasi yang masuk ke platform.
          </p>
        </div>
      </div>

      <DonationTable donations={donations} />

      {/* Pagination Controls */}
      {metadata.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-md shadow-sm">
          <p className="text-sm text-gray-700">
            Halaman <span className="font-medium">{page}</span> dari <span className="font-medium">{metadata.totalPages}</span>
          </p>
        </div>
      )}
    </div>
  );
}
