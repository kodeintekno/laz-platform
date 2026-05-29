import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { donationsService } from "@/features/donations/services/donations.service";
import { DonationTable } from "@/features/donations/components/DonationTable";
import { redirect } from "next/navigation";
import { Pagination, PageHeader } from "@/components/ui";

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
  const search = typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : undefined;

  const { items: donations, metadata } = await donationsService.getDashboardDonations(page, 10, search);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Donasi Masuk"
        description="Daftar semua transaksi donasi yang masuk ke platform."
      />

      <DonationTable donations={donations} />

      {/* Pagination Controls */}
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
