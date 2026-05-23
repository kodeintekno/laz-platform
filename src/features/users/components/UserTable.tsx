"use client";

import { RoleSelect } from "./RoleSelect";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Prisma } from "@prisma/client";

type UserWithRole = Prisma.UserGetPayload<{
  include: { role: { select: { id: true; name: true } } };
}>;

interface UserTableProps {
  users: UserWithRole[];
  roles: { id: string; name: string }[];
  canManageRoles: boolean;
}

export function UserTable({ users, roles, canManageRoles }: UserTableProps) {
  if (users.length === 0) {
    return (
      <EmptyState
        title="Tidak ada pengguna ditemukan"
        description="Daftar pengguna kosong atau tidak ada data yang sesuai."
      />
    );
  }

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
              Name
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Email
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Status
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Role
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {users.map((user) => (
            <tr key={user.id}>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                {user.name}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {user.email}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                <Badge intent={user.status === "ACTIVE" ? "success" : "destructive"}>
                  {user.status}
                </Badge>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {canManageRoles && user.roleId ? (
                  <RoleSelect 
                    userId={user.id} 
                    currentRoleId={user.roleId} 
                    roles={roles} 
                  />
                ) : (
                  <Badge intent="muted">
                    {user.role?.name || "N/A"}
                  </Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

