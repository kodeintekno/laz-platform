import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { programsService } from "@/features/programs/services/programs.service";
import { ProgramTable } from "@/features/programs/components/ProgramTable";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button, Pagination } from "@/components/ui";

export const metadata = {
  title: "Program Management | LAZ Platform",
};

export default async function ProgramsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  
  if (!session?.user?.permissions.includes(PERMISSIONS.PROGRAMS_READ)) {
    redirect("/dashboard");
  }

  const resolvedSearchParams = await searchParams;
  const page = typeof resolvedSearchParams.page === "string" ? parseInt(resolvedSearchParams.page) : 1;
  const search = typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : undefined;

  const canCreate = session.user.permissions.includes(PERMISSIONS.PROGRAMS_CREATE);
  const { items: programs, metadata } = await programsService.getDashboardPrograms(page, 10, search);

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-text-primary">Program Management</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Kelola semua program kampanye zakat, infak, dan sedekah.
          </p>
        </div>
        {canCreate && (
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <Link href="/dashboard/programs/new">
              <Button size="sm">Buat Program</Button>
            </Link>
          </div>
        )}
      </div>

      <ProgramTable programs={programs} />

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
