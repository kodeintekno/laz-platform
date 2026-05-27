import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { distributionsService } from "@/features/distributions/services/distributions.service";
import { DistributionTable } from "@/features/distributions/components/DistributionTable";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Penyaluran Dana | LAZ Platform",
};

export default async function DistributionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  
  if (!session?.user?.permissions.includes(PERMISSIONS.DISTRIBUTIONS_READ)) {
    redirect("/dashboard");
  }

  const resolvedSearchParams = await searchParams;
  const page = typeof resolvedSearchParams.page === "string" ? parseInt(resolvedSearchParams.page) : 1;
  const search = typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : undefined;

  const { items: distributions, metadata } = await distributionsService.getDashboardDistributions(page, 10, search);

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-text-primary">Manajemen Penyaluran Dana</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Daftar pengajuan penyaluran dana dari berbagai program kampanye.
          </p>
        </div>
      </div>

      <DistributionTable distributions={distributions} />

      {/* Pagination Controls */}
      {metadata.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border bg-surface px-4 py-3 sm:px-6 mt-4 rounded-xl shadow-sm">
          <p className="text-sm text-text-secondary">
            Halaman <span className="font-medium">{page}</span> dari <span className="font-medium">{metadata.totalPages}</span>
          </p>
        </div>
      )}
    </div>
  );
}
