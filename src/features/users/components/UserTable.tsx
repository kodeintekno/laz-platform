"use client";

import { RoleSelect } from "./RoleSelect";
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
                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                  user.status === 'ACTIVE' 
                    ? 'bg-green-50 text-green-700 ring-green-600/20' 
                    : 'bg-red-50 text-red-700 ring-red-600/20'
                }`}>
                  {user.status}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {canManageRoles && user.roleId ? (
                  <RoleSelect 
                    userId={user.id} 
                    currentRoleId={user.roleId} 
                    roles={roles} 
                  />
                ) : (
                  <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                    {user.role?.name || "N/A"}
                  </span>
                )}
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={4} className="py-8 text-center text-sm text-gray-500">
                Tidak ada pengguna ditemukan.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
