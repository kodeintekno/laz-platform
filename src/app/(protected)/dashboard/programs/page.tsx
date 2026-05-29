import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { programsService } from "@/features/programs/services/programs.service";
import { ProgramTable } from "@/features/programs/components/ProgramTable";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button, Pagination, PageHeader, TableSkeleton } from "@/components/ui";
import { Suspense } from "react";

export const metadata = {
  title: "Program Management",
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Program Management"
        description="Kelola semua program kampanye zakat, infak, dan sedekah."
        action={
          canCreate ? (
            <Link href="/dashboard/programs/new">
              <Button size="sm">Buat Program</Button>
            </Link>
          ) : undefined
        }
      />

      <Suspense
        key={`${search}-${page}`}
        fallback={
          <TableSkeleton
            headers={["Judul Program", "Kategori", "Terkumpul", "Status", "Aksi"]}
            rowCount={10}
            columnTypes={["text", "text", "text", "text", "action"]}
          />
        }
      >
        <ProgramsTableSection page={page} search={search} />
      </Suspense>
    </div>
  );
}

async function ProgramsTableSection({ page, search }: { page: number; search?: string }) {
  const { items: programs, metadata } = await programsService.getDashboardPrograms(page, 10, search);

  return (
    <>
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
    </>
  );
}

