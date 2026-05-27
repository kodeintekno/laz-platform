import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { usersService } from "@/features/users/services/users.service";
import { UserTable } from "@/features/users/components/UserTable";
import { redirect } from "next/navigation";
import { Pagination } from "@/components/ui/Pagination";


export const metadata = {
  title: "User Management",
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  
  // Guard
  if (!session?.user?.permissions.includes(PERMISSIONS.USERS_READ)) {
    redirect("/dashboard");
  }

  const resolvedSearchParams = await searchParams;
  const page = typeof resolvedSearchParams.page === "string" ? parseInt(resolvedSearchParams.page) : 1;
  const search = typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : undefined;

  const canManageRoles = session.user.permissions.includes(PERMISSIONS.USERS_MANAGE_ROLES);

  const [{ items: users, metadata }, roles] = await Promise.all([
    usersService.getUsers(page, 10, search),
    canManageRoles ? usersService.getRoles() : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-primary">User Management</h1>
          <p className="mt-2 text-sm text-secondary">
            Daftar semua pengguna terdaftar, termasuk donatur, admin, dan relawan.
          </p>
        </div>
      </div>

      {/* TODO: Search Input Component */}

      <UserTable 
        users={users} 
        roles={roles} 
        canManageRoles={canManageRoles} 
      />

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

