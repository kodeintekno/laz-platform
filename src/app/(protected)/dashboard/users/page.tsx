import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { usersService } from "@/features/users/services/users.service";
import { UserTable } from "@/features/users/components/UserTable";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui";
import { logger } from "@/lib/logger";
import { Suspense } from "react";
import { DataTableToolbar, DataTableToolbarSkeleton } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/Skeleton";

export const metadata = {
  title: "User Management",
};

export const dynamic = "force-dynamic";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  
  if (!session?.user?.permissions.includes(PERMISSIONS.USERS_READ)) {
    redirect("/dashboard");
  }

  const resolvedSearchParams = await searchParams;

  logger.info({ resolvedSearchParams }, "Users Page search params resolved");
  const page = typeof resolvedSearchParams.page === "string" ? parseInt(resolvedSearchParams.page) : 1;
  const limit = typeof resolvedSearchParams.limit === "string" ? parseInt(resolvedSearchParams.limit) : 10;
  const search = typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : undefined;

  const isSuperAdmin = session.user.roleName === "SUPER_ADMIN";
  const canCreate = session.user.permissions.includes(PERMISSIONS.USERS_CREATE);

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-primary">User Management</h1>
          <p className="mt-2 text-sm text-secondary">
            Daftar semua pengguna terdaftar, termasuk donatur, admin, dan relawan.
          </p>
        </div>
        {canCreate && (
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <Link href="/dashboard/users/new">
              <Button size="md">Tambah Pengguna</Button>
            </Link>
          </div>
        )}
      </div>

      <Suspense fallback={<DataTableToolbarSkeleton />}>
        <DataTableToolbar searchValue={search} searchPlaceholder="Cari nama atau email..." />
      </Suspense>

      <Suspense key={`${search}-${page}-${limit}`} fallback={<TableSkeleton limit={limit} showLaz={isSuperAdmin} />}>
        <UserTableSection
          page={page}
          limit={limit}
          search={search}
          isSuperAdmin={isSuperAdmin}
          currentUserId={session.user.id}
          adminLazId={session.user.lazId}
        />
      </Suspense>
    </div>
  );
}

async function UserTableSection({
  page,
  limit,
  search,
  isSuperAdmin,
  currentUserId,
  adminLazId,
}: {
  page: number;
  limit: number;
  search?: string;
  isSuperAdmin: boolean;
  currentUserId: string;
  adminLazId?: string;
}) {
  const queryLazId = isSuperAdmin ? undefined : adminLazId;

  const [{ items: users, metadata }, roles] = await Promise.all([
    usersService.getUsers(page, limit, search, queryLazId),
    usersService.getRoles(),
  ]);

  return (
    <UserTable
      users={users as any}
      roles={roles}
      isSuperAdmin={isSuperAdmin}
      currentUserId={currentUserId}
      pagination={{
        currentPage: page,
        totalPages: metadata.totalPages,
        totalCount: metadata.total,
        pageSize: limit,
      }}
    />
  );
}

function TableSkeleton({ limit = 3, showLaz = false }: { limit?: number; showLaz?: boolean }) {
  const skeletonCount = Math.min(limit, 3);
  return (
    <div className="space-y-4 w-full">
      <div className="overflow-hidden rounded-2xl bg-surface shadow-sm w-full">
        <table className="min-w-full divide-y divide-border/40 align-middle">
          <thead className="bg-surface-soft">
            <tr>
              <th scope="col" className="px-3 py-3.5 text-sm font-semibold text-primary text-left">Nama</th>
              <th scope="col" className="px-3 py-3.5 text-sm font-semibold text-primary text-left">Email</th>
              <th scope="col" className="px-3 py-3.5 text-sm font-semibold text-primary text-left">Status</th>
              <th scope="col" className="px-3 py-3.5 text-sm font-semibold text-primary text-left">Role / Peran</th>
              {showLaz && <th scope="col" className="px-3 py-3.5 text-sm font-semibold text-primary text-left">Lembaga Zakat (LAZ)</th>}
              <th scope="col" className="px-3 py-3.5 text-sm font-semibold text-primary text-right font-mono">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 bg-surface">
            {Array.from({ length: skeletonCount }).map((_, rIdx) => (
              <tr key={rIdx}>
                <td className="px-3 py-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                </td>
                <td className="px-3 py-4"><Skeleton className="h-5 w-48" /></td>
                <td className="px-3 py-4"><Skeleton className="h-5 w-16" /></td>
                <td className="px-3 py-4"><Skeleton className="h-5 w-24" /></td>
                {showLaz && <td className="px-3 py-4"><Skeleton className="h-5 w-36" /></td>}
                <td className="px-3 py-4 text-right"><Skeleton className="h-5 w-8 ml-auto" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
