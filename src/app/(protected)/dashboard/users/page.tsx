import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { usersService } from "@/features/users/services/users.service";
import { UserTable } from "@/features/users/components/UserTable";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button, PageHeader, TableSkeleton } from "@/components/ui";
import { logger } from "@/lib/logger";
import { Suspense } from "react";
import { DataTableToolbar, DataTableToolbarSkeleton } from "@/components/ui/data-table";

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

  const canCreate = session.user.permissions.includes(PERMISSIONS.USERS_CREATE);
  const isSuperAdmin = session.user.roleName === "SUPER_ADMIN";

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Daftar semua pengguna terdaftar, termasuk donatur, admin, dan relawan."
        action={
          canCreate && (
            <Link href="/dashboard/users/new">
              <Button size="md">Tambah Pengguna</Button>
            </Link>
          )
        }
      />

      <Suspense fallback={<DataTableToolbarSkeleton />}>
        <DataTableToolbar searchValue={search} searchPlaceholder="Cari nama atau email..." />
      </Suspense>

      <Suspense
        key={`${search}-${page}-${limit}`}
        fallback={
          <TableSkeleton
            headers={
              isSuperAdmin
                ? ["Nama", "Email", "Status", "Role / Peran", "Lembaga Zakat (LAZ)", "Aksi"]
                : ["Nama", "Email", "Status", "Role / Peran", "Aksi"]
            }
            rowCount={limit}
            columnTypes={
              isSuperAdmin
                ? ["avatar", "text", "text", "text", "text", "action"]
                : ["avatar", "text", "text", "text", "action"]
            }
          />
        }
      >
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
