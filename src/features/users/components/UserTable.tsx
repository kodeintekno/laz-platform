"use client";

import { RoleSelect } from "./RoleSelect";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
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
  const columns: ColumnDef<UserWithRole>[] = [
    {
      header: "Name",
      accessorKey: "name",
      cell: (user) => <span className="font-semibold text-text-primary">{user.name}</span>,
    },
    {
      header: "Email",
      accessorKey: "email",
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (user) => (
        <Badge intent={user.status === "ACTIVE" ? "success" : "destructive"}>
          {user.status}
        </Badge>
      ),
    },
    {
      header: "Role",
      cell: (user) => {
        if (canManageRoles && user.roleId) {
          return (
            <RoleSelect 
              userId={user.id} 
              currentRoleId={user.roleId} 
              roles={roles} 
            />
          );
        }
        return (
          <Badge intent="muted">
            {user.role?.name || "N/A"}
          </Badge>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={users}
      emptyTitle="Tidak ada pengguna ditemukan"
      emptyDescription="Daftar pengguna kosong atau tidak ada data yang sesuai."
    />
  );
}


