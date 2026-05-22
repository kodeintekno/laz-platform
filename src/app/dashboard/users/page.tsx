import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { usersService } from "@/features/users/services/users.service";
import { UserTable } from "@/features/users/components/UserTable";
import { redirect } from "next/navigation";

export const metadata = {
  title: "User Management | LAZ Platform",
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
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">User Management</h1>
          <p className="mt-2 text-sm text-gray-700">
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

      {/* Pagination controls */}
      {metadata.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-md shadow-sm">
          <div className="flex flex-1 justify-between sm:hidden">
            <a
              href={`?page=${Math.max(1, page - 1)}`}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Previous
            </a>
            <a
              href={`?page=${Math.min(metadata.totalPages, page + 1)}`}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Next
            </a>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Menampilkan halaman <span className="font-medium">{page}</span> dari{" "}
                <span className="font-medium">{metadata.totalPages}</span> ({metadata.total} total)
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <a
                  href={`?page=${Math.max(1, page - 1)}`}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                >
                  <span className="sr-only">Previous</span>
                  &laquo;
                </a>
                <a
                  href={`?page=${Math.min(metadata.totalPages, page + 1)}`}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                >
                  <span className="sr-only">Next</span>
                  &raquo;
                </a>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
